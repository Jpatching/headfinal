/**
 * Script to test the full game flow: matchmaking, game completion, and leaderboard updates
 * Run with: node scripts/test-game-flow.js
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Redis } = require('@upstash/redis');

// Constants - Keep in sync with actual app constants
const PLAYER_KEY_PREFIX = 'player:';
const MATCH_REQUEST_PREFIX = 'matchRequest:';
const MATCH_PREFIX = 'match:';
const PENDING_MATCHES_PREFIX = 'pendingMatches:amount:';
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

// Initialize Redis client specifically for Upstash
function getRedisClient() {
  try {
    const url = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      console.error('Missing Upstash Redis credentials. Please set UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN');
      process.exit(1);
    }
    
    return new Redis({ url, token });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis client:', error);
    process.exit(1);
  }
}

// Sleep function for waiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function testGameFlow() {
  console.log('Testing Full Game Flow');
  console.log('=====================');
  
  const redis = getRedisClient();
  
  try {
    // 1. Test Redis Connection
    const pingResult = await redis.ping();
    console.log(`1. Redis Connection: ${pingResult === 'PONG' ? '✅ CONNECTED' : '❌ FAILED'}`);
    if (pingResult !== 'PONG') {
      throw new Error('Redis connection failed');
    }
    
    // 2. Create test players
    console.log('\n2. Creating Test Players...');
    const player1Id = `test_player1_${uuidv4().substring(0, 8)}`;
    const player2Id = `test_player2_${uuidv4().substring(0, 8)}`;
    
    const player1 = {
      publicKey: player1Id,
      username: 'Test Player 1',
      wins: 0,
      losses: 0,
      totalWinnings: 0,
      totalPlayed: 0,
      lastPlayed: Date.now()
    };
    
    const player2 = {
      publicKey: player2Id,
      username: 'Test Player 2',
      wins: 0,
      losses: 0,
      totalWinnings: 0,
      totalPlayed: 0,
      lastPlayed: Date.now()
    };
    
    await redis.set(PLAYER_KEY_PREFIX + player1Id, JSON.stringify(player1));
    await redis.set(PLAYER_KEY_PREFIX + player2Id, JSON.stringify(player2));
    console.log(`   ✅ Created player 1: ${player1Id}`);
    console.log(`   ✅ Created player 2: ${player2Id}`);
    
    // 3. Create match requests
    console.log('\n3. Creating Match Requests...');
    const betAmount = 1.5; // SOL
    const matchRequestKey1 = MATCH_REQUEST_PREFIX + uuidv4();
    const matchRequestKey2 = MATCH_REQUEST_PREFIX + uuidv4();
    
    const matchRequest1 = {
      id: matchRequestKey1,
      playerPublicKey: player1Id,
      betAmount,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    const matchRequest2 = {
      id: matchRequestKey2,
      playerPublicKey: player2Id,
      betAmount,
      timestamp: Date.now() + 100, // Slightly later
      status: 'pending'
    };
    
    await redis.set(matchRequestKey1, JSON.stringify(matchRequest1));
    await redis.set(matchRequestKey2, JSON.stringify(matchRequest2));
    
    // Add to pending matches sorted set
    const pendingMatchesKey = PENDING_MATCHES_PREFIX + betAmount;
    await redis.zadd(pendingMatchesKey, Date.now(), matchRequestKey1);
    await redis.zadd(pendingMatchesKey, Date.now() + 100, matchRequestKey2);
    
    console.log(`   ✅ Created match request for player 1: ${matchRequestKey1}`);
    console.log(`   ✅ Created match request for player 2: ${matchRequestKey2}`);
    console.log(`   ✅ Added both to pending matches: ${pendingMatchesKey}`);
    
    // 4. Create a match (simulating matchmaking)
    console.log('\n4. Creating Match (simulating matchmaking)...');
    const matchId = MATCH_PREFIX + uuidv4();
    const match = {
      id: matchId,
      player1PublicKey: player1Id,
      player2PublicKey: player2Id,
      betAmount,
      timestamp: Date.now(),
      status: 'active'
    };
    
    await redis.set(matchId, JSON.stringify(match));
    
    // Update match requests to matched status
    matchRequest1.status = 'matched';
    matchRequest1.matchId = matchId;
    matchRequest2.status = 'matched';
    matchRequest2.matchId = matchId;
    
    await redis.set(matchRequestKey1, JSON.stringify(matchRequest1));
    await redis.set(matchRequestKey2, JSON.stringify(matchRequest2));
    
    // Remove from pending matches
    await redis.zrem(pendingMatchesKey, matchRequestKey1);
    await redis.zrem(pendingMatchesKey, matchRequestKey2);
    
    console.log(`   ✅ Created match: ${matchId}`);
    console.log(`   ✅ Updated match requests to matched status`);
    console.log(`   ✅ Removed from pending matches`);
    
    // 5. Complete the match with player 1 as winner
    console.log('\n5. Completing Match with Player 1 as winner...');
    match.status = 'completed';
    match.winnerId = player1Id;
    await redis.set(matchId, JSON.stringify(match));
    
    console.log(`   ✅ Match completed, winner: ${player1Id}`);
    
    // 6. Update player stats (simulating leaderboard service)
    console.log('\n6. Updating Player Stats...');
    
    // Update winner (player 1)
    player1.wins += 1;
    player1.totalWinnings += betAmount * 2; // Winner gets double the bet
    player1.totalPlayed += 1;
    player1.lastPlayed = Date.now();
    
    // Update loser (player 2)
    player2.losses += 1;
    player2.totalPlayed += 1;
    player2.lastPlayed = Date.now();
    
    await redis.set(PLAYER_KEY_PREFIX + player1Id, JSON.stringify(player1));
    await redis.set(PLAYER_KEY_PREFIX + player2Id, JSON.stringify(player2));
    
    // Update leaderboards
    await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { [player1Id]: player1.totalWinnings });
    await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { [player2Id]: player2.totalWinnings });
    
    await redis.zadd(LEADERBOARD_BY_WINS_KEY, { [player1Id]: player1.wins });
    await redis.zadd(LEADERBOARD_BY_WINS_KEY, { [player2Id]: player2.wins });
    
    console.log(`   ✅ Updated player 1 stats: Wins=${player1.wins}, Winnings=${player1.totalWinnings}`);
    console.log(`   ✅ Updated player 2 stats: Losses=${player2.losses}`);
    console.log(`   ✅ Updated leaderboards`);
    
    // 7. Verify Leaderboard Data
    console.log('\n7. Verifying Leaderboard Data...');
    
    // Wait a moment for any async processes to complete
    await sleep(1000);
    
    // Check leaderboard by winnings
    const topPlayersByWinnings = await redis.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, 9, { rev: true });
    console.log(`   📊 Top players by winnings: ${topPlayersByWinnings.length} players found`);
    
    // Check if our test players are in the leaderboard
    const player1RankByWinnings = topPlayersByWinnings.indexOf(player1Id);
    const player2RankByWinnings = topPlayersByWinnings.indexOf(player2Id);
    
    if (player1RankByWinnings !== -1) {
      console.log(`   ✅ Player 1 found in winnings leaderboard at position ${player1RankByWinnings + 1}`);
    } else {
      console.log(`   ❌ Player 1 not found in winnings leaderboard`);
    }
    
    if (player2RankByWinnings !== -1) {
      console.log(`   ✅ Player 2 found in winnings leaderboard at position ${player2RankByWinnings + 1}`);
    } else {
      console.log(`   ❓ Player 2 not found in winnings leaderboard (expected as they have 0 winnings)`);
    }
    
    // Check leaderboard by wins
    const topPlayersByWins = await redis.zrange(LEADERBOARD_BY_WINS_KEY, 0, 9, { rev: true });
    console.log(`   📊 Top players by wins: ${topPlayersByWins.length} players found`);
    
    const player1RankByWins = topPlayersByWins.indexOf(player1Id);
    const player2RankByWins = topPlayersByWins.indexOf(player2Id);
    
    if (player1RankByWins !== -1) {
      console.log(`   ✅ Player 1 found in wins leaderboard at position ${player1RankByWins + 1}`);
    } else {
      console.log(`   ❌ Player 1 not found in wins leaderboard`);
    }
    
    if (player2RankByWins !== -1) {
      console.log(`   ✅ Player 2 found in wins leaderboard at position ${player2RankByWins + 1}`);
    } else {
      console.log(`   ❓ Player 2 not found in wins leaderboard (expected as they have 0 wins)`);
    }
    
    // 8. Clean up test data
    console.log('\n8. Cleaning up test data...');
    
    // Ask for confirmation before cleanup
    const cleanup = await askForConfirmation('Would you like to clean up the test data? (yes/no): ');
    
    if (cleanup.toLowerCase() === 'yes') {
      // Delete match and match requests
      await redis.del(matchId);
      await redis.del(matchRequestKey1);
      await redis.del(matchRequestKey2);
      
      // Remove players from leaderboards
      await redis.zrem(LEADERBOARD_BY_WINNINGS_KEY, player1Id);
      await redis.zrem(LEADERBOARD_BY_WINNINGS_KEY, player2Id);
      await redis.zrem(LEADERBOARD_BY_WINS_KEY, player1Id);
      await redis.zrem(LEADERBOARD_BY_WINS_KEY, player2Id);
      
      // Delete player records
      await redis.del(PLAYER_KEY_PREFIX + player1Id);
      await redis.del(PLAYER_KEY_PREFIX + player2Id);
      
      console.log('   ✅ All test data cleaned up');
    } else {
      console.log('   ⚠️ Test data was not cleaned up');
      console.log(`   📝 You can view these test players in the leaderboard: ${player1Id} and ${player2Id}`);
    }
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Helper to ask for confirmation
function askForConfirmation(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the test
testGameFlow().catch(console.error);
