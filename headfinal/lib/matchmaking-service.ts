import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { 
  redis,
  getPlayerKey, 
  matchRequestPrefix,
  matchPrefix,
  pendingMatchesByAmountPrefix,
  getPendingMatchesByAmountKey,
} from './redis-client'

// Types
export interface MatchRequest {
  id: string
  playerPublicKey: string
  betAmount: number
  timestamp: number
  status: "pending" | "matched" | "cancelled" | "expired"
  matchId?: string
}

export interface Match {
  id: string
  player1PublicKey: string
  player2PublicKey: string
  betAmount: number
  timestamp: number
  status: "active" | "completed" | "cancelled"
  winnerId?: string
}

// Simple matchmaking service for the game

interface MatchDetails {
  id: string;
  player1PublicKey: string;
  player2PublicKey: string;
  betAmount: number;
  status: 'pending' | 'active' | 'completed';
  winner?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MatchResponse {
  match?: MatchDetails | null;
  error?: string | null;
}

interface CompleteMatchResponse {
  success: boolean;
  error?: string | null;
}

// Helper function to use KV if available, fallback to Redis client
async function getClient() {
  try {
    // Try to ping KV to check if it's available
    await kv.ping();
    console.log('Using KV client for matchmaking operations');
    return { useKv: true };
  } catch (error) {
    console.log('Falling back to Redis client for matchmaking operations');
    return { useKv: false };
  }
}

// Create a match request
export const createMatchRequest = async (
  playerPublicKey: string,
  betAmount: number,
): Promise<{ matchRequest: MatchRequest | null; error: string | null }> => {
  try {
    // Check which client to use
    const { useKv } = await getClient();
    
    console.log(`Creating match request using ${useKv ? 'KV' : 'Redis'} client`);
    
    // Generate a unique ID for the match request
    const matchRequestId = `${matchRequestPrefix}${uuidv4()}`
    
    // Create match request object
    const matchRequest: MatchRequest = {
      id: matchRequestId,
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending",
    }
    
    // Save to storage
    if (useKv) {
      await kv.set(matchRequestId, JSON.stringify(matchRequest));
      
      // Add to sorted set of pending matches by bet amount
      const betAmountKey = getPendingMatchesByAmountKey(betAmount);
      await kv.zadd(betAmountKey, { [matchRequestId]: Date.now() });
    } else {
      // Save to Redis
      await redisClient.set(matchRequestId, JSON.stringify(matchRequest));
      
      // Add to sorted set of pending matches by bet amount
      const betAmountKey = getPendingMatchesByAmountKey(betAmount);
      // Using the compatibility helper
      await zaddCompatible(redisClient, betAmountKey, Date.now(), matchRequestId);
    }
    
    console.log(`Created match request: ${matchRequestId} with bet amount: ${betAmount}`);
    
    return { matchRequest, error: null }
  } catch (error) {
    console.error("Error creating match request:", error)
    return {
      matchRequest: null,
      error: error instanceof Error ? error.message : "Unknown error creating match request",
    }
  }
}

// Find a match
export const findMatch = async (matchRequestId: string): Promise<{ match: Match | null; error: string | null }> => {
  try {
    console.log(`Finding match for request: ${matchRequestId}`);
    
    // Check which client to use
    const { useKv } = await getClient();
    
    // Get match request details
    let matchRequestData;
    if (useKv) {
      matchRequestData = await kv.get(matchRequestId);
    } else {
      matchRequestData = await redisClient.get(matchRequestId);
    }
    
    if (!matchRequestData) {
      console.log(`Match request not found: ${matchRequestId}`);
      return { match: null, error: "Match request not found" };
    }
    
    const matchRequest = JSON.parse(matchRequestData as string) as MatchRequest;
    console.log(`Found match request with status: ${matchRequest.status}`);
    
    // Check if already matched
    if (matchRequest.status === "matched" && matchRequest.matchId) {
      console.log(`Match request already matched with match ID: ${matchRequest.matchId}`);
      
      let matchData;
      if (useKv) {
        matchData = await kv.get(matchRequest.matchId);
      } else {
        matchData = await redisClient.get(matchRequest.matchId);
      }
      
      if (matchData) {
        const match = JSON.parse(matchData as string) as Match;
        return { match, error: null };
      }
    }
    
    // Only proceed if the request is still pending
    if (matchRequest.status !== "pending") {
      console.log(`Match request is not pending (status: ${matchRequest.status})`);
      return { match: null, error: null };
    }
    
    // Find other pending match requests with the same bet amount
    const betAmountKey = getPendingMatchesByAmountKey(matchRequest.betAmount);
    console.log(`Looking for pending matches in set: ${betAmountKey}`);
    
    let pendingMatches;
    if (useKv) {
      pendingMatches = await kv.zrange(betAmountKey, 0, -1);
    } else {
      pendingMatches = await redisClient.zrange(betAmountKey, 0, -1);
    }
    
    console.log(`Found ${pendingMatches.length} pending matches for amount ${matchRequest.betAmount}`);
    
    // Filter out our own match request and expired ones
    const otherMatchRequests: string[] = [];
    
    // Process each pending match
    for (const pendingMatchId of pendingMatches) {
      if (pendingMatchId === matchRequestId) {
        console.log(`Skipping our own match request: ${pendingMatchId}`);
        continue;
      }
      
      let pendingMatchData;
      if (useKv) {
        pendingMatchData = await kv.get(pendingMatchId);
      } else {
        pendingMatchData = await redisClient.get(pendingMatchId);
      }
      
      if (!pendingMatchData) {
        console.log(`Pending match ${pendingMatchId} not found in storage, skipping`);
        continue;
      }
      
      const pendingMatch = JSON.parse(pendingMatchData as string) as MatchRequest;
      
      // Check if not expired (10 minutes) and still pending
      const isExpired = Date.now() - pendingMatch.timestamp > 10 * 60 * 1000;
      
      if (isExpired) {
        console.log(`Match request ${pendingMatchId} is expired, marking as expired`);
        // Mark as expired
        pendingMatch.status = "expired";
        
        if (useKv) {
          await kv.set(pendingMatchId, JSON.stringify(pendingMatch));
          // Remove from pending set
          await kv.zrem(betAmountKey, pendingMatchId);
        } else {
          await redisClient.set(pendingMatchId, JSON.stringify(pendingMatch));
          // Remove from pending set
          await redisClient.zrem(betAmountKey, pendingMatchId);
        }
        continue;
      }
      
      if (pendingMatch.status !== "pending") {
        console.log(`Match request ${pendingMatchId} is not pending (status: ${pendingMatch.status}), skipping`);
        continue;
      }
      
      if (pendingMatch.playerPublicKey === matchRequest.playerPublicKey) {
        console.log(`Match request ${pendingMatchId} is from the same player, skipping`);
        continue;
      }
      
      console.log(`Found potential match: ${pendingMatchId}`);
      otherMatchRequests.push(pendingMatchId);
    }
    
    // If we found a match
    if (otherMatchRequests.length > 0) {
      console.log(`Found ${otherMatchRequests.length} potential matches, using the oldest one`);
      // Get the oldest pending match
      const opponentMatchId = otherMatchRequests[0];
      
      let opponentMatchData;
      if (useKv) {
        opponentMatchData = await kv.get(opponentMatchId);
      } else {
        opponentMatchData = await redisClient.get(opponentMatchId);
      }
      
      if (!opponentMatchData) {
        console.log(`Opponent match request ${opponentMatchId} not found in storage`);
        return { match: null, error: null };
      }
      
      const opponentMatch = JSON.parse(opponentMatchData as string) as MatchRequest;
      
      // Double-check it's still pending (race condition check)
      if (opponentMatch.status !== "pending") {
        console.log(`Opponent match request ${opponentMatchId} is no longer pending (status: ${opponentMatch.status})`);
        return { match: null, error: null };
      }
      
      // Create a new match
      const matchId = `${matchPrefix}${uuidv4()}`;
      const match: Match = {
        id: matchId,
        player1PublicKey: matchRequest.playerPublicKey,
        player2PublicKey: opponentMatch.playerPublicKey,
        betAmount: matchRequest.betAmount,
        timestamp: Date.now(),
        status: "active"
      };
      
      console.log(`Creating match with ID: ${matchId} between ${match.player1PublicKey.slice(0,6)}... and ${match.player2PublicKey.slice(0,6)}...`);
      
      // Save the match
      if (useKv) {
        await kv.set(matchId, JSON.stringify(match));
        
        // Update both match requests to "matched" status
        matchRequest.status = "matched";
        matchRequest.matchId = matchId;
        opponentMatch.status = "matched";
        opponentMatch.matchId = matchId;
        
        await kv.set(matchRequestId, JSON.stringify(matchRequest));
        await kv.set(opponentMatchId, JSON.stringify(opponentMatch));
        
        // Remove both from pending matches
        await kv.zrem(betAmountKey, matchRequestId);
        await kv.zrem(betAmountKey, opponentMatchId);
      } else {
        await redisClient.set(matchId, JSON.stringify(match));
        
        // Update both match requests to "matched" status
        matchRequest.status = "matched";
        matchRequest.matchId = matchId;
        opponentMatch.status = "matched";
        opponentMatch.matchId = matchId;
        
        await redisClient.set(matchRequestId, JSON.stringify(matchRequest));
        await redisClient.set(opponentMatchId, JSON.stringify(opponentMatch));
        
        // Remove both from pending matches
        await redisClient.zrem(betAmountKey, matchRequestId);
        await redisClient.zrem(betAmountKey, opponentMatchId);
      }
      
      console.log(`Match created successfully! Match ID: ${matchId}`);
      
      return { match, error: null };
    }
    
    // If we're in development, simulate a match after some time
    if (process.env.NODE_ENV !== "production") {
      // Check if this request has been pending for at least 5 seconds
      const pendingTime = Date.now() - matchRequest.timestamp;
      if (pendingTime > 5000) {
        console.log('Dev mode: Simulating match creation');
        
        // Generate a random opponent public key
        const opponentPublicKey = `opponent_${Math.random().toString(36).substring(2, 15)}`;
        
        // Create a match
        const matchId = `${matchPrefix}${uuidv4()}`;
        const match: Match = {
          id: matchId,
          player1PublicKey: matchRequest.playerPublicKey,
          player2PublicKey: opponentPublicKey,
          betAmount: matchRequest.betAmount,
          timestamp: Date.now(),
          status: "active"
        };
        
        // Save the match
        if (useKv) {
          await kv.set(matchId, JSON.stringify(match));
          
          // Update match request
          matchRequest.status = "matched";
          matchRequest.matchId = matchId;
          await kv.set(matchRequestId, JSON.stringify(matchRequest));
          
          // Remove from pending
          await kv.zrem(betAmountKey, matchRequestId);
        } else {
          await redisClient.set(matchId, JSON.stringify(match));
          
          // Update match request
          matchRequest.status = "matched";
          matchRequest.matchId = matchId;
          await redisClient.set(matchRequestId, JSON.stringify(matchRequest));
          
          // Remove from pending
          await redisClient.zrem(betAmountKey, matchRequestId);
        }
        
        console.log(`Dev mode: Simulated match created with ID: ${matchId}`);
        
        return { match, error: null };
      }
    }
    
    // No match found yet
    console.log('No match found yet, continuing to search');
    return { match: null, error: null };
  } catch (error) {
    console.error("Error finding match:", error);
    return {
      match: null,
      error: error instanceof Error ? error.message : "Unknown error finding match",
    };
  }
}

// Cancel a match request
export const cancelMatchRequest = async (
  matchRequestId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Check which client to use
    const { useKv } = await getClient();
    
    let matchRequestData;
    if (useKv) {
      matchRequestData = await kv.get(matchRequestId);
    } else {
      matchRequestData = await redisClient.get(matchRequestId);
    }
    
    if (!matchRequestData) {
      return { success: false, error: "Match request not found" };
    }
    
    const matchRequest = JSON.parse(matchRequestData as string) as MatchRequest;
    
    // Only cancel if pending
    if (matchRequest.status === "pending") {
      matchRequest.status = "cancelled";
      
      if (useKv) {
        await kv.set(matchRequestId, JSON.stringify(matchRequest));
        
        // Remove from pending matches
        const betAmountKey = getPendingMatchesByAmountKey(matchRequest.betAmount);
        await kv.zrem(betAmountKey, matchRequestId);
      } else {
        await redisClient.set(matchRequestId, JSON.stringify(matchRequest));
        
        // Remove from pending matches
        const betAmountKey = getPendingMatchesByAmountPrefix(matchRequest.betAmount);
        await redisClient.zrem(betAmountKey, matchRequestId);
      }
      
      console.log(`Match request cancelled: ${matchRequestId}`);
      
      return { success: true, error: null };
    } else if (matchRequest.status === "matched") {
      return { success: false, error: "Cannot cancel a match that has already been matched" };
    } else {
      return { success: false, error: `Match request is already ${matchRequest.status}` };
    }
  } catch (error) {
    console.error("Error cancelling match request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error cancelling match request",
    };
  }
}

