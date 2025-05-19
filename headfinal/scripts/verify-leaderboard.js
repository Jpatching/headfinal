/**
 * Verify the leaderboard functionality
 * Run with: node scripts/verify-leaderboard.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Constants
const PLAYER_KEY_PREFIX = 'player:';
// Update these to match the keys used in the rest of the application
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

async function verifyLeaderboard() {
  console.log("Verifying Leaderboard Functionality");
  console.log("===================================");
  
  let redis;
  try {
    // Initialize Redis with Upstash credentials
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisRestUrl || !redisRestToken) {
      console.error("❌ Redis connection details not found in environment variables");
      console.log("   Please set UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN in your .env file");
      return false;
    }
    
    redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });
    
    console.log("✅ Redis client initialized");
    
    // Test connection
    const pong = await redis.ping();
    console.log(`✅ Redis connection: ${pong}`);
    
    // Check if leaderboard keys exist
    const byWinningsExists = await redis.exists(LEADERBOARD_BY_WINNINGS_KEY);
    const byWinsExists = await redis.exists(LEADERBOARD_BY_WINS_KEY);
    
    console.log(`Leaderboard by winnings: ${byWinningsExists ? '✅ EXISTS' : '⚠️ NOT FOUND'}`);
    console.log(`Leaderboard by wins: ${byWinsExists ? '✅ EXISTS' : '⚠️ NOT FOUND'}`);
    
    // Create test player
    const testPlayerId = `test_verify_${crypto.randomBytes(4).toString('hex')}`;
    console.log(`\nCreating test player: ${testPlayerId}`);
    
    const playerData = {
      publicKey: testPlayerId,
      username: "TestVerifyPlayer",
      wins: 5,
      losses: 2,
      totalWinnings: 7.5,
      totalPlayed: 7,
      lastPlayed: Date.now()
    };
    
    await redis.set(`${PLAYER_KEY_PREFIX}${testPlayerId}`, JSON.stringify(playerData));
    console.log("✅ Test player created");
    
    // Add to leaderboards
    console.log("\nAdding player to leaderboards...");
    await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { [testPlayerId]: playerData.totalWinnings });
    await redis.zadd(LEADERBOARD_BY_WINS_KEY, { [testPlayerId]: playerData.wins });
    console.log("✅ Player added to leaderboards");
    
    // Verify player is in leaderboards
    console.log("\nVerifying player position in leaderboards...");
    
    // Check by winnings
    const rankByWinnings = await redis.zrevrank(LEADERBOARD_BY_WINNINGS_KEY, testPlayerId);
    console.log(`Player rank by winnings: ${rankByWinnings !== null ? rankByWinnings + 1 : 'Not found'}`);
    
    // Check by wins
    const rankByWins = await redis.zrevrank(LEADERBOARD_BY_WINS_KEY, testPlayerId);
    console.log(`Player rank by wins: ${rankByWins !== null ? rankByWins + 1 : 'Not found'}`);
    
    // Get top 5 players by winnings
    console.log("\nTop 5 players by winnings:");
    const topByWinnings = await redis.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, 4, { rev: true, withScores: true });
    
    if (topByWinnings.length === 0) {
      console.log("  No players found in winnings leaderboard");
    } else {
      for (let i = 0; i < topByWinnings.length; i += 2) {
        const id = topByWinnings[i];
        const score = topByWinnings[i+1];
        console.log(`  ${i/2 + 1}. ${id}: ${score} SOL`);
        
        // Fetch player data
        try {
          const playerJson = await redis.get(`${PLAYER_KEY_PREFIX}${id}`);
          if (playerJson) {
            const player = JSON.parse(playerJson);
            console.log(`     Username: ${player.username || 'N/A'}, Wins: ${player.wins}, Losses: ${player.losses}`);
          } else {
            console.log(`     ⚠️ Player data not found!`);
          }
        } catch (err) {
          console.log(`     ⚠️ Error fetching player data: ${err.message}`);
        }
      }
    }
    
    // Get top 5 players by wins
    console.log("\nTop 5 players by wins:");
    const topByWins = await redis.zrange(LEADERBOARD_BY_WINS_KEY, 0, 4, { rev: true, withScores: true });
    
    if (topByWins.length === 0) {
      console.log("  No players found in wins leaderboard");
    } else {
      for (let i = 0; i < topByWins.length; i += 2) {
        const id = topByWins[i];
        const score = topByWins[i+1];
        console.log(`  ${i/2 + 1}. ${id}: ${score} wins`);
      }
    }
    
    // Clean up test data
    console.log("\nCleaning up test data...");
    await redis.del(`${PLAYER_KEY_PREFIX}${testPlayerId}`);
    await redis.zrem(LEADERBOARD_BY_WINNINGS_KEY, testPlayerId);
    await redis.zrem(LEADERBOARD_BY_WINS_KEY, testPlayerId);
    console.log("✅ Test data cleaned up");
    
    console.log("\n✅ Leaderboard verification complete!");
    return true;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

// Run the verification
verifyLeaderboard().catch(console.error);
