/**
 * Quick script to test all aspects of matchmaking
 * Run with: node scripts/quick-matchmaking-test.js [API_URL]
 */

const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Get API URL from command line arguments or use default
const API_URL = process.argv[2] || 'http://localhost:3000';

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const req = client.request(url, options, (res) => {
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

// Test Redis ZADD functionality
async function testRedisZADD() {
  console.log('Testing Redis ZADD functionality...');
  
  const testKey = `test-sortedset-${uuidv4()}`;
  const testScore = Date.now();
  const testMember = `test-member-${uuidv4()}`;
  
  try {
    const response = await makeRequest(`${API_URL}/api/test-redis-zadd`, 'POST', {
      key: testKey,
      score: testScore,
      member: testMember
    });
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Redis ZADD operation successful!');
      return true;
    } else {
      console.log('❌ Redis ZADD operation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Redis ZADD:', error.message);
    return false;
  }
}

// Test matchmaking dashboard
async function testMatchmakingDashboard() {
  console.log('\nTesting matchmaking dashboard...');
  
  try {
    const response = await makeRequest(`${API_URL}/api/matchmaking-dashboard`);
    
    if (response.statusCode === 200) {
      console.log('✅ Matchmaking dashboard is working!');
      console.log('Status:', response.data.status);
      console.log('Redis connection:', response.data.redisConnection);
      console.log('ZADD functionality:', response.data.zaddFunctionality);
      console.log('Queue count:', response.data.stats.queueCount);
      console.log('Active matches:', response.data.stats.activeMatches);
      return true;
    } else {
      console.log('❌ Matchmaking dashboard failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing matchmaking dashboard:', error.message);
    return false;
  }
}

// Test creating a match request
async function testCreateMatchRequest() {
  console.log('\nTesting matchmaking request creation...');
  
  const playerKey = `test-player-${uuidv4().slice(0, 8)}`;
  const betAmount = 10;
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/matchmaking`, 
      'POST', 
      { playerPublicKey: playerKey, betAmount }
    );
    
    if (response.statusCode === 200 && response.data.requestId) {
      console.log('✅ Successfully created match request!');
      console.log(`   Request ID: ${response.data.requestId}`);
      console.log(`   Player Key: ${playerKey}`);
      console.log(`   Status: ${response.data.status}`);
      return response.data.requestId;
    } else {
      console.log('❌ Failed to create match request:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating match request:', error.message);
    return null;
  }
}

// Check match request status
async function checkMatchRequestStatus(requestId) {
  console.log('\nChecking match request status...');
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/matchmaking`, 
      'POST', 
      { action: 'check', requestId }
    );
    
    if (response.statusCode === 200) {
      console.log('✅ Successfully checked match request status!');
      console.log(`   Status: ${response.data.status}`);
      return response.data;
    } else {
      console.log('❌ Failed to check match request status:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking match status:', error.message);
    return null;
  }
}

// Cancel match request
async function cancelMatchRequest(requestId) {
  console.log('\nCancelling match request...');
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/matchmaking`, 
      'POST', 
      { action: 'cancel', requestId }
    );
    
    if (response.statusCode === 200 && response.data.status === 'cancelled') {
      console.log('✅ Successfully cancelled match request!');
      return true;
    } else {
      console.log('❌ Failed to cancel match request:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error cancelling match request:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`🚀 Starting matchmaking tests against ${API_URL}`);
  console.log('=============================================');
  
  // Step 1: Test Redis ZADD functionality
  const zaddResult = await testRedisZADD();
  
  // Step 2: Test matchmaking dashboard
  const dashboardResult = await testMatchmakingDashboard();
  
  // Step 3: Test creating a match request
  const requestId = await testCreateMatchRequest();
  
  // Step 4: Test checking match request status (if creation succeeded)
  let statusResult = false;
  if (requestId) {
    const statusResponse = await checkMatchRequestStatus(requestId);
    statusResult = !!statusResponse;
    
    // Step 5: Test cancelling match request (if status check succeeded)
    if (statusResult) {
      await cancelMatchRequest(requestId);
    }
  }
  
  // Summary
  console.log('\n🔍 Test Results Summary:');
  console.log(`   Redis ZADD test: ${zaddResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Matchmaking dashboard: ${dashboardResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Match request creation: ${requestId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Match status check: ${statusResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = zaddResult && dashboardResult && requestId && statusResult;
  
  console.log(`\n${overallSuccess ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
