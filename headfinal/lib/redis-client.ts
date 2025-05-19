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

// Check if environment variables are set
const redisUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

// Fallback values for local development (don't use in production)
const fallbackUrl = "https://intimate-cowbird-32452.upstash.io";
const fallbackToken = "AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA";

// Create the Redis client from Upstash KV REST API
export const redis = new Redis({
  url: redisUrl || fallbackUrl,
  token: redisToken || fallbackToken,
});

// Export as default for backward compatibility
export default redis;
