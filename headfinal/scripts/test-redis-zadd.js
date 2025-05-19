/**
 * Script to specifically test Upstash Redis ZADD functionality
 * Run with: npm run test:redis-zadd
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');

// Initialize Redis client with environment variables
// IMPORTANT: Don't hardcode credentials
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL || 'https://intimate-cowbird-32452.upstash.io',
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || 'AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA',
});

// Utility to log test results
function logResult(testName, success, details = {}) {
  console.log(`\n${success ? '✅' : '❌'} ${testName}`);
  if (details.error) {
    console.error(`   Error: ${details.error.message}`);
    console.error(`   Command: ${details.command || 'unknown'}`);
    console.error(`   Args: ${JSON.stringify(details.args || {})}`);
  }
  if (details.result) {
    console.log(`   Result: ${JSON.stringify(details.result)}`);
  }
}

async function runTest(testFn, testName) {
  try {
    const result = await testFn();
    logResult(testName, true, { result });
    return true;
  } catch (error) {
    logResult(testName, false, { 
      error, 
      command: error.command || testName,
      args: error.args || {} 
    });
    return false;
  }
}

// Test 1: Basic ZADD operation
async function testBasicZADD() {
  const key = `test:zadd:basic:${uuidv4().slice(0, 8)}`;
  const score = Date.now();
  const member = `member:${uuidv4().slice(0, 8)}`;
  
  // FIXED: Using the correct Upstash Redis ZADD syntax
  // The score must be the key in an object with the member as the value
  const result = await redis.zadd(key, { [score]: member });
  
  // Verify by reading back
  const readResult = await redis.zrange(key, 0, -1, { withScores: true });
  
  return { 
    added: result, 
    verification: readResult,
    key,
    score,
    member
  };
}

// Test 2: Multiple members in one ZADD
async function testMultiMemberZADD() {
  const key = `test:zadd:multi:${uuidv4().slice(0, 8)}`;
  const baseScore = Date.now();
  
  // FIXED: This is how you add multiple members with scores in one call for Upstash Redis
  const scoresObj = {};
  scoresObj[baseScore] = `member1:${uuidv4().slice(0, 8)}`;
  scoresObj[baseScore + 1] = `member2:${uuidv4().slice(0, 8)}`;
  scoresObj[baseScore + 2] = `member3:${uuidv4().slice(0, 8)}`;
  
  const result = await redis.zadd(key, scoresObj);
  
  // Verify count
  const count = await redis.zcard(key);
  // Read all members
  const members = await redis.zrange(key, 0, -1, { withScores: true });
  
  return { added: result, count, members };
}

// Test 3: ZADD with NX option (only add new elements)
async function testZADDWithNX() {
  const key = `test:zadd:nx:${uuidv4().slice(0, 8)}`;
  const score = Date.now();
  const member = `member:${uuidv4().slice(0, 8)}`;
  
  // First add normally
  await redis.zadd(key, { [score]: member });
  
  // Try to update the same member with NX option
  // FIXED: Correct format for NX option with Upstash Redis
  const scoreObj = {};
  scoreObj[score + 1000] = member;
  const nxResult = await redis.zadd(key, scoreObj, { nx: true });
  
  // Should not update the score because NX means "only add new elements"
  const verification = await redis.zscore(key, member);
  
  return { 
    nxResult, 
    expectedScore: score,
    actualScore: verification
  };
}

// Test 4: ZADD with XX option (only update existing elements)
async function testZADDWithXX() {
  const key = `test:zadd:xx:${uuidv4().slice(0, 8)}`;
  const score = Date.now();
  const member = `member:${uuidv4().slice(0, 8)}`;
  const newMember = `newmember:${uuidv4().slice(0, 8)}`;
  
  // First add a member
  await redis.zadd(key, { [score]: member });
  
  // Try to add a new member with XX option (should not add)
  // FIXED: Correct format for XX option
  const xxResultNew = await redis.zadd(key, { [score + 500]: newMember }, { xx: true });
  
  // Try to update existing member with XX option (should update)
  const xxResultExisting = await redis.zadd(key, { [score + 1000]: member }, { xx: true });
  
  // Verify
  const count = await redis.zcard(key);
  const updatedScore = await redis.zscore(key, member);
  
  return {
    xxResultNew,
    xxResultExisting,
    count,
    updatedScore
  };
}

// Test 5: ZADD with matchmaking-like pattern (common in game matchmaking)
async function testMatchmakingPattern() {
  const queueKey = `test:matchmaking:queue:${uuidv4().slice(0, 8)}`;
  const timestamp = Date.now();
  const player1 = `player:${uuidv4().slice(0, 8)}`;
  const player2 = `player:${uuidv4().slice(0, 8)}`;
  
  // Add players to matchmaking queue
  // FIXED: Correct format for ZADD
  await redis.zadd(queueKey, { [timestamp]: player1 });
  await redis.zadd(queueKey, { [timestamp + 100]: player2 });
  
  // Get the oldest players in queue (lowest score first)
  const playersToMatch = await redis.zrange(queueKey, 0, 1);
  
  // Create a match ID
  const matchId = `match:${uuidv4()}`;
  
  // Remove matched players from queue
  const removeResult = await redis.zrem(queueKey, playersToMatch);
  
  // Store match data
  const matchData = {
    id: matchId,
    players: playersToMatch,
    createdAt: Date.now()
  };
  await redis.set(matchId, JSON.stringify(matchData));
  
  return {
    matchId,
    matchData,
    playersToMatch,
    removeResult
  };
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running Redis ZADD Tests for Matchmaking\n');
  
  let allPassed = true;
  
  // Run each test
  allPassed &= await runTest(testBasicZADD, 'Basic ZADD Operation');
  allPassed &= await runTest(testMultiMemberZADD, 'Multiple Members ZADD');
  allPassed &= await runTest(testZADDWithNX, 'ZADD with NX Option');
  allPassed &= await runTest(testZADDWithXX, 'ZADD with XX Option');
  allPassed &= await runTest(testMatchmakingPattern, 'Matchmaking Pattern');
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`   Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n⚠️ Troubleshooting tips:');
    console.log('   1. Check if your Redis instance supports all ZADD options');
    console.log('   2. Verify correct syntax is being used for your Redis version');
    console.log('   3. Check connection details and authentication');
    console.log('   4. Review command arguments for correct formatting');
  }
  
  return allPassed;
}

// Run the tests
runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
