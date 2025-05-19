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

// Add the missing function
function getMatchRequestKey(requestId: string): string {
  return `${matchRequestPrefix}${requestId}`;
}

/**
 * Creates a new match request for a player with a given bet amount
 * This is the simplified version that's used from the play page
 */
export async function createMatchRequest(playerPublicKey: string, betAmount: number): Promise<{matchRequest: MatchRequest | null, error: string | null}> {
  try {
    // Create a new match request
    const request: MatchRequest = {
      id: uuidv4(),
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending"
    };
    
    // Create the request directly
    const requestKey = getMatchRequestKey(request.id);
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    // Use a Redis pipeline to ensure both operations succeed or fail together
    const pipeline = redis.pipeline();
    
    // Store the request details
    pipeline.set(requestKey, JSON.stringify(request));
    
    // Add to the sorted set of pending matches by amount
    // Fix: Use the correct format for Upstash Redis ZADD
    pipeline.zadd(pendingMatchesKey, { score: request.timestamp, member: request.id });
    
    // Execute both commands
    await pipeline.exec();
    
    console.log(`Created match request ${request.id} for player ${request.playerPublicKey}`);
    
    return { matchRequest: request, error: null };
  } catch (error: any) {
    console.error('Error creating match request:', error);
    return { matchRequest: null, error: `Failed to create match request: ${error?.message || 'Unknown error'}` };
  }
}

/**
 * Creates a new match request and adds it to the pending queue
 */
