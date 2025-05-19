/**
 * Upstash KV client via Vercel integration
 */

import { Redis } from '@upstash/redis';

// Connection prefixes
export const matchPrefix = "match:";
export const matchRequestPrefix = "matchrequest:";
export const pendingMatchesByAmountPrefix = "pendingmatches:amount:";
export const playerStatsPrefix = "player:";
export const leaderboardKey = "leaderboard";
export const leaderboardByWinningsKey = "leaderboard:byWinnings";

// Helper functions for key generation
export function getPlayerKey(publicKey: string) {
  return `${playerStatsPrefix}${publicKey}`;
}

export function getPendingMatchesByAmountKey(amount: number) {
  return `${pendingMatchesByAmountPrefix}${amount}`;
}

// Initialize Upstash KV client with REST API
console.log("Initializing Upstash KV client via Vercel integration");

// Check if environment variables are set - try different possible environment variable names
const redisUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || 
                process.env.UPSTASH_REDIS_REST_URL || 
                'https://exotic-viper-32560.upstash.io';

const redisToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || 
                  process.env.UPSTASH_REDIS_REST_TOKEN || 
                  'AX8wAAIjcDE2MjViZDE0MWJjZDc0NjkwODVmYTRlYTFhMTcwYjkxMHAxMA';

// Create the Redis client from Upstash KV REST API
export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

/**
 * Helper function to add items to a sorted set with the correct syntax
 * The Upstash Redis client requires a specific format for zadd
 */
export async function zaddHelper(key: string, score: number, member: string): Promise<number> {
  try {
    // Call zadd with the correct parameter format for Upstash Redis
    const result = await redis.zadd(key, { score, member });
    return result;
  } catch (error) {
    console.error(`ZADD Error for key ${key}, score ${score}, member ${member}:`, error);
    throw error;
  }
}

/**
 * Verify Redis connection and ZADD functionality
 */
export async function verifyRedisConnection() {
  try {
    // Test basic connection
    const ping = await redis.ping();
    if (ping !== 'PONG') {
      throw new Error(`Redis ping failed: ${ping}`);
    }
    
    // Test ZADD specifically
    const testKey = `test:zadd:${Date.now()}`;
    const testScore = Date.now();
    const testMember = `test:${Date.now()}`;
    
    const zaddResult = await zaddHelper(testKey, testScore, testMember);
    if (!zaddResult) {
      throw new Error('Redis ZADD test failed');
    }
    
    // Clean up test key
    await redis.del(testKey);
    
    return true;
  } catch (error) {
    console.error('Redis verification failed:', error);
    return false;
  }
}

// Export as default for backward compatibility
export default redis;
