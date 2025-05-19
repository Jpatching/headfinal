/**
 * Script to verify matchmaking is working correctly in production
 * Run with: node scripts/verify-matchmaking.js
 */

const https = require('https');
const { v4: uuidv4 } = require('uuid');

// Replace with your actual Vercel deployment URL
const VERCEL_URL = process.env.VERCEL_URL || 'localhost:3000';
const API_BASE = `http${VERCEL_URL.includes('localhost') ? '' : 's'}://${VERCEL_URL}/api`;

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

// Test function to verify basic API connectivity
async function testApiConnectivity() {
  try {
    console.log('🔍 Testing API connectivity...');
    const response = await makeRequest(`${API_BASE}/api/kv-status`);
    
    if (response.statusCode === 200 && response.data.status === 'ok') {
      console.log('✅ API is reachable and Redis/KV connection is working!');
      return true;
    } else {
      console.log('❌ API is reachable but Redis/KV connection might have issues:');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
    return false;
  }
}

// Test matchmaking request creation
async function testMatchmakingRequest() {
  try {
    console.log('\n🔍 Testing matchmaking request creation...');
    
    const playerKey = `test-player-${uuidv4().slice(0, 8)}`;
    const betAmount = 10;
    
    const response = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { playerPublicKey: playerKey, betAmount }
    );
    
    if (response.statusCode === 200 && response.data.id) {
      console.log('✅ Successfully created match request!');
      console.log(`   Request ID: ${response.data.id}`);
      console.log(`   Player Key: ${playerKey}`);
      console.log(`   Bet Amount: ${betAmount}`);
      return response.data.id;
    } else {
      console.log('❌ Failed to create match request:');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating match request:', error.message);
    return null;
  }
}

// Test matchmaking status check
async function testMatchmakingStatus(requestId) {
  try {
    console.log('\n🔍 Testing matchmaking status check...');
    
    const response = await makeRequest(`${API_BASE}/matchmaking/${requestId}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Successfully checked match request status!');
      console.log(`   Status: ${response.data.status}`);
      if (response.data.matchId) {
        console.log(`   Match ID: ${response.data.matchId}`);
      }
      return response.data;
    } else {
      console.log('❌ Failed to check match request status:');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking match status:', error.message);
    return null;
  }
}

// Create two match requests to test matching mechanism
async function testCompleteMatchmaking() {
  try {
    console.log('\n🔍 Testing complete matchmaking process with two players...');
    
    const player1Key = `test-player-${uuidv4().slice(0, 8)}`;
    const player2Key = `test-player-${uuidv4().slice(0, 8)}`;
    const betAmount = 15;
    
    // Create first request
    console.log('   Creating first player request...');
    const response1 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { playerPublicKey: player1Key, betAmount }
    );
    
    if (response1.statusCode !== 200 || !response1.data.id) {
      console.log('❌ Failed to create first player request');
      return false;
    }
    
    const request1Id = response1.data.id;
    console.log(`   First player request created: ${request1Id}`);
    
    // Create second request (should match with first)
    console.log('   Creating second player request (should match with first)...');
    const response2 = await makeRequest(
      `${API_BASE}/matchmaking`, 
      'POST', 
      { playerPublicKey: player2Key, betAmount }
    );
    
    if (response2.statusCode !== 200 || !response2.data.id) {
      console.log('❌ Failed to create second player request');
      return false;
    }
    
    const request2Id = response2.data.id;
    console.log(`   Second player request created: ${request2Id}`);
    
    // Check if they got matched
    console.log('   Checking if players were matched...');
    
    // Wait a moment to allow matching to occur
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check status of first request
    const status1 = await makeRequest(`${API_BASE}/matchmaking/${request1Id}`);
    // Check status of second request
    const status2 = await makeRequest(`${API_BASE}/matchmaking/${request2Id}`);
    
    if (status1.data.status === 'matched' && status2.data.status === 'matched') {
      console.log('✅ SUCCESS! Both players were matched successfully.');
      console.log(`   Match ID for player 1: ${status1.data.matchId}`);
      console.log(`   Match ID for player 2: ${status2.data.matchId}`);
      
      // Verify they were matched together (same match ID)
      if (status1.data.matchId === status2.data.matchId) {
        console.log('✅ Both players have the same match ID - perfect match!');
        
        // Check the match details
        const matchResponse = await makeRequest(`${API_BASE}/matches/${status1.data.matchId}`);
        if (matchResponse.statusCode === 200) {
          console.log('✅ Successfully retrieved match details:');
          console.log(`   Player 1: ${matchResponse.data.player1PublicKey}`);
          console.log(`   Player 2: ${matchResponse.data.player2PublicKey}`);
          console.log(`   Bet Amount: ${matchResponse.data.betAmount}`);
          console.log(`   Status: ${matchResponse.data.status}`);
        }
        
        return true;
      } else {
        console.log('❌ Players have different match IDs - something is wrong!');
        return false;
      }
    } else {
      console.log('❌ Players were not matched correctly:');
      console.log(`   Player 1 status: ${status1.data.status}`);
      console.log(`   Player 2 status: ${status2.data.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing complete matchmaking:', error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('🚀 Starting matchmaking verification tests...');
  console.log(`🌐 Testing against: ${API_BASE}`);
  
  // Test 1: Basic API connectivity
  const connectivityOk = await testApiConnectivity();
  if (!connectivityOk) {
    console.log('⛔ Aborting further tests due to connectivity issues');
    process.exit(1);
  }
  
  // Test 2: Single matchmaking request
  const requestId = await testMatchmakingRequest();
  if (!requestId) {
    console.log('⛔ Aborting further tests due to request creation issues');
    process.exit(1);
  }
  
  // Test 3: Check status of that request
  await testMatchmakingStatus(requestId);
  
  // Test 4: Complete matchmaking with two players
  const matchmakingSuccess = await testCompleteMatchmaking();
  
  // Summary
  console.log('\n📋 Test Results Summary:');
  console.log(`   API Connectivity: ${connectivityOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Request Creation: ${requestId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Complete Matchmaking: ${matchmakingSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectivityOk && requestId && matchmakingSuccess) {
    console.log('\n🎉 ALL TESTS PASSED! Matchmaking is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ SOME TESTS FAILED. Check logs above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
