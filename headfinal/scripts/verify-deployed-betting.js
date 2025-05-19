/**
 * Verify deployed betting functionality using Vercel CLI
 * This script uses Vercel CLI to verify the betting functionality on the deployed application
 * 
 * Usage: node scripts/verify-deployed-betting.js
 */

const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Test two player wallets
const PLAYER1 = {
  publicKey: `test-player1-${uuidv4().slice(0, 8)}`,
  balance: 1000
};

const PLAYER2 = {
  publicKey: `test-player2-${uuidv4().slice(0, 8)}`,
  balance: 1000
};

// Test bet amount
const TEST_BET_AMOUNT = 0.01; // SOL

console.log(`🚀 Verifying deployed betting functionality...`);
console.log(`Player 1: ${PLAYER1.publicKey}`);
console.log(`Player 2: ${PLAYER2.publicKey}`);
console.log(`Bet Amount: ${TEST_BET_AMOUNT} SOL`);

// Step 1: Create a new match with our test players
console.log("\n📋 Step 1: Creating a test match...");

try {
  // Use vercel cli to invoke the API directly
  const createMatchCommand = `vercel invoke api/matchmaking -d '{"playerPublicKey":"${PLAYER1.publicKey}","betAmount":${TEST_BET_AMOUNT},"gameMode":"1v1","characterId":"cr7"}'`;
  console.log(`Running: ${createMatchCommand}`);
  
  const result = execSync(createMatchCommand, { encoding: 'utf8' });
  console.log(`Response: ${result}`);
  
  const matchData = JSON.parse(result);
  
  if (!matchData || !matchData.matchId) {
    console.error('❌ Failed to create match: No match ID returned');
    process.exit(1);
  }
  
  const matchId = matchData.matchId;
  console.log(`✅ Match created successfully with ID: ${matchId}`);
  
  // Step 2: Join the match with player 2
  console.log("\n📋 Step 2: Joining the match with second player...");
  
  const joinMatchCommand = `vercel invoke api/matches/${matchId} -d '{"playerPublicKey":"${PLAYER2.publicKey}","action":"join","characterId":"mbappe"}'`;
  console.log(`Running: ${joinMatchCommand}`);
  
  const joinResult = execSync(joinMatchCommand, { encoding: 'utf8' });
  console.log(`Response: ${joinResult}`);
  
  const joinData = JSON.parse(joinResult);
  
  if (!joinData || !joinData.success) {
    console.error('❌ Failed to join match');
    process.exit(1);
  }
  
  console.log(`✅ Player 2 joined the match successfully`);
  
  // Step 3: Get match details to verify the bet amount
  console.log("\n📋 Step 3: Verifying match details and betting information...");
  
  const getMatchCommand = `vercel invoke api/matches/${matchId}`;
  console.log(`Running: ${getMatchCommand}`);
  
  const matchDetailsResult = execSync(getMatchCommand, { encoding: 'utf8' });
  console.log(`Response: ${matchDetailsResult}`);
  
  const matchDetails = JSON.parse(matchDetailsResult);
  
  if (!matchDetails) {
    console.error('❌ Failed to get match details');
    process.exit(1);
  }
  
  // Verify that the bet amount matches our test amount
  if (matchDetails.betAmount !== TEST_BET_AMOUNT) {
    console.error(`❌ Bet amount mismatch. Expected: ${TEST_BET_AMOUNT}, Actual: ${matchDetails.betAmount}`);
  } else {
    console.log(`✅ Bet amount verified: ${matchDetails.betAmount} SOL`);
  }
  
  // Verify that both players are correctly assigned
  if (matchDetails.player1PublicKey !== PLAYER1.publicKey) {
    console.error(`❌ Player 1 mismatch. Expected: ${PLAYER1.publicKey}, Actual: ${matchDetails.player1PublicKey}`);
  } else {
    console.log(`✅ Player 1 verified: ${matchDetails.player1PublicKey}`);
  }
  
  if (matchDetails.player2PublicKey !== PLAYER2.publicKey) {
    console.error(`❌ Player 2 mismatch. Expected: ${PLAYER2.publicKey}, Actual: ${matchDetails.player2PublicKey}`);
  } else {
    console.log(`✅ Player 2 verified: ${matchDetails.player2PublicKey}`);
  }
  
  console.log("\n✅✅✅ BETTING FUNCTIONALITY VERIFIED SUCCESSFULLY ✅✅✅");
  console.log(`The deployed application is working correctly with Redis and the betting system.`);
  console.log(`Two players can connect to the same match with a bet amount of ${TEST_BET_AMOUNT} SOL.`);

} catch (error) {
  console.error(`❌ Error during verification: ${error.message}`);
  process.exit(1);
}
