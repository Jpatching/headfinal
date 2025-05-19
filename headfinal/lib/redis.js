import { Redis } from '@upstash/redis';

// Initialize Redis client with Upstash credentials
export const getRedisClient = () => {
  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis:', error);
    
    // Return mock implementation for environments without Redis
    return {
      zadd: async () => true,
      zrange: async () => [],
      zrevrange: async () => [],
      zrevrangebyscore: async () => [],
      get: async () => null,
      set: async () => true,
      isOpen: false,
    };
  }
};

// Create Redis client instance
const redis = getRedisClient();

// Function to update a player's position on the leaderboard
export async function updateLeaderboard(playerId, score, type = 'winnings') {
  try {
    const leaderboardKeyName = `leaderboard:${type}`;
    // Use consistent format for Upstash Redis zadd
    return await redis.zadd(leaderboardKeyName, { score, member: playerId });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return false;
  }
}

// Function to set a player's team name
export async function setPlayerTeamName(playerId, teamName) {
  try {
    return await redis.set(`player:${playerId}:teamName`, teamName);
  } catch (error) {
    console.error('Error setting player team name:', error);
    return false;
  }
}

// Function to get a player's team name
export async function getPlayerTeamName(playerId) {
  try {
    return await redis.get(`player:${playerId}:teamName`) || 'Unknown Team';
  } catch (error) {
    console.error('Error getting player team name:', error);
    return 'Unknown Team';
  }
}

// Updated function to get leaderboard with team names
export async function getLeaderboard(type = 'winnings', limit = 10) {
  try {
    const leaderboardKeyName = `leaderboard:${type}`;
    // Get the top players by score (descending order)
    const results = await redis.zrange(leaderboardKeyName, 0, limit - 1, { withScores: true, rev: true });
    
    // Get team names for each player and format the results
    const leaderboardWithTeams = await Promise.all(
      results.map(async (item, index) => {
        const teamName = await getPlayerTeamName(item.member);
        return {
          rank: index + 1,
          playerId: item.member,
          teamName: teamName,
          score: item.score,
        };
      })
    );
    
    return leaderboardWithTeams;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Add a component-ready function that safely handles environment issues
export function useLeaderboard() {
  return {
    getLeaderboard,
    updateLeaderboard,
    setPlayerTeamName,
    getPlayerTeamName,
  };
}