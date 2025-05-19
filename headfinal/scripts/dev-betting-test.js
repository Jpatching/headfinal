/**
 * Developer betting test utility
 * Allows two developers to test betting functionality with each other
 * 
 * Run with: node scripts/dev-betting-test.js [betAmount]
 * 
 * Example: 
 *   Developer 1: node scripts/dev-betting-test.js 0.1
 *   Developer 2: node scripts/dev-betting-test.js 0.1
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const { exec } = require('child_process');

// Constants - match the application constants
const MATCH_REQUEST_PREFIX = 'matchrequest:';
const MATCH_PREFIX = 'match:';
const PENDING_MATCHES_PREFIX = 'pendingmatches:amount:';

// Parse command line arguments
const betAmount = parseFloat(process.argv[2]) || 0.01; // Default to 0.01 SOL if not specified

// Initialize the CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize Redis client
let redis;
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function initializeRedis() {
  try {
    const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisRestUrl || !redisRestToken) {
      throw new Error("Redis connection details not found in environment variables");
    }
    
    redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });
    
    await redis.ping();
    console.log("✅ Connected to Redis");
    return true;
  } catch (error) {
    console.error(`❌ Redis connection failed: ${error.message}`);
    return false;
  }
}

// Helper to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Create a match request
async function createMatchRequest(playerPublicKey, betAmount) {
  try {
    const requestId = uuidv4();
    const request = {
      id: requestId,
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending"
    };
    
    // Store the request
    const requestKey = `${MATCH_REQUEST_PREFIX}${requestId}`;
    await redis.set(requestKey, JSON.stringify(request));
    
    // Add to pending queue by amount (for matchmaking)
    const pendingQueueKey = `${PENDING_MATCHES_PREFIX}${betAmount}`;
    await redis.zadd(pendingQueueKey, { score: Date.now(), member: requestId });
    
    return { requestId, request };
  } catch (error) {
    console.error("Error creating match request:", error);
    throw error;
  }
}

// Check if a match has been found
async function checkForMatch(requestId) {
  try {
    const requestKey = `${MATCH_REQUEST_PREFIX}${requestId}`;
    const requestData = await redis.get(requestKey);
    
    if (!requestData) {
      return { matched: false, error: "Match request not found" };
    }
    
    const request = JSON.parse(requestData);
    
    if (request.status === "matched" && request.matchId) {
      // Match found!
      const matchKey = `${MATCH_PREFIX}${request.matchId}`;
      const matchData = await redis.get(matchKey);
      
      if (!matchData) {
        return { matched: false, error: "Match reference exists but match data not found" };
      }
      
      const match = JSON.parse(matchData);
      return { matched: true, match };
    }
    
    return { matched: false };
  } catch (error) {
    console.error("Error checking for match:", error);
    return { matched: false, error: error.message };
  }
}

// Continuously poll for a match
async function waitForMatch(requestId, timeout = 60000) {
  console.log(`\nWaiting for another developer to join with the same bet amount (${betAmount} SOL)...`);
  console.log(`This will timeout after ${timeout/1000} seconds if no match is found.`);
  console.log("Share this bet amount with your colleague to test together.\n");
  
  const startTime = Date.now();
  let matchFound = false;
  let match = null;
  
  while (Date.now() - startTime < timeout && !matchFound) {
    const result = await checkForMatch(requestId);
    
    if (result.matched) {
      matchFound = true;
      match = result.match;
      break;
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write(".");
  }
  
  console.log(); // New line after dots
  
  if (matchFound) {
    return { success: true, match };
  } else {
    return { success: false, error: "Timeout waiting for match" };
  }
}

// Open the match in a browser
function openMatchInBrowser(matchId) {
  const matchUrl = `${BASE_URL}/play/${matchId}`;
  console.log(`\n🌐 Opening match in browser: ${matchUrl}`);
  
  // Determine the platform and open browser accordingly
  if (process.platform === 'win32') {
    exec(`start ${matchUrl}`);
  } else if (process.platform === 'darwin') {
    exec(`open ${matchUrl}`);
  } else {
    exec(`xdg-open ${matchUrl}`);
  }
}

// Main function to run the betting test
async function runBettingTest() {
  console.log("Developer Betting Test Utility");
  console.log("=============================");
  console.log(`Using bet amount: ${betAmount} SOL\n`);
  
  // Initialize Redis
  const connected = await initializeRedis();
  if (!connected) {
    rl.close();
    return;
  }
  
  try {
    // Get wallet public key (for testing, can be any string)
    const walletPublicKey = await ask("Enter your wallet public key (or any test ID): ");
    
    console.log(`\nCreating match request for player: ${walletPublicKey}`);
    console.log(`Bet amount: ${betAmount} SOL`);
    
    // Create match request
    const { requestId } = await createMatchRequest(walletPublicKey, betAmount);
    console.log(`✅ Match request created with ID: ${requestId}`);
    
    // Wait for match
    const matchResult = await waitForMatch(requestId);
    
    if (matchResult.success) {
      console.log("\n✅ Match found!");
      console.log(`Match ID: ${matchResult.match.id}`);
      console.log(`Player 1: ${matchResult.match.player1PublicKey}`);
      console.log(`Player 2: ${matchResult.match.player2PublicKey}`);
      console.log(`Bet Amount: ${matchResult.match.betAmount} SOL`);
      
      // Open match in browser
      openMatchInBrowser(matchResult.match.id);
      
      console.log("\n📝 Instructions for testing:");
      console.log("1. Both players should now have the game open in their browsers");
      console.log("2. Play the game until completion");
      console.log("3. Check that the winner receives the bet amount");
      
    } else {
      console.log(`\n❌ No match found: ${matchResult.error}`);
      console.log("Make sure another developer is running this script with the same bet amount.");
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the main function
runBettingTest().catch(console.error);
