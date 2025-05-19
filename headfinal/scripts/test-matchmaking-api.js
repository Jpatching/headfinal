/**
 * Script to test the matchmaking API endpoint
 * Run with: node scripts/test-matchmaking-api.js [API_URL]
 * 
 * Example:
 * - Local: node scripts/test-matchmaking-api.js http://localhost:3000
 * - Vercel: node scripts/test-matchmaking-api.js https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Get the API base URL from command line arguments or use default
const apiBaseUrl = process.argv[2] || 'http://localhost:3000';
console.log(`Testing matchmaking API at: ${apiBaseUrl}`);

// Helper function for making HTTP requests
function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    // Determine if we're using http or https
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
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

// Test the matchmaking API
async function testMatchmakingAPI() {
  try {
    console.log('🚀 Testing matchmaking API...');
    
    // Create two players
    const player1 = `api-test-p1-${uuidv4().substring(0, 8)}`;
    const player2 = `api-test-p2-${uuidv4().substring(0, 8)}`;
    const betAmount = 15;
    
    // Create first match request
    console.log(`Creating match request for player 1 (${player1})...`);
    const response1 = await makeRequest(
      `${apiBaseUrl}/api/matchmaking`,
      'POST',
      {
        playerPublicKey: player1,
        betAmount
      }
    );
    
    if (response1.statusCode !== 200) {
      console.error('❌ Failed to create first match request');
      console.error(response1.data);
      return false;
    }
    
    console.log(`✅ Match request created for player 1:`);
    console.log(`   Request ID: ${response1.data.requestId}`);
    console.log(`   Status: ${response1.data.status}`);
    
    const requestId1 = response1.data.requestId;
    
    // Check the status of the first request
    console.log('Checking status of player 1 request...');
    const statusResponse1 = await makeRequest(
      `${apiBaseUrl}/api/matchmaking`,
      'POST',
      {
        action: 'check',
        requestId: requestId1
      }
    );
    
    if (statusResponse1.statusCode !== 200) {
      console.error('❌ Failed to check first match request status');
      console.error(statusResponse1.data);
      return false;
    }
    
    console.log(`✅ Player 1 request status: ${statusResponse1.data.status}`);
    
    // Create second match request (should match with first)
    console.log(`Creating match request for player 2 (${player2})...`);
    const response2 = await makeRequest(
      `${apiBaseUrl}/api/matchmaking`,
      'POST',
      {
        playerPublicKey: player2,
        betAmount
      }
    );
    
    if (response2.statusCode !== 200) {
      console.error('❌ Failed to create second match request');
      console.error(response2.data);
      return false;
    }
    
    console.log(`✅ Player 2 request created:`);
    console.log(`   Request ID: ${response2.data.requestId}`);
    console.log(`   Status: ${response2.data.status}`);
    
    // If player 2 was immediately matched, we're done
    if (response2.data.status === 'matched') {
      console.log('✅ Players were matched immediately!');
      console.log(`   Match ID: ${response2.data.matchId}`);
      
      // Check if player 1's request was updated
      console.log('Checking if player 1 request was updated...');
      const finalStatus1 = await makeRequest(
        `${apiBaseUrl}/api/matchmaking`,
        'POST',
        {
          action: 'check',
          requestId: requestId1
        }
      );
      
      console.log(`✅ Player 1 final status: ${finalStatus1.data.status}`);
      console.log(`   Match ID: ${finalStatus1.data.matchId}`);
      
      // Check match details
      if (response2.data.matchId) {
        console.log('Checking match details...');
        const matchResponse = await makeRequest(
          `${apiBaseUrl}/api/matches/${response2.data.matchId}`,
          'GET'
        );
        
        if (matchResponse.statusCode === 200) {
          console.log('✅ Match details retrieved:');
          console.log(`   Player 1: ${matchResponse.data.game.player1PublicKey}`);
          console.log(`   Player 2: ${matchResponse.data.game.player2PublicKey}`);
          console.log(`   Bet Amount: ${matchResponse.data.game.betAmount}`);
          console.log(`   Status: ${matchResponse.data.game.status}`);
        } else {
          console.log('❌ Failed to retrieve match details');
          console.log(matchResponse.data);
        }
      }
      
      return true;
    } 
    
    // If not matched immediately, we need to check again after a bit
    const requestId2 = response2.data.requestId;
    
    console.log('Not matched immediately, waiting a moment...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check status of both requests
    console.log('Checking status of both requests...');
    
    const finalStatus1 = await makeRequest(
      `${apiBaseUrl}/api/matchmaking`,
      'POST',
      {
        action: 'check',
        requestId: requestId1
      }
    );
    
    const finalStatus2 = await makeRequest(
      `${apiBaseUrl}/api/matchmaking`,
      'POST',
      {
        action: 'check',
        requestId: requestId2
      }
    );
    
    console.log(`Player 1 final status: ${finalStatus1.data.status}`);
    console.log(`Player 2 final status: ${finalStatus2.data.status}`);
    
    if (finalStatus1.data.status === 'matched' && finalStatus2.data.status === 'matched') {
      console.log('✅ Both players were matched successfully!');
      
      if (finalStatus1.data.matchId === finalStatus2.data.matchId) {
        console.log(`✅ Match ID is the same for both players: ${finalStatus1.data.matchId}`);
        return true;
      } else {
        console.log('❌ Players have different match IDs');
        console.log(`Player 1 match ID: ${finalStatus1.data.matchId}`);
        console.log(`Player 2 match ID: ${finalStatus2.data.matchId}`);
        return false;
      }
    } else {
      console.log('❌ Players were not matched');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing matchmaking API:', error);
    return false;
  }
}

// Run the test
testMatchmakingAPI()
  .then(success => {
    if (success) {
      console.log('🎉 Matchmaking API test completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️ Matchmaking API test completed with issues.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
