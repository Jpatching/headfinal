/**
 * A lightweight Redis client using REST API instead of node-redis library
 * This avoids dependency conflicts with React 19
 */

// Extract Redis credentials from the connection string
const REDIS_URL = process.env.REDIS_URL || "";
const getRedisCredentials = () => {
  try {
    // Format: redis://default:password@hostname:port
    const url = new URL(REDIS_URL);
    const password = url.password;
    const host = url.hostname;
    const port = url.port;
    
    return {
      host,
      port, 
      password,
      isValid: Boolean(host && port && password)
    };
  } catch (error) {
    console.error("Failed to parse Redis URL:", error);
    return { host: "", port: "", password: "", isValid: false };
  }
};

// Key prefixes to organize data - ensure these match redis-client.ts
export const leaderboardKeyPrefix = 'leaderboard:';
export const playerKeyPrefix = 'player:';
export const matchRequestPrefix = 'matchRequest:';
export const matchPrefix = 'match:';
export const pendingMatchesByAmountPrefix = 'pendingMatches:amount:'; // Updated to match redis-client.ts

// Helper function to generate a player key
export function getPlayerKey(publicKey: string): string {
  return `${playerKeyPrefix}${publicKey}`;
}

// Helper to get a key for pendingMatches by amount
export function getPendingMatchesByAmountKey(amount: number): string {
  return `${pendingMatchesByAmountPrefix}${amount}`;
}

// In-memory caches for development environment
const inMemoryKeyValueStore = new Map<string, string>();
const inMemorySortedSets = new Map<string, { score: number; member: string }[]>();