// Complete a match
export const completeMatch = async (
  matchId: string,
  winnerId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Check which client to use
    const { useKv } = await getClient();
    
    let matchData;
    if (useKv) {
      matchData = await kv.get(matchId);
    } else {
      matchData = await redisClient.get(matchId);
    }
    
    if (!matchData) {
      return { success: false, error: "Match not found" };
    }
    
    const match = JSON.parse(matchData as string) as Match;
    
    // Only complete if active
    if (match.status === "active") {
      match.status = "completed";
      match.winnerId = winnerId;
      
      if (useKv) {
        await kv.set(matchId, JSON.stringify(match));
      } else {
        await redisClient.set(matchId, JSON.stringify(match));
      }
      
      console.log(`Match completed: ${matchId}, Winner: ${winnerId.slice(0,6)}...`);
      
      // Update player stats in the leaderboard
      try {
        // Import the leaderboard service
        const { updatePlayerStats } = await import("./leaderboard-service");
        
        // Update the winner's stats
        await updatePlayerStats({
          publicKey: winnerId,
          isWinner: true,
          winAmount: match.betAmount * 2  // Winner gets double the bet amount
        });
        
        // Update the loser's stats
        const loserId = match.player1PublicKey === winnerId 
          ? match.player2PublicKey 
          : match.player1PublicKey;
          
        await updatePlayerStats({
          publicKey: loserId,
          isWinner: false,
          winAmount: 0
        });
        
        toast({
          title: "Match Completed",
          description: `Match ${matchId} completed. Winner: ${winnerId.slice(0, 6)}...${winnerId.slice(-4)}`,
        });
      } catch (err) {
        console.error("Error updating leaderboard:", err);
      }
      
      return { success: true, error: null };
    } else {
      return { success: false, error: `Match is already ${match.status}` };
    }
  } catch (error) {
    console.error("Error completing match:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error completing match",
    };
  }
}

