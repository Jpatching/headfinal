/**
 * Test script for leaderboard functionality
 * Run with: node scripts/leaderboard-test.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');
const readline = require('readline');

// Check if running in production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
  console.error('⛔ WARNING: This script is not meant to be run in production!');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Are you sure you want to continue? This will create test data in PRODUCTION. (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('Operation cancelled. No test data was created.');
      rl.close();
      process.exit(0);
    } else {
      console.log('Proceeding with caution...');
      rl.close();
      // Continue execution
    }
  });
} else {
  // Start the script immediately in dev environment
  testLeaderboard().catch(console.error);
}

// Constants - ensure these match your application's constants
const PLAYER_KEY_PREFIX = 'player:';
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

async function testLeaderboard() {
  console.log("Leaderboard Testing Tool");
  console.log("=======================");

  // Initialize Redis client
  let redis;
  try {
    // Initialize Redis client using environment variables
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisRestUrl || !redisRestToken) {
      throw new Error("Redis connection details not found in environment variables");
    }

    redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });

    // Test connection
    const pong = await redis.ping();
    console.log(`Redis connection: ${pong === 'PONG' ? '✅ CONNECTED' : '❌ FAILED'}`);

    // Check current leaderboards
    console.log("\nCurrent Leaderboard State:");
    await checkLeaderboards(redis);

    // Ask for user choice
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log("\nSelect an action:");
    console.log("1. Add test players to leaderboard");
    console.log("2. View leaderboards");
    console.log("3. Clean up test data");
    console.log("4. Verify Redis keys and structure");
    console.log("5. Exit");

    readline.question('Enter your choice (1-5): ', async (answer) => {
      readline.close();

      switch (answer.trim()) {
        case '1':
          await addTestPlayers(redis);
          break;
        case '2':
          await viewLeaderboards(redis);
          break;
        case '3':
          await cleanupTestData(redis);
          break;
        case '4':
          await verifyRedisStructure(redis);
          break;
        case '5':
          console.log("Exiting...");
          break;
        default:
          console.log("Invalid choice");
          break;
      }
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function checkLeaderboards(redis) {
  // Check winnings leaderboard
  const winningsLeaderboard = await redis.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, -1, { rev: true, withScores: true });
  console.log(`\n📊 Leaderboard by Winnings (${winningsLeaderboard.length / 2} players):`);

  for (let i = 0; i < winningsLeaderboard.length; i += 2) {
    const playerId = winningsLeaderboard[i];
    const score = winningsLeaderboard[i + 1];
    console.log(`${i / 2 + 1}. ${playerId}: ${score} SOL`);

    // Fetch player data
    const playerData = await redis.get(`${PLAYER_KEY_PREFIX}${playerId}`);
    if (playerData) {
      const player = JSON.parse(playerData);
      console.log(`   Username: ${player.username || 'N/A'}, Wins: ${player.wins}, Losses: ${player.losses}`);
    } else {
      console.log(`   ⚠️ Player data not found!`);
    }
  }

  // Check wins leaderboard
  const winsLeaderboard = await redis.zrange(LEADERBOARD_BY_WINS_KEY, 0, -1, { rev: true, withScores: true });
  console.log(`\n📊 Leaderboard by Wins (${winsLeaderboard.length / 2} players):`);

  for (let i = 0; i < winsLeaderboard.length; i += 2) {
    const playerId = winsLeaderboard[i];
    const score = winsLeaderboard[i + 1];
    console.log(`${i / 2 + 1}. ${playerId}: ${score} wins`);
  }
}

async function addTestPlayers(redis) {
  console.log("\n👥 Adding test players to leaderboard...");

  // Create 3 test players with different stats
  const players = [
    {
      id: `test_player_${crypto.randomBytes(4).toString('hex')}`,
      username: "Test Winner",
      teamName: "jpatchings-projects", // Add your team name
      wins: 10,
      losses: 2,
      totalWinnings: 15.5,
      totalPlayed: 12,
      verified: false // Mark as test data
    },
    {
      id: `test_player_${crypto.randomBytes(4).toString('hex')}`,
      username: "Test Runner-Up",
      wins: 7,
      losses: 5,
      totalWinnings: 8.25,
      totalPlayed: 12
    },
    {
      id: `test_player_${crypto.randomBytes(4).toString('hex')}`,
      username: "Test Novice",
      wins: 2,
      losses: 8,
      totalWinnings: 1.5,
      totalPlayed: 10
    }
  ];

  for (const player of players) {
    // Save player data
    const playerKey = `${PLAYER_KEY_PREFIX}${player.id}`;
    const playerData = {
      publicKey: player.id,
      username: player.username,
      wins: player.wins,
      losses: player.losses,
      totalWinnings: player.totalWinnings,
      totalPlayed: player.totalPlayed,
      lastPlayed: Date.now()
    };

    await redis.set(playerKey, JSON.stringify(playerData));
    console.log(`✅ Added player: ${player.username} (${player.id})`);

    // Update leaderboards
    try {
      // Fix ZADD calls - use array format instead of direct parameters
      // This format works better with the Upstash Redis client
      await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, [player.totalWinnings, player.id]);
      await redis.zadd(LEADERBOARD_BY_WINS_KEY, [player.wins, player.id]);

      console.log(`✅ Updated leaderboards for ${player.username}`);
    } catch (error) {
      console.error(`❌ Error updating leaderboards: ${error.message}`);
      console.error(error);
    }
  }

  console.log("\n✅ Test players added successfully!");
  console.log("\nCurrent Leaderboard State:");
  await checkLeaderboards(redis);
}

async function viewLeaderboards(redis) {
  console.log("\nFetching leaderboard data...");
  await checkLeaderboards(redis);
}

async function cleanupTestData(redis) {
  console.log("\n🧹 Cleaning up test data...");

  // Find test players
  const testPlayerKeys = await redis.keys(`${PLAYER_KEY_PREFIX}test_player_*`);
  console.log(`Found ${testPlayerKeys.length} test player records`);

  for (const key of testPlayerKeys) {
    const playerId = key.replace(PLAYER_KEY_PREFIX, '');
    console.log(`Removing ${playerId}...`);

    // Delete player data
    await redis.del(key);

    // Remove from leaderboards
    await redis.zrem(LEADERBOARD_BY_WINNINGS_KEY, playerId);
    await redis.zrem(LEADERBOARD_BY_WINS_KEY, playerId);
  }

  console.log(`\n✅ Removed ${testPlayerKeys.length} test players and their leaderboard entries`);
}

async function verifyRedisStructure(redis) {
  console.log("\n🔍 Verifying Redis structure and keys...");

  // Check if leaderboard keys exist
  const winningsExists = await redis.exists(LEADERBOARD_BY_WINNINGS_KEY);
  const winsExists = await redis.exists(LEADERBOARD_BY_WINS_KEY);

  console.log(`${LEADERBOARD_BY_WINNINGS_KEY}: ${winningsExists ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`${LEADERBOARD_BY_WINS_KEY}: ${winsExists ? '✅ EXISTS' : '❌ MISSING'}`);

  // Check for any alternate leaderboard keys that might be used
  console.log("\nChecking for alternate leaderboard keys:");
  const allLeaderboardKeys = await redis.keys("leaderboard:*");

  for (const key of allLeaderboardKeys) {
    const type = await redis.type(key);
    const count = type === "zset" ? await redis.zcard(key) : "N/A";
    console.log(`${key}: Type=${type}, Count=${count}`);
  }

  // Check player keys
  const playerCount = await redis.keys(`${PLAYER_KEY_PREFIX}*`).then(keys => keys.length);
  console.log(`\nPlayer records: ${playerCount} found`);

  console.log("\n✅ Redis structure verification complete!");
}

// Run the test
testLeaderboard().catch(console.error);
