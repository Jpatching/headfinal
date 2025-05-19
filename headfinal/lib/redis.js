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
    const leaderboardKey = `leaderboard:${type}`;
    // The correct format for Upstash Redis zadd
    return await redis.zadd(leaderboardKey, { [playerId]: score });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return false;
  }
}

// Function to get top players from leaderboard
export async function getLeaderboard(type = 'winnings', limit = 10) {
  try {
    const leaderboardKey = `leaderboard:${type}`;
    // Get the top players by score (descending order)
    const results = await redis.zrange(leaderboardKey, 0, limit - 1, { withScores: true, rev: true });
    
    // Format the results
    return results.map((item, index) => {
      return {
        rank: index + 1,
        playerId: item.member,
        score: item.score,
      };
    });
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
  };
}