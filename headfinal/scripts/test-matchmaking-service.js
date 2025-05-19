/**
 * Script to test if matchmaking is working correctly
 * Run with: node scripts/test-matchmaking-service.js
 */

const { v4: uuidv4 } = require('uuid');
const { createMatchRequest, findMatch, getMatch, getMatchStatus } = require('../lib/matchmaking-service');

// Function to test the entire matchmaking flow
async function testMatchmaking() {
  console.log('🚀 Testing matchmaking service...');
  
  try {
    // Generate random player IDs
    const player1 = `test-p1-${uuidv4().substring(0, 8)}`;
    const player2 = `test-p2-${uuidv4().substring(0, 8)}`;
    const betAmount = 10;
    
    console.log(`Creating match request for player 1 (${player1})...`);
    
    // Create first match request
    const request1 = await createMatchRequest({
      id: uuidv4(),
      playerPublicKey: player1,
      betAmount,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    console.log(`Match request created for player 1: ${request1.id}`);
    
    // Check status of the first request
    const status1 = await getMatchStatus(request1.id);
    console.log(`Status of player 1 request: ${status1.status}`);
    
    // Create second match request (should match with first)
    console.log(`Creating match request for player 2 (${player2})...`);
    const request2 = {
      id: uuidv4(),
      playerPublicKey: player2,
      betAmount,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Try to find a match for the second player
    console.log('Attempting to find a match...');
    const match = await findMatch(request2);
    
    if (match) {
      console.log('✅ Match found!');
      console.log(`Match ID: ${match.id}`);
      console.log(`Player 1: ${match.player1PublicKey}`);
      console.log(`Player 2: ${match.player2PublicKey}`);
      console.log(`Bet Amount: ${match.betAmount}`);
      console.log(`Match Status: ${match.status}`);
      
      // Check if player 1's request was updated
      const updatedStatus1 = await getMatchStatus(request1.id);
      console.log(`Updated status of player 1 request: ${updatedStatus1.status}`);
      console.log(`Match ID linked to player 1: ${updatedStatus1.matchId}`);
      
      // Verify the match directly
      console.log('Verifying match details...');
      const matchDetails = await getMatch(match.id);
      console.log(`Match verified: ${JSON.stringify(matchDetails, null, 2)}`);
      
      return true;
    } else {
      console.log('❌ No match found.');
      console.log('Possible reasons:');
      console.log('- The first request might have expired');
      console.log('- There might be an issue with the matchmaking logic');
      console.log('- Redis connection might be having issues');
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing matchmaking:', error);
    return false;
  }
}

// Run the test
testMatchmaking()
  .then(success => {
    if (success) {
      console.log('🎉 Matchmaking test completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️ Matchmaking test completed with issues.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
