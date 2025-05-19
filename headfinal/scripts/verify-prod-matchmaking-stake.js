/**
 * Production matchmaking verification script for identical stakes
 * Verifies that players placing the same stake amount get matched properly
 * 
 * Usage: node scripts/verify-prod-matchmaking-stake.js [production-url]
 * Example: node scripts/verify-prod-matchmaking-stake.js your-app.vercel.app
 */

const https = require('https');
const { v4: uuidv4 } = require('uuid');

// Get the production URL from command line or use default
const PROD_URL = process.argv[2] || process.env.VERCEL_PROD_URL;
if (!PROD_URL) {
  console.error('❌ No production URL provided!');
  console.log('Usage: node scripts/verify-prod-matchmaking-stake.js your-app.vercel.app');
  process.exit(1);
}

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

// Utility to pause execution
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyMatchmakingWithSameStake() {
  console.log(`🚀 Verifying matchmaking with identical stakes on ${PROD_URL}...`);
  
  // Generate unique test players
  const testId = uuidv4().slice(0, 8);
  const player1 = `test-p1-${testId}`;
  const player2 = `test-p2-${testId}`;
  
  // Set stake amount - this is what we're testing specifically
  const stakeAmount = 0.05;
  
  console.log(`\n1️⃣ Creating match request for Player 1 (${player1}) with stake ${stakeAmount}...`);
  
  // Create first player's match request
  const response1 = await makeRequest(
    `${API_BASE}/matchmaking`,
    'POST',
    { playerPublicKey: player1, betAmount: stakeAmount }
  );
  
  if (response1.statusCode !== 200 || !response1.data.requestId) {
    console.error('❌ Failed to create match request for Player 1:', response1.data);
    return false;
  }
  
  const request1Id = response1.data.requestId;
  console.log(`✅ Player 1 request created: ${request1Id}`);
  
  // Wait a bit before creating second request
  await sleep(1000);
  
  console.log(`\n2️⃣ Creating match request for Player 2 (${player2}) with the same stake ${stakeAmount}...`);
  
  // Create second player's match request with the same stake
  const response2 = await makeRequest(
    `${API_BASE}/matchmaking`,
    'POST',
    { playerPublicKey: player2, betAmount: stakeAmount }
  );
  
  if (response2.statusCode !== 200 || !response2.data.requestId) {
    console.error('❌ Failed to create match request for Player 2:', response2.data);
    return false;
  }
  
  const request2Id = response2.data.requestId;
  console.log(`✅ Player 2 request created: ${request2Id}`);
  
  // Wait for matching to occur
  console.log('\n3️⃣ Waiting for players to match...');
  await sleep(3000);
  
  // Check status of both requests
  console.log('\n4️⃣ Checking match status for both players...');
  
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
  
  // Display status results
  console.log(`Player 1 status: ${status1.data.status}`);
  console.log(`Player 2 status: ${status2.data.status}`);
  
  // Check if both players were matched
  if (status1.data.status === 'matched' && status2.data.status === 'matched') {
    // Check if they were matched with each other
    if (status1.data.matchId === status2.data.matchId) {
      console.log(`\n✅ SUCCESS! Both players were matched together with the same stake amount!`);
      console.log(`Match ID: ${status1.data.matchId}`);
      
      // Get match details
      try {
        const matchDetails = await makeRequest(`${API_BASE}/matches/${status1.data.matchId}`);
        
        console.log('\nMatch details:');
        console.log(`Player 1: ${matchDetails.data.player1PublicKey}`);
        console.log(`Player 2: ${matchDetails.data.player2PublicKey}`);
        console.log(`Stake amount: ${matchDetails.data.betAmount}`);
        console.log(`Status: ${matchDetails.data.status}`);
      } catch (error) {
        console.log('Note: Could not fetch match details, but matching was successful');
      }
      
      return true;
    } else {
      console.error('❌ Players were matched but not with each other!');
      console.log(`Player 1 match ID: ${status1.data.matchId}`);
      console.log(`Player 2 match ID: ${status2.data.matchId}`);
      return false;
    }
  } else {
    console.error('❌ Players were not matched correctly!');
    return false;
  }
}

// Run the verification
verifyMatchmakingWithSameStake()
  .then(success => {
    console.log('\n📋 Verification Result:');
    if (success) {
      console.log('✅ PASSED - Matchmaking with identical stakes is working properly in production!');
      console.log('Players can successfully find matches when they place the same stake amount.');
      process.exit(0);
    } else {
      console.log('❌ FAILED - Matchmaking with identical stakes is not working properly in production!');
      console.log('Issue: Players with the same stake amount were not matched together.');
      console.log('\nPossible causes:');
      console.log('1. Redis ZADD operation may not be working correctly');
      console.log('2. Matchmaking logic may have issues with the same stake amounts');
      console.log('3. There may be high server load affecting matchmaking');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error during verification:', error.message);
    process.exit(1);
  });
