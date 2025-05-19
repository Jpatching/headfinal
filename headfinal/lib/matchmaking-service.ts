import { v4 as uuidv4 } from 'uuid';
import { 
  redis,
  getPlayerKey, 
  matchRequestPrefix,
  matchPrefix,
  pendingMatchesByAmountPrefix,
  getPendingMatchesByAmountKey,
} from './redis-client';

// Types
export interface MatchRequest {
  id: string;
  playerPublicKey: string;
  betAmount: number;
  timestamp: number;
  status: "pending" | "matched" | "cancelled" | "expired";
  matchId?: string;
}

export interface Match {
  id: string;
  player1PublicKey: string;
  player2PublicKey: string;
  betAmount: number;
  timestamp: number;
  status: "active" | "completed" | "cancelled";
  winnerId?: string;
}

/**
 * Creates a new match request and adds it to the pending queue
 */
export async function createMatchRequest(request: MatchRequest): Promise<MatchRequest> {
  try {
    const requestKey = `${matchRequestPrefix}${request.id}`;
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    // Use a Redis transaction to ensure both operations succeed or fail together
    const pipeline = redis.pipeline();
    
    // Store the request details
    pipeline.set(requestKey, JSON.stringify(request));
    
    // Add to the sorted set of pending matches by amount
    pipeline.zadd(pendingMatchesKey, request.timestamp, request.id);
    
    // Execute both commands
    await pipeline.exec();
    
    console.log(`Created match request ${request.id} for player ${request.playerPublicKey}`);
    return request;
  } catch (error) {
    console.error('Error creating match request:', error);
    throw error;
  }
}

/**
 * Tries to find a match for a player's request
 * Uses Redis transactions to ensure atomicity and prevent race conditions
 */
export async function findMatch(request: MatchRequest): Promise<Match | null> {
  try {
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    // Use Redis WATCH to create an optimistic lock on the pending matches set
    await redis.watch(pendingMatchesKey);
    
    // Try to find a pending match request (oldest first)
    // Exclude the current player's own requests
    const pendingRequests = await redis.zrange(pendingMatchesKey, 0, -1);
    
    for (const requestId of pendingRequests) {
      const requestKey = `${matchRequestPrefix}${requestId}`;
      const pendingRequest = await redis.get(requestKey);
      
      if (!pendingRequest) continue;
      
      const parsedRequest = JSON.parse(pendingRequest) as MatchRequest;
      
      // Skip if this is the same player or request is not pending
      if (parsedRequest.playerPublicKey === request.playerPublicKey || 
          parsedRequest.status !== 'pending') {
        continue;
      }
      
      // We found a match! Create a match record atomically
      const match: Match = {
        id: uuidv4(),
        player1PublicKey: parsedRequest.playerPublicKey,
        player2PublicKey: request.playerPublicKey,
        betAmount: request.betAmount,
        timestamp: Date.now(),
        status: "active"
      };
      
      // Use a transaction to ensure all operations succeed or fail together
      const multi = redis.multi();
      
      // Update the pending request to matched
      parsedRequest.status = 'matched';
      parsedRequest.matchId = match.id;
      multi.set(requestKey, JSON.stringify(parsedRequest));
      
      // Remove the request from pending set
      multi.zrem(pendingMatchesKey, requestId);
      
      // Store the match
      multi.set(`${matchPrefix}${match.id}`, JSON.stringify(match));
      
      // Execute the transaction
      const result = await multi.exec();
      
      // If transaction succeeded, return the match
      if (result) {
        console.log(`Created match ${match.id} between ${match.player1PublicKey} and ${match.player2PublicKey}`);
        return match;
      }
    }
    
    // If no match was found, release the watch
    await redis.unwatch();
    return null;
  } catch (error) {
    console.error('Error finding match:', error);
    await redis.unwatch();
    throw error;
  }
}

/**
 * Cancels a pending match request
 */
