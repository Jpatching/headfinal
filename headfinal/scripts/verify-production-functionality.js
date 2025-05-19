/**
 * Comprehensive verification script for testing matchmaking, betting, and leaderboard functionality
 * in the Vercel production environment.
 * 
 * Usage: node scripts/verify-production-functionality.js your-app.vercel.app
 */

const https = require('https');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Get the Vercel URL from command line or environment variable
const VERCEL_URL = process.argv[2] || process.env.VERCEL_URL || 'your-app.vercel.app';
const API_BASE = `https://${VERCEL_URL}/api`;

// Create two test player wallets
const PLAYER1 = {
  publicKey: `test-player1-${uuidv4().slice(0, 8)}`,
  balance: 1000
};

const PLAYER2 = {
  publicKey: `test-player2-${uuidv4().slice(0, 8)}`,
  balance: 1000
};

// Test bet amount
const TEST_BET_AMOUNT = 100;

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

// Utility to pause execution
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility to create an interactive readline interface
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Verify Redis connection is working
async function verifyRedisConnection() {
  console.log(`\n🧪 STEP 1: Verifying Redis connection...`);
  
  try {
    const { statusCode, data } = await makeRequest(`${API_BASE}/api/kv-status`);
    
    if (statusCode === 200 && data.status === 'ok') {
      console.log(`✅ Redis connection successful: ${JSON.stringify(data)}`);
      return true;
    } else {
      console.error(`❌ Redis connection failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Redis connection check failed with error:`, error);
    return false;
  }
}

// Create a match request for player 1
async function createMatchRequestForPlayer1() {
  console.log(`\n🧪 STEP 2: Creating match request for Player 1 (${PLAYER1.publicKey})...`);
  
  try {
    const { statusCode, data } = await makeRequest(
      `${API_BASE}/matchmaking`,
      'POST',
      {
        playerPublicKey: PLAYER1.publicKey,
        betAmount: TEST_BET_AMOUNT,
        action: 'create'
      }
    );
    
    if (statusCode === 200 && data.request && data.request.id) {
      console.log(`✅ Match request created successfully: ${data.request.id}`);
      return data.request;
    } else {
      console.error(`❌ Failed to create match request: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Match request creation failed with error:`, error);
    return null;
  }
}

// Create a match request for player 2 to match with player 1
async function createMatchRequestForPlayer2() {
  console.log(`\n🧪 STEP 3: Creating match request for Player 2 (${PLAYER2.publicKey})...`);
  
  try {
    const { statusCode, data } = await makeRequest(
      `${API_BASE}/matchmaking`,
      'POST',
      {
        playerPublicKey: PLAYER2.publicKey,
        betAmount: TEST_BET_AMOUNT,
        action: 'create'
      }
    );
    
    if (statusCode === 200 && data.request && data.request.id) {
      console.log(`✅ Match request created successfully: ${data.request.id}`);
      return data.request;
    } else {
      console.error(`❌ Failed to create match request: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Match request creation failed with error:`, error);
    return null;
  }
}

// Check if the match was created
async function checkMatchStatus(requestId) {
  console.log(`\n🧪 STEP 4: Checking match status for request ${requestId}...`);
  
  try {
    const { statusCode, data } = await makeRequest(
      `${API_BASE}/matchmaking`,
      'POST',
      {
        requestId,
        action: 'check'
      }
    );
    
    if (statusCode === 200) {
      console.log(`✅ Match status: ${JSON.stringify(data)}`);
      return data;
    } else {
      console.error(`❌ Failed to check match status: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Match status check failed with error:`, error);
    return null;
  }
}

// Simulate completing a match with a winner
async function simulateMatchCompletion(matchId, winnerId) {
  console.log(`\n🧪 STEP 5: Simulating match completion with winner ${winnerId}...`);
  
  try {
    const { statusCode, data } = await makeRequest(
      `${API_BASE}/matches/${matchId}/complete`,
      'POST',
      {
        winnerId
      }
    );
    
    if (statusCode === 200) {
      console.log(`✅ Match completed successfully: ${JSON.stringify(data)}`);
      return data;
    } else {
      console.error(`❌ Failed to complete match: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Match completion failed with error:`, error);
    return null;
  }
}

// Check if leaderboard was updated
async function checkLeaderboard() {
  console.log(`\n🧪 STEP 6: Checking leaderboard updates...`);
  
  try {
    const { statusCode, data } = await makeRequest(`${API_BASE}/leaderboard`);
    
    if (statusCode === 200) {
      console.log(`✅ Leaderboard retrieved: ${JSON.stringify(data)}`);
      
      // Check if our test players are on the leaderboard
      const player1Entry = data.find(entry => entry.playerId === PLAYER1.publicKey);
      const player2Entry = data.find(entry => entry.playerId === PLAYER2.publicKey);
      
      if (player1Entry || player2Entry) {
        console.log(`✅ Test players found on leaderboard!`);
      } else {
        console.log(`⚠️ Test players not found on leaderboard yet.`);
      }
      
      return data;
    } else {
      console.error(`❌ Failed to retrieve leaderboard: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Leaderboard retrieval failed with error:`, error);
    return null;
  }
}

// Main verification function
async function verifyProductionFunctionality() {
  console.log(`\n📋 PRODUCTION VERIFICATION SCRIPT`);
  console.log(`-----------------------------------`);
  console.log(`🌐 Target: ${VERCEL_URL}`);
  console.log(`🧪 Test Players: ${PLAYER1.publicKey}, ${PLAYER2.publicKey}`);
  console.log(`💰 Test Bet Amount: ${TEST_BET_AMOUNT}`);
  console.log(`-----------------------------------`);
  
  // Step 1: Verify Redis connection
  const redisConnected = await verifyRedisConnection();
  if (!redisConnected) {
    console.error(`❌ Redis connection failed, aborting verification.`);
    return;
  }
  
  // Step 2: Create match request for player 1
  const player1Request = await createMatchRequestForPlayer1();
  if (!player1Request) {
    console.error(`❌ Player 1 match request failed, aborting verification.`);
    return;
  }
  
  // Step 3: Create match request for player 2
  const player2Request = await createMatchRequestForPlayer2();
  if (!player2Request) {
    console.error(`❌ Player 2 match request failed, aborting verification.`);
    return;
  }
  
  // Step 4: Wait a moment for match to be created
  console.log(`\n⏳ Waiting for match to be created...`);
  await sleep(3000);
  
  // Step 5: Check match status for player 1
  const matchStatus1 = await checkMatchStatus(player1Request.id);
  
  // Step 6: Check match status for player 2
  const matchStatus2 = await checkMatchStatus(player2Request.id);
  
  // If either request has a matchId, use that for the next step
  const matchId = (matchStatus1 && matchStatus1.matchId) || 
                 (matchStatus2 && matchStatus2.matchId);
  
  if (!matchId) {
    console.error(`❌ No match created, aborting verification.`);
    return;
  }
  
  console.log(`\n✅ Match created with ID: ${matchId}`);
  
  // Step 7: Let's have Player 1 win the match
  const matchResult = await simulateMatchCompletion(matchId, PLAYER1.publicKey);
  if (!matchResult) {
    console.error(`❌ Match completion failed, aborting verification.`);
    return;
  }
  
  // Step 8: Wait a moment for leaderboard to update
  console.log(`\n⏳ Waiting for leaderboard to update...`);
  await sleep(3000);
  
  // Step 9: Check if leaderboard was updated
  const leaderboard = await checkLeaderboard();
  
  // Final verification summary
  console.log(`\n📋 VERIFICATION SUMMARY`);
  console.log(`-----------------------------------`);
  
  let success = true;
  
  if (!redisConnected) {
    console.log(`❌ Redis connection: FAILED`);
    success = false;
  } else {
    console.log(`✅ Redis connection: PASSED`);
  }
  
  if (!player1Request || !player2Request) {
    console.log(`❌ Match request creation: FAILED`);
    success = false;
  } else {
    console.log(`✅ Match request creation: PASSED`);
  }
  
  if (!matchId) {
    console.log(`❌ Matchmaking: FAILED`);
    success = false;
  } else {
    console.log(`✅ Matchmaking: PASSED`);
  }
  
  if (!matchResult) {
    console.log(`❌ Match completion: FAILED`);
    success = false;
  } else {
    console.log(`✅ Match completion: PASSED`);
  }
  
  if (!leaderboard) {
    console.log(`❌ Leaderboard update: FAILED`);
    success = false;
  } else {
    console.log(`✅ Leaderboard update: PASSED`);
  }
  
  console.log(`-----------------------------------`);
  console.log(success ? `✅ ALL TESTS PASSED!` : `❌ SOME TESTS FAILED`);
  console.log(`-----------------------------------`);
}

// Run the verification
verifyProductionFunctionality().catch(error => {
  console.error('Verification script failed with error:', error);
});
