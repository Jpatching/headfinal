/**
 * Verify real player data is properly stored in the leaderboard
 * Run with: node scripts/verify-leaderboard-integration.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');

// Constants - ensure these match your application constants
const PLAYER_KEY_PREFIX = 'player:';
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

async function verifyLeaderboardIntegration() {
  console.log('Leaderboard Integration Verification');
  console.log('===================================');
  
  // Initialize Redis client
  let redis;
  try {
    // Initialize Redis client using environment variables
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisRestUrl || !redisRestToken) {
      throw new Error('Redis connection details not found in environment variables');
    }

    redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });

    // Verify Redis connection
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      throw new Error(`Redis ping failed: ${pong}`);
    }
    console.log('✅ Redis connection successful');

    // 1. Create a test player
    const testPlayerId = `test_player_${uuidv4().slice(0, 8)}`;
    const wins = 5;
    const totalWinnings = 7.5;
    
    const playerData = {
      publicKey: testPlayerId,
      username: `Test Player ${uuidv4().slice(0, 4)}`,
      wins,
      losses: 2,
      totalWinnings,
      totalPlayed: 7,
      lastPlayed: Date.now()
    };
    
    // 2. Save player data to Redis
    console.log(`\nCreating test player: ${testPlayerId}`);
    await redis.set(`${PLAYER_KEY_PREFIX}${testPlayerId}`, JSON.stringify(playerData));
    console.log('✅ Player data saved to Redis');
    
    // 3. Update leaderboard with ZADD
    console.log('\nUpdating leaderboard with player data...');
    const winningsResult = await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { score: totalWinnings, member: testPlayerId });
    const winsResult = await redis.zadd(LEADERBOARD_BY_WINS_KEY, { score: wins, member: testPlayerId });
    
    console.log(`✅ Added to winnings leaderboard: ${winningsResult}`);
    console.log(`✅ Added to wins leaderboard: ${winsResult}`);
    
    // 4. Verify player exists in leaderboard
    console.log('\nVerifying player exists in leaderboard...');
    const playerInWinnings = await redis.zscore(LEADERBOARD_BY_WINNINGS_KEY, testPlayerId);
    const playerInWins = await redis.zscore(LEADERBOARD_BY_WINS_KEY, testPlayerId);
    
    if (playerInWinnings === totalWinnings && playerInWins === wins) {
      console.log('✅ Player successfully added to both leaderboards with correct scores!');
    } else {
      console.log(`❌ Leaderboard verification failed!`);
      console.log(`Expected winnings: ${totalWinnings}, Got: ${playerInWinnings}`);
      console.log(`Expected wins: ${wins}, Got: ${playerInWins}`);
    }
    
    // 5. Cleanup
    console.log('\nCleaning up test data...');
    await redis.del(`${PLAYER_KEY_PREFIX}${testPlayerId}`);
    await redis.zrem(LEADERBOARD_BY_WINNINGS_KEY, testPlayerId);
    await redis.zrem(LEADERBOARD_BY_WINS_KEY, testPlayerId);
    console.log('✅ Test data cleaned up');
    
    console.log('\n✅ Leaderboard integration verification complete!');
    
  } catch (error) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the verification
verifyLeaderboardIntegration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