export async function createMatchRequestObject(request: MatchRequest): Promise<MatchRequest> {
  try {
    const requestKey = getMatchRequestKey(request.id);
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    // Use a Redis pipeline to ensure both operations succeed or fail together
    const pipeline = redis.pipeline();
    
    // Store the request details
    pipeline.set(requestKey, JSON.stringify(request));
    
    // Add to the sorted set of pending matches by amount
    // Fix: Use the correct format for Upstash Redis ZADD
    pipeline.zadd(pendingMatchesKey, { score: request.timestamp, member: request.id });
    
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
 * Finds a match for an existing match request by ID
 * This is the version used from the play page
 */
export async function findMatch(requestId: string): Promise<{match: Match | null, error: string | null}> {
  try {
    // Get the request
    const requestKey = getMatchRequestKey(requestId);
    const requestData = await redis.get(requestKey);
    
    if (!requestData) {
      return { match: null, error: "Match request not found" };
    }
    
    const request = JSON.parse(requestData as string) as MatchRequest;
    
    // If the request is already matched, get the match
    if (request.status === 'matched' && request.matchId) {
      const match = await getMatch(request.matchId);
      return { match, error: null };
    }
    
    // Otherwise try to find a match
    const match = await findMatchInternal(request);
    
    if (match) {
      // Update the request to matched status
      request.status = 'matched';
      request.matchId = match.id;
      await redis.set(requestKey, JSON.stringify(request));
      
      // Remove from pending queue
      const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
      await redis.zrem(pendingMatchesKey, request.id);
      
      return { match, error: null };
    }
    
    return { match: null, error: null };
  } catch (error: any) {
    console.error('Error finding match:', error);
    return { match: null, error: `Failed to find match: ${error?.message || 'Unknown error'}` };
  }
}

/**
 * Tries to find a match for a player's request
 * Uses optimistic approach instead of Redis transactions which aren't supported in Upstash
 */
async function findMatchInternal(request: MatchRequest): Promise<Match | null> {
  try {
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    // Replace Redis WATCH with optimistic concurrency approach
    // Try to find a pending match request (oldest first)
    // Exclude the current player's own requests
    const pendingRequests = await redis.zrange(pendingMatchesKey, 0, -1);
    
    for (const requestId of pendingRequests) {
      const requestKey = getMatchRequestKey(requestId as string);
      const pendingRequest = await redis.get(requestKey);
      
      if (!pendingRequest) continue;
      
      const parsedRequest = JSON.parse(pendingRequest as string) as MatchRequest;
      
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
      
      // Use a pipeline instead of transaction
      const pipeline = redis.pipeline();
      
      // Update the pending request to matched
      parsedRequest.status = 'matched';
      parsedRequest.matchId = match.id;
      pipeline.set(requestKey, JSON.stringify(parsedRequest));
      
      // Remove the request from pending set
      pipeline.zrem(pendingMatchesKey, requestId as string);
      
      // Store the match
      pipeline.set(`${matchPrefix}${match.id}`, JSON.stringify(match));
      
      // Execute the pipeline
      const result = await pipeline.exec();
      
      // If pipeline succeeded, return the match
      if (result) {
        console.log(`Created match ${match.id} between ${match.player1PublicKey} and ${match.player2PublicKey}`);
        return match;
      }
    }
    
    // If no match was found
    return null;
  } catch (error) {
    console.error('Error finding match:', error);
    throw error;
  }
}

/**
 * Cancels a pending match request
 * Returns a standardized response format matching other functions
 */
export async function cancelMatchRequest(requestId: string): Promise<{success: boolean, error: string | null}> {
  try {
    if (!requestId) {
      return { success: false, error: "Invalid request ID" };
    }
    
    const requestKey = getMatchRequestKey(requestId);
    
    // Get the request
    const requestData = await redis.get(requestKey);
    if (!requestData) {
      return { success: false, error: "Match request not found" };
    }
    
    const request = JSON.parse(requestData as string) as MatchRequest;
    
    // Only pending requests can be cancelled
    if (request.status !== 'pending') {
      return { success: false, error: `Request is already ${request.status}` };
    }
    
    // Mark as cancelled and remove from pending queue
    request.status = 'cancelled';
    const pendingMatchesKey = getPendingMatchesByAmountKey(request.betAmount);
    
    const pipeline = redis.pipeline();
    pipeline.set(requestKey, JSON.stringify(request));
    pipeline.zrem(pendingMatchesKey, requestId);
    await pipeline.exec();
    
    console.log(`Cancelled match request ${requestId}`);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error cancelling match request:', error);
    return { success: false, error: `Failed to cancel match request: ${error?.message || 'Unknown error'}` };
  }
}

/**
 * Gets the current status of a match request
 */
export async function getMatchStatus(requestId: string): Promise<{status: string, matchId?: string} | null> {
  try {
    const requestKey = getMatchRequestKey(requestId);
    
    // Get the request
    const requestData = await redis.get(requestKey);
    if (!requestData) return null;
    
    const request = JSON.parse(requestData as string) as MatchRequest;
    
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
    
    return JSON.parse(matchData as string) as Match;
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
    
    const match = JSON.parse(matchData as string) as Match;
    
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
// Define interface for Redis zrange with scores result
interface ZRangeWithScores {
  member: string;
  score: number;
}

export async function processExpiredRequests(expiryTimeMs: number = 5 * 60 * 1000): Promise<number> {
  try {
    const now = Date.now();
    const cutoffTime = now - expiryTimeMs;
    let expiredCount = 0;
    
    // Get all pending matches keys
    const keys = await redis.keys(`${pendingMatchesByAmountPrefix}*`);
    
    for (const key of keys) {
      // Since zrangebyscore doesn't exist in Upstash Redis, use zrange with filter
      const allMembers = await redis.zrange(key, 0, -1, { withScores: true }) as ZRangeWithScores[];
      const expiredRequests = allMembers
        .filter(item => item.score < cutoffTime)
        .map(item => item.member);
      
      for (const requestId of expiredRequests) {
        const requestKey = getMatchRequestKey(requestId as string);
        const requestData = await redis.get(requestKey);
        
        if (requestData) {
          const request = JSON.parse(requestData as string) as MatchRequest;
          
          // Only process pending requests
          if (request.status === 'pending') {
            request.status = 'expired';
            await redis.set(requestKey, JSON.stringify(request));
            await redis.zrem(key, requestId as string);
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