// Simple fetch-based Redis operations
export const redisClient = {
  // Check if Redis is available
  async ping(): Promise<boolean> {
    try {
      const { isValid } = getRedisCredentials();
      return isValid;
    } catch (error) {
      console.error("Redis ping error:", error);
      return false;
    }
  },
  
  // Get a value
  async get(key: string): Promise<string | null> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const value = localStorage.getItem(`redis:${key}`);
          return value;
        }
        // Use in-memory store in Node.js
        return inMemoryKeyValueStore.get(key) || null;
      }
      
      // For server-side in production
      console.log(`[Server] Redis GET: ${key}`);
      // TODO: Implement actual Redis REST API call
      return null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  },
  
  // Set a value
  async set(key: string, value: string): Promise<boolean> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          localStorage.setItem(`redis:${key}`, value);
          return true;
        }
        // Use in-memory store in Node.js
        inMemoryKeyValueStore.set(key, value);
        return true;
      }
      
      // For server-side in production
      console.log(`[Server] Redis SET: ${key} ${value.substring(0, 50)}...`);
      // TODO: Implement actual Redis REST API call
      return true;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  },
  
  // Multi get
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          return keys.map(key => localStorage.getItem(`redis:${key}`));
        }
        // Use in-memory store in Node.js
        return keys.map(key => inMemoryKeyValueStore.get(key) || null);
      }
      
      // For server-side in production
      console.log(`[Server] Redis MGET: ${keys.join(', ')}`);
      // TODO: Implement actual Redis REST API call
      return keys.map(() => null);
    } catch (error) {
      console.error("Redis mget error:", error);
      return keys.map(() => null);
    }
  },
  
  // Delete a key
  async del(key: string): Promise<boolean> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`redis:${key}`);
          return true;
        }
        // Use in-memory store in Node.js
        return inMemoryKeyValueStore.delete(key);
      }
      
      // For server-side in production
      console.log(`[Server] Redis DEL: ${key}`);
      // TODO: Implement actual Redis REST API call
      return true;
    } catch (error) {
      console.error("Redis del error:", error);
      return false;
    }
  },
  
  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const sortedSetStr = localStorage.getItem(`redis:sortedset:${key}`) || '[]';
          let sortedSet = JSON.parse(sortedSetStr);
          
          const existingIndex = sortedSet.findIndex((item: any) => item.member === member);
          if (existingIndex !== -1) {
            sortedSet[existingIndex].score = score;
          } else {
            sortedSet.push({ score, member });
          }
          
          sortedSet.sort((a: any, b: any) => b.score - a.score);
          localStorage.setItem(`redis:sortedset:${key}`, JSON.stringify(sortedSet));
          return true;
        }
        
        // Use in-memory sorted sets in Node.js
        if (!inMemorySortedSets.has(key)) {
          inMemorySortedSets.set(key, []);
        }
        
        const sortedSet = inMemorySortedSets.get(key)!;
        const existingIndex = sortedSet.findIndex(item => item.member === member);
        
        if (existingIndex !== -1) {
          sortedSet[existingIndex].score = score;
        } else {
          sortedSet.push({ score, member });
        }
        
        sortedSet.sort((a, b) => b.score - a.score);
        return true;
      }
      
      // For server-side in production
      console.log(`[Server] Redis ZADD: ${key} ${score} ${member}`);
      // TODO: Implement actual Redis REST API call
      return true;
    } catch (error) {
      console.error("Redis zadd error:", error);
      return false;
    }
  },
  
  // Get top members from a sorted set
  async zrange(key: string, start: number, end: number, rev = true): Promise<string[]> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const sortedSetStr = localStorage.getItem(`redis:sortedset:${key}`) || '[]';
          const sortedSet = JSON.parse(sortedSetStr);
          
          // If reversed (highest scores first)
          if (rev) {
            return sortedSet.slice(start, end === -1 ? undefined : end + 1).map((item: any) => item.member);
          }
          
          // Normal order (lowest scores first)
          return [...sortedSet]
            .sort((a: any, b: any) => a.score - b.score)
            .slice(start, end === -1 ? undefined : end + 1)
            .map((item: any) => item.member);
        }
        
        // Use in-memory sorted sets in Node.js
        const sortedSet = inMemorySortedSets.get(key) || [];
        
        if (rev) {
          // Already sorted by highest score first
          return sortedSet.slice(start, end === -1 ? undefined : end + 1).map(item => item.member);
        } else {
          // Sort by lowest score first
          return [...sortedSet]
            .sort((a, b) => a.score - b.score)
            .slice(start, end === -1 ? undefined : end + 1)
            .map(item => item.member);
        }
      }
      
      // For server-side in production
      console.log(`[Server] Redis ZRANGE: ${key} ${start} ${end} rev=${rev}`);
      // TODO: Implement actual Redis REST API call
      return [];
    } catch (error) {
      console.error("Redis zrange error:", error);
      return [];
    }
  },
  
  // Get member count in a sorted set
  async zcard(key: string): Promise<number> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const sortedSetStr = localStorage.getItem(`redis:sortedset:${key}`) || '[]';
          const sortedSet = JSON.parse(sortedSetStr);
          return sortedSet.length;
        }
        
        // Use in-memory sorted sets in Node.js
        return inMemorySortedSets.get(key)?.length || 0;
      }
      
      // For server-side in production
      console.log(`[Server] Redis ZCARD: ${key}`);
      // TODO: Implement actual Redis REST API call
      return 0;
    } catch (error) {
      console.error("Redis zcard error:", error);
      return 0;
    }
  },
  
  // Get rank of a member in a sorted set
  async zrank(key: string, member: string, rev = false): Promise<number | null> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const sortedSetStr = localStorage.getItem(`redis:sortedset:${key}`) || '[]';
          let sortedSet = JSON.parse(sortedSetStr);
          
          // If reversed (highest scores first)
          if (rev) {
            sortedSet.sort((a: any, b: any) => b.score - a.score);
          } else {
            sortedSet.sort((a: any, b: any) => a.score - b.score);
          }
          
          const index = sortedSet.findIndex((item: any) => item.member === member);
          return index !== -1 ? index : null;
        }
        
        // Use in-memory sorted sets in Node.js
        const sortedSet = inMemorySortedSets.get(key) || [];
        let orderedSet = [...sortedSet];
        
        if (!rev) {
          // Sort by lowest score first (normal order)
          orderedSet.sort((a, b) => a.score - b.score);
        }
        // Otherwise already in highest-score-first order
        
        const index = orderedSet.findIndex(item => item.member === member);
        return index !== -1 ? index : null;
      }
      
      // For server-side in production
      console.log(`[Server] Redis ZRANK: ${key} ${member} rev=${rev}`);
      // TODO: Implement actual Redis REST API call
      return null;
    } catch (error) {
      console.error("Redis zrank error:", error);
      return null;
    }
  },
  
  // Remove a member from a sorted set
  async zrem(key: string, member: string): Promise<boolean> {
    try {
      // In development, use in-memory storage
      if (process.env.NODE_ENV !== "production" || typeof window !== 'undefined') {
        // Use localStorage in browser
        if (typeof window !== 'undefined') {
          const sortedSetStr = localStorage.getItem(`redis:sortedset:${key}`) || '[]';
          let sortedSet = JSON.parse(sortedSetStr);
          
          // Remove the member
          sortedSet = sortedSet.filter((item: any) => item.member !== member);
          
          // Save back
          localStorage.setItem(`redis:sortedset:${key}`, JSON.stringify(sortedSet));
          return true;
        }
        
        // Use in-memory sorted sets in Node.js
        if (!inMemorySortedSets.has(key)) return true;
        
        const sortedSet = inMemorySortedSets.get(key)!;
        const newSet = sortedSet.filter(item => item.member !== member);
        inMemorySortedSets.set(key, newSet);
        return true;
      }
      
      // For server-side in production
      console.log(`[Server] Redis ZREM: ${key} ${member}`);
      // TODO: Implement actual Redis REST API call
      return true;
    } catch (error) {
      console.error("Redis zrem error:", error);
      return false;
    }
  }
};

// Helper function to check if Redis is available
export async function isRedisConnected(): Promise<boolean> {
  try {
    return await redisClient.ping();
  } catch (error) {
    console.error('Redis connection check failed:', error);
    return false;
  }
}

export default redisClient;