export async function cancelMatchRequest(requestId: string): Promise<boolean> {
  try {
    const requestKey = `${matchRequestPrefix}${requestId}`;
    
    // Get the request
    const requestData = await redis.get(requestKey);
    if (!requestData) return false;
    
    const request = JSON.parse(requestData) as MatchRequest;
    
    // Only pending requests can be cancelled
    if (request.status !== 'pending') return false;
    
    // Mark as cancelled and remove from pending queue
    request.status = 'cancelled';
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    const pipeline = redis.pipeline();
    pipeline.set(requestKey, JSON.stringify(request));
    pipeline.zrem(pendingMatchesKey, requestId);
    await pipeline.exec();
    
    console.log(`Cancelled match request ${requestId}`);
    return true;
  } catch (error) {
    console.error('Error cancelling match request:', error);
    throw error;
  }
}

/**
 * Gets the current status of a match request
 */
export async function getMatchStatus(requestId: string): Promise<{status: string, matchId?: string} | null> {
  try {
    const requestKey = `${matchRequestPrefix}${requestId}`;
    
    // Get the request
    const requestData = await redis.get(requestKey);
    if (!requestData) return null;
    
    const request = JSON.parse(requestData) as MatchRequest;
    
    return {
      status: request.status,
      matchId: request.matchId
    };
  } catch (error) {
    console.error('Error getting match status:', error);
    throw error;
  }
}

/**
 * Gets a match by ID
 */
export async function getMatch(matchId: string): Promise<Match | null> {
  try {
    const matchKey = `${matchPrefix}${matchId}`;
    
    // Get the match
    const matchData = await redis.get(matchKey);
    if (!matchData) return null;
    
    return JSON.parse(matchData) as Match;
  } catch (error) {
    console.error('Error getting match:', error);
    throw error;
  }
}

/**
 * Updates a match's status
 */
export async function updateMatchStatus(
  matchId: string, 
  status: "active" | "completed" | "cancelled",
  winnerId?: string
): Promise<Match | null> {
  try {
    const matchKey = `${matchPrefix}${matchId}`;
    
    // Get the match
    const matchData = await redis.get(matchKey);
    if (!matchData) return null;
    
    const match = JSON.parse(matchData) as Match;
    
    // Update status
    match.status = status;
    if (winnerId) {
      match.winnerId = winnerId;
    }
    
    // Save back to Redis
    await redis.set(matchKey, JSON.stringify(match));
    
    console.log(`Updated match ${matchId} status to ${status}`);
    return match;
  } catch (error) {
    console.error('Error updating match status:', error);
    throw error;
  }
}

/**
 * Process expired match requests (older than specified time)
 * This function should be called periodically by a CRON job or similar
 */
export async function processExpiredRequests(expiryTimeMs: number = 5 * 60 * 1000): Promise<number> {
  try {
    const now = Date.now();
    const cutoffTime = now - expiryTimeMs;
    let expiredCount = 0;
    
    // Get all pending matches keys
    const keys = await redis.keys(`${pendingMatchesByAmountPrefix}*`);
    
    for (const key of keys) {
      // Get all requests in this amount category
      const requests = await redis.zrangebyscore(key, 0, cutoffTime);
      
      for (const requestId of requests) {
        const requestKey = `${matchRequestPrefix}${requestId}`;
        const requestData = await redis.get(requestKey);
        
        if (requestData) {
          const request = JSON.parse(requestData) as MatchRequest;
          
          // Only process pending requests
          if (request.status === 'pending') {
            request.status = 'expired';
            await redis.set(requestKey, JSON.stringify(request));
            await redis.zrem(key, requestId);
            expiredCount++;
          }
        }
      }
    }
    
    console.log(`Processed ${expiredCount} expired match requests`);
    return expiredCount;
  } catch (error) {
    console.error('Error processing expired requests:', error);
    throw error;
  }
}
