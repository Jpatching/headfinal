/**
 * Production matchmaking verification script
 * Simulates two players finding each other and completing a match
 * 
 * Run with: node scripts/verify-prod-matchmaking.js [deployment-url]
 */

const https = require('https');
const { v4: uuidv4 } = require('uuid');

// Get the production URL from command line or environment
const PROD_URL = process.argv[2] || process.env.VERCEL_PROD_URL || 'your-app.vercel.app';
const API_BASE = `https://${PROD_URL}/api`;

// Utility function to make HTTPS requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// First, quickly check Redis ZADD to ensure that works
async function verifyRedisZADD() {
  console.log('\n🔍 Verifying Redis ZADD operation...');
  
  const testKey = `test-sortedset-${uuidv4().slice(0, 8)}`;
  const testScore = Date.now();
  const testMember = `test-member-${uuidv4().slice(0, 8)}`;
  
  try {
    const response = await makeRequest(`${API_BASE}/test-redis-zadd`, 'POST', {
      key: testKey,
      score: testScore,
      member: testMember
    });
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Redis ZADD operation works!');
      return true;
    } else {
      console.log('❌ Redis ZADD operation failed:');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Redis ZADD:', error.message);
    return false;
  }
}

// Get matchmaking health status
async function getMatchmakingHealth() {
  console.log('\n🔍 Checking matchmaking health...');
  
  try {
    const response = await makeRequest(`${API_BASE}/matchmaking-health`);
    
    if (response.statusCode === 200) {
      console.log(`✅ Matchmaking health: ${response.data.status}`);
      console.log(`   Redis connection: ${response.data.redis}`);
      console.log(`   Queue count: ${response.data.matchmaking?.queueCount}`);
      console.log(`   Active matches: ${response.data.matchmaking?.activeMatches}`);
      return true;
    } else {
      console.log('❌ Failed to get matchmaking health:');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking matchmaking health:', error.message);
    return false;
  }
}

// Create and test matchmaking for two players
async function testMatchmaking() {
  console.log('\n🔍 Testing matchmaking with two simulated players...');
  
  const player1Key = `test-player-${uuidv4().slice(0, 8)}`;
  const player2Key = `test-player-${uuidv4().slice(0, 8)}`;
  const betAmount = 0.1;
  
  console.log(`   Player 1: ${player1Key}`);
  console.log(`   Player 2: ${player2Key}`);
  console.log(`   Bet Amount: ${betAmount}`);
  
  try {
    // Create first player's request
    console.log('\n   Creating Player 1 match request...');
    const response1 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { playerPublicKey: player1Key, betAmount }
    );
    
    if (response1.statusCode !== 200 || !response1.data.requestId) {
      console.log('❌ Failed to create match request for Player 1:');
      console.log(response1.data);
      return false;
    }
    
    const request1Id = response1.data.requestId;
    console.log(`   ✅ Player 1 request created: ${request1Id}`);
    
    // Create second player's request
    console.log('\n   Creating Player 2 match request...');
    const response2 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { playerPublicKey: player2Key, betAmount }
    );
    
    if (response2.statusCode !== 200 || !response2.data.requestId) {
      console.log('❌ Failed to create match request for Player 2:');
      console.log(response2.data);
      return false;
    }
    
    const request2Id = response2.data.requestId;
    console.log(`   ✅ Player 2 request created: ${request2Id}`);
    
    // Wait for matching to occur (2 seconds should be enough)
    console.log('\n   Waiting for players to match...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check status of both requests
    console.log('\n   Checking match status for both players...');
    
    const status1 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { action: 'check', requestId: request1Id }
    );
    
    const status2 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { action: 'check', requestId: request2Id }
    );
    
    console.log(`   Player 1 status: ${status1.data.status}`);
    console.log(`   Player 2 status: ${status2.data.status}`);
    
    if (status1.data.status === 'matched' && status2.data.status === 'matched') {
      console.log('\n✅ SUCCESS! Both players matched successfully.');
      
      if (status1.data.matchId === status2.data.matchId) {
        const matchId = status1.data.matchId;
        console.log(`   Match ID: ${matchId}`);
        
        // Get match details
        const matchDetails = await makeRequest(`${API_BASE}/matches/${matchId}`);
        if (matchDetails.statusCode === 200) {
          console.log('\n   Match details:');
          console.log(`   Player 1: ${matchDetails.data.player1PublicKey}`);
          console.log(`   Player 2: ${matchDetails.data.player2PublicKey}`);
          console.log(`   Bet Amount: ${matchDetails.data.betAmount}`);
          console.log(`   Status: ${matchDetails.data.status}`);
        }
        
        return true;
      } else {
        console.log('❌ Players have different match IDs - something is wrong!');
        return false;
      }
    } else {
      console.log('❌ Players were not matched correctly.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during matchmaking test:', error.message);
    return false;
  }
}

// Main verification function
async function verifyProdMatchmaking() {
  console.log('🚀 Verifying production matchmaking on:', PROD_URL);
  
  // Step 1: Verify Redis ZADD works
  const zaddOk = await verifyRedisZADD();
  
  // Step 2: Check matchmaking health
  const healthOk = await getMatchmakingHealth();
  
  // Step 3: Test actual matchmaking
  const matchmakingOk = await testMatchmaking();
  
  // Results summary
  console.log('\n📋 Verification Results:');
  console.log(`   Redis ZADD: ${zaddOk ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Matchmaking Health: ${healthOk ? '✅ HEALTHY' : '❌ ISSUES'}`);
  console.log(`   Matchmaking Test: ${matchmakingOk ? '✅ SUCCESSFUL' : '❌ FAILED'}`);
  
  const allPassed = zaddOk && healthOk && matchmakingOk;
  
  if (allPassed) {
    console.log('\n🎉 VERIFICATION PASSED! Matchmaking is working correctly in production.');
    return true;
  } else {
    console.log('\n⚠️ VERIFICATION FAILED! Matchmaking has issues in production.');
    return false;
  }
}

// Show usage if no URL provided
if (PROD_URL === 'your-app.vercel.app') {
  console.log('⚠️ No production URL provided!');
  console.log('Usage: node scripts/verify-prod-matchmaking.js your-app.vercel.app');
  console.log('Or set VERCEL_PROD_URL environment variable.');
  process.exit(1);
}

// Run the verification
verifyProdMatchmaking()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
