/**
 * Redis Service - Unified access to Redis functionality
 * 
 * This service provides a consistent interface for Redis operations
 * regardless of the underlying client implementation (Upstash, node-redis, etc.)
 */

import { Redis } from '@upstash/redis';

// Key prefixes to organize data
export const playerKeyPrefix = 'player:';
export const matchRequestPrefix = 'matchRequest:';
export const matchPrefix = 'match:';
export const pendingMatchesByAmountPrefix = 'pendingMatches:amount:';
export const leaderboardKeyPrefix = 'leaderboard:';

// Specific leaderboard keys
export const LEADERBOARD_BY_WINNINGS_KEY = `${leaderboardKeyPrefix}byWinnings`;
export const LEADERBOARD_BY_WINS_KEY = `${leaderboardKeyPrefix}byWins`;

// Helper functions to generate Redis keys
export function getPlayerKey(publicKey: string): string {
  return `${playerKeyPrefix}${publicKey}`;
}

export function getPendingMatchesByAmountKey(amount: number): string {
  return `${pendingMatchesByAmountPrefix}${amount}`;
}

// Singleton Redis client instance
let redisClient: Redis | null = null;

/**
 * Initialize Redis client with proper error handling
 */
export function initRedisClient(): Redis {
  if (!redisClient) {
    try {
      // Initialize with Upstash Redis REST API credentials
      const url = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
      
      if (url && token) {
        redisClient = new Redis({
          url,
          token,
        });
      } else {
        throw new Error('No valid Upstash Redis credentials found in environment variables');
      }
    } catch (error) {
      console.error("Failed to initialize Redis client:", error);
      
      // Create a mock client for environments without Redis
      redisClient = createMockRedisClient();
    }
  }
  
  return redisClient;
}

/**
 * Get the Redis client (initializing if needed)
 */
export function getRedisClient(): Redis {
  return redisClient ?? initRedisClient();
}

/**
 * Check if Redis is connected/available
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis connection check failed:', error);
    return false;
  }
}

/**
 * Create a mock Redis client for environments without Redis
 */
function createMockRedisClient() {
  // In-memory storage for mock client
  const keyValueStore = new Map<string, any>();
  const sortedSets = new Map<string, Map<string, number>>();
  
  return {
    // Basic operations
    ping: async () => 'PONG',
    get: async (key: string) => keyValueStore.get(key) || null,
    set: async (key: string, value: any) => {
      keyValueStore.set(key, value);
      return true;
    },
    del: async (key: string) => {
      keyValueStore.delete(key);
      return true;
    },
    
    // Sorted set operations
    zadd: async (key: string, scores: Record<string, number>) => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      const set = sortedSets.get(key)!;
      Object.entries(scores).forEach(([member, score]) => {
        set.set(member, score);
      });
      return true;
    },
    zrange: async (key: string, start: number, stop: number, options?: { withScores?: boolean, rev?: boolean }) => {
      const set = sortedSets.get(key) || new Map();
      let entries = Array.from(set.entries());
      
      // Sort entries
      if (options?.rev) {
        entries.sort((a, b) => b[1] - a[1]);
      } else {
        entries.sort((a, b) => a[1] - b[1]);
      }
      
      // Apply range
      entries = entries.slice(start, stop === -1 ? undefined : stop + 1);
      
      // Format results
      if (options?.withScores) {
        return entries.map(([member, score]) => ({ member, score }));
      } else {
        return entries.map(([member]) => member);
      }
    },
    zrem: async (key: string, ...members: string[]) => {
      if (!sortedSets.has(key)) return true;
      const set = sortedSets.get(key)!;
      members.forEach(member => set.delete(member));
      return true;
    },
    zcard: async (key: string) => {
      return sortedSets.get(key)?.size || 0;
    },
    zrank: async (key: string, member: string) => {
      const set = sortedSets.get(key) || new Map();
      const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
      const index = entries.findIndex(([m]) => m === member);
      return index === -1 ? null : index;
    },
    zrevrank: async (key: string, member: string) => {
      const set = sortedSets.get(key) || new Map();
      const entries = Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
      const index = entries.findIndex(([m]) => m === member);
      return index === -1 ? null : index;
    },
    
    // Add more methods as needed
  } as unknown as Redis;
}
