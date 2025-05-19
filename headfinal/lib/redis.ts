import { Redis } from "@upstash/redis";

// Redis configuration from environment
export const REDIS_CONFIG = {
  url: process.env.UPSTASH_REDIS_REST_URL || "https://intimate-cowbird-32452.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA",
}

// Create a Redis client using environment variables
export const redis = new Redis({
  url: REDIS_CONFIG.url,
  token: REDIS_CONFIG.token,
});

// Helper function to check if Redis is connected
export async function checkRedisConnection() {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Redis connection error:", error);
    return false;
  }
}

// Game-related Redis key prefixes
export const REDIS_KEYS = {
  game: (id: string) => `game:${id}`,
  match: (id: string) => `match:${id}`,
  matchmaking: {
    queue: "matchmaking:queue_count",
    activeMatches: "matchmaking:active_matches",
    lastMatched: "matchmaking:last_matched",
  },
  leaderboard: "leaderboard"
}

// For backward compatibility
export default redis;