// Get match details
export const getMatchDetails = async (
  matchId: string
): Promise<{ match: Match | null; error: string | null }> => {
  try {
    // Check which client to use
    const { useKv } = await getClient();
    
    let matchData;
    if (useKv) {
      matchData = await kv.get(matchId);
    } else {
      matchData = await redisClient.get(matchId);
    }
    
    if (!matchData) {
      return { match: null, error: "Match not found" };
    }
    
    return { match: JSON.parse(matchData as string) as Match, error: null };
  } catch (error) {
    console.error("Error getting match details:", error);
    return {
      match: null, 
      error: error instanceof Error ? error.message : "Unknown error getting match details"
    };
  }
}

// Function to get match details (simple service example)
export async function getMatchDetailsService(matchId: string): Promise<MatchResponse> {
  try {
    // For now, we'll simply return a simulated match
    // In a real implementation, this would fetch from a database or API
    
    // Artificial delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return simulated match data
    return {
      match: {
        id: matchId,
        player1PublicKey: matchId + '_player1',
        player2PublicKey: 'opponent_' + matchId.substring(0, 6),
        betAmount: 0.1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Error fetching match details:', error);
    return {
      error: 'Failed to fetch match details'
    };
  }
}

// Function to complete a match (set winner) - simple service example
export async function completeMatchService(
  matchId: string, 
  winnerPublicKey: string
): Promise<CompleteMatchResponse> {
  try {
    // For now, we'll simply return success
    // In a real implementation, this would update a database record
    
    // Artificial delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate updating the leaderboard
    const { updateLeaderboard } = await import('./redis');
    await updateLeaderboard(winnerPublicKey, 0.1, 'winnings');
    
    return { success: true };
  } catch (error) {
    console.error('Error completing match:', error);
    return {
      success: false,
      error: 'Failed to complete match'
    };
  }
}

// Compatibility helper for zadd with different Redis client formats
async function zaddCompatible(client: any, key: string, score: number, member: string) {
  try {
    // Check if client has a zadd method that accepts parameters in different formats
    if (client.zadd) {
      // Try the { [member]: score } format first (used by Vercel KV)
      try {
        return await client.zadd(key, { [member]: score });
      } catch (e) {
        // Try the [score, member] format (used by some Upstash Redis clients)
        try {
          return await client.zadd(key, [score, member]);
        } catch (e2) {
          // Try direct parameters as a last resort
          return await client.zadd(key, score, member);
        }
      }
    }
    return false;
  } catch (error) {
    console.error("Error in zaddCompatible:", error);
    return false;
  }
}
