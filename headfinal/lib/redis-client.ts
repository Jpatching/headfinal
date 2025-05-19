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

// Create the Redis client from Upstash KV REST API
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL || "https://intimate-cowbird-32452.upstash.io",
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || "AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA"
});

// Export as default for backward compatibility
export default redis;
