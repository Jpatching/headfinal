/**
 * Developer matchmaking utility
 * Allows developers to create and test matchmaking with specific parameters
 * 
 * Run with: node scripts/dev-matchmaking.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Constants - match the application constants
const PLAYER_KEY_PREFIX = 'player:';
const MATCH_REQUEST_PREFIX = 'matchRequest:';
const MATCH_PREFIX = 'match:';
const PENDING_MATCHES_PREFIX = 'pendingMatches:amount:';
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

// Initialize the CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize Redis client
let redis;

async function initializeRedis() {
  try {
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
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

// Create a test match request
async function createTestMatchRequest(playerPublicKey, betAmount) {
  try {
    console.log(`Creating match request for player ${playerPublicKey} with bet amount ${betAmount}...`);
    
    // Generate a unique ID for the match request
    const matchRequestId = `${MATCH_REQUEST_PREFIX}${uuidv4()}`;
    
    // Create match request object
    const matchRequest = {
      id: matchRequestId,
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending",
    };
    
    // Save to Redis
    await redis.set(matchRequestId, JSON.stringify(matchRequest));
    
    // Add to sorted set of pending matches by bet amount
    const betAmountKey = `${PENDING_MATCHES_PREFIX}${betAmount}`;
    await redis.zadd(betAmountKey, { [matchRequestId]: Date.now() });
    
    console.log(`✅ Created match request: ${matchRequestId}`);
    return matchRequestId;
  } catch (error) {
    console.error(`❌ Error creating match request: ${error.message}`);
    return null;
  }
}

// Check match request status
async function checkMatchRequest(matchRequestId) {
  try {
    const matchRequestData = await redis.get(matchRequestId);
    if (!matchRequestData) {
      console.log(`❌ Match request not found: ${matchRequestId}`);
      return null;
    }
    
    const matchRequest = JSON.parse(matchRequestData);
    console.log(`Match request status: ${matchRequest.status}`);
    
    if (matchRequest.status === "matched" && matchRequest.matchId) {
      const matchData = await redis.get(matchRequest.matchId);
      if (matchData) {
        const match = JSON.parse(matchData);
        console.log(`\nMatch found!`);
        console.log(`Match ID: ${match.id}`);
        console.log(`Player 1: ${match.player1PublicKey}`);
        console.log(`Player 2: ${match.player2PublicKey}`);
        console.log(`Bet Amount: ${match.betAmount} SOL`);
        console.log(`Status: ${match.status}`);
        return match;
      }
    }
    
    return matchRequest;
  } catch (error) {
    console.error(`❌ Error checking match request: ${error.message}`);
    return null;
  }
}

// Manually complete a match
async function completeMatch(matchId, winnerId) {
  try {
    const matchData = await redis.get(matchId);
    if (!matchData) {
      console.log(`❌ Match not found: ${matchId}`);
      return false;
    }
    
    const match = JSON.parse(matchData);
    
    if (match.status !== "active") {
      console.log(`❌ Match is not active (status: ${match.status})`);
      return false;
    }
    
    // Update match status
    match.status = "completed";
    match.winnerId = winnerId;
    await redis.set(matchId, JSON.stringify(match));
    
    console.log(`✅ Match ${matchId} completed. Winner: ${winnerId}`);
    
    // Update player stats
    await updatePlayerStats(winnerId, true, match.betAmount * 2);
    const loserId = match.player1PublicKey === winnerId ? match.player2PublicKey : match.player1PublicKey;
    await updatePlayerStats(loserId, false, 0);
    
    return true;
  } catch (error) {
    console.error(`❌ Error completing match: ${error.message}`);
    return false;
  }
}

// Update player stats
async function updatePlayerStats(publicKey, isWinner, winAmount) {
  try {
    const playerKey = `${PLAYER_KEY_PREFIX}${publicKey}`;
    let playerData = await redis.get(playerKey);
    let player;
    
    if (playerData) {
      player = JSON.parse(playerData);
      
      // Update stats
      if (isWinner) {
        player.wins += 1;
        player.totalWinnings += winAmount;
      } else {
        player.losses += 1;
      }
      player.totalPlayed += 1;
      player.lastPlayed = Date.now();
    } else {
      // Create new player record
      player = {
        publicKey,
        username: publicKey.slice(0, 6) + '...',
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        totalWinnings: isWinner ? winAmount : 0,
        totalPlayed: 1,
        lastPlayed: Date.now()
      };
    }
    
    // Save player data
    await redis.set(playerKey, JSON.stringify(player));
    
    // Update leaderboards
    await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { [publicKey]: player.totalWinnings });
    await redis.zadd(LEADERBOARD_BY_WINS_KEY, { [publicKey]: player.wins });
    
    console.log(`✅ Updated stats for player ${publicKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating player stats: ${error.message}`);
    return false;
  }
}

// Main menu
async function showMainMenu() {
  console.log("\n=== Developer Matchmaking Utility ===");
  console.log("1. Create test match request");
  console.log("2. Check match request status");
  console.log("3. Manually complete a match");
  console.log("4. View pending matches");
  console.log("5. Create a developer vs developer match");
  console.log("6. Exit");
  
  const choice = await ask("Enter your choice (1-6): ");
  
  switch (choice) {
    case "1":
      await createMatchRequestFlow();
      break;
    case "2":
      await checkMatchRequestFlow();
      break;
    case "3":
      await completeMatchFlow();
      break;
    case "4":
      await viewPendingMatches();
      break;
    case "5":
      await createDevMatch();
      break;
    case "6":
      rl.close();
      return;
    default:
      console.log("Invalid choice");
      break;
  }
  
  // Show menu again
  await showMainMenu();
}

// Create match request flow
async function createMatchRequestFlow() {
  const playerPublicKey = await ask("Enter player public key: ");
  const betAmount = parseFloat(await ask("Enter bet amount (in SOL): "));
  
  if (isNaN(betAmount) || betAmount <= 0) {
    console.log("❌ Invalid bet amount");
    return;
  }
  
  const matchRequestId = await createTestMatchRequest(playerPublicKey, betAmount);
  
  if (matchRequestId) {
    console.log(`\nMatch request created successfully!`);
    console.log(`Match Request ID: ${matchRequestId}`);
    console.log(`Use this ID to check the status of your match request later.`);
    
    // Ask if they want to poll for matches
    const poll = await ask("Do you want to continuously check for matches? (y/n): ");
    
    if (poll.toLowerCase() === 'y') {
      console.log("\nChecking for matches every 2 seconds. Press Ctrl+C to stop.");
      let attempts = 0;
      const maxAttempts = 30; // 1 minute (30 * 2 seconds)
      
      const intervalId = setInterval(async () => {
        attempts++;
        
        try {
          const result = await checkMatchRequest(matchRequestId);
          
          if (result && result.status === "matched") {
            console.log("\n✅ Match found!");
            clearInterval(intervalId);
            await showMainMenu();
          }
          
          if (attempts >= maxAttempts) {
            console.log("\n⚠️ No match found after 1 minute of searching.");
            clearInterval(intervalId);
            await showMainMenu();
          }
        } catch (error) {
          console.error(`❌ Error polling for matches: ${error.message}`);
          clearInterval(intervalId);
          await showMainMenu();
        }
      }, 2000);
      
      // This will keep the process running
      await new Promise(() => {});
    }
  }
}

// Check match request flow
async function checkMatchRequestFlow() {
  const matchRequestId = await ask("Enter match request ID: ");
  await checkMatchRequest(matchRequestId);
}

// Complete match flow
async function completeMatchFlow() {
  const matchId = await ask("Enter match ID: ");
  const winnerId = await ask("Enter winner's public key: ");
  
  const success = await completeMatch(matchId, winnerId);
  
  if (success) {
    console.log(`\nMatch completed successfully!`);
    console.log(`The winner's stats and leaderboard position have been updated.`);
  }
}

// View pending matches
async function viewPendingMatches() {
  try {
    console.log("\n=== Pending Matches ===");
    
    // Search for all pending match keys
    const pendingMatchesKeys = await redis.keys(`${PENDING_MATCHES_PREFIX}*`);
    
    if (pendingMatchesKeys.length === 0) {
      console.log("No pending matches found.");
      return;
    }
    
    for (const key of pendingMatchesKeys) {
      const betAmount = key.replace(PENDING_MATCHES_PREFIX, '');
      const matchRequestIds = await redis.zrange(key, 0, -1);
      
      if (matchRequestIds.length > 0) {
        console.log(`\nBet amount ${betAmount} SOL (${matchRequestIds.length} requests):`);
        
        for (const requestId of matchRequestIds) {
          const requestData = await redis.get(requestId);
          if (requestData) {
            const request = JSON.parse(requestData);
            const timeAgo = Math.round((Date.now() - request.timestamp) / 1000);
            console.log(`  - ${requestId.replace(MATCH_REQUEST_PREFIX, '')}: ${request.playerPublicKey} (${timeAgo}s ago)`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error viewing pending matches: ${error.message}`);
  }
}

// Create a developer vs developer match
async function createDevMatch() {
  console.log("\n=== Create Developer vs Developer Match ===");
  console.log("This will create a match between two specific developers for testing.");
  
  const player1PublicKey = await ask("Enter player 1 public key: ");
  const player2PublicKey = await ask("Enter player 2 public key: ");
  const betAmount = parseFloat(await ask("Enter bet amount (in SOL): "));
  
  if (isNaN(betAmount) || betAmount <= 0) {
    console.log("❌ Invalid bet amount");
    return;
  }
  
  try {
    // Create a match directly
    const matchId = `${MATCH_PREFIX}${uuidv4()}`;
    const match = {
      id: matchId,
      player1PublicKey,
      player2PublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "active"
    };
    
    await redis.set(matchId, JSON.stringify(match));
    
    // Create match requests for both players
    const matchRequest1Id = `${MATCH_REQUEST_PREFIX}${uuidv4()}`;
    const matchRequest2Id = `${MATCH_REQUEST_PREFIX}${uuidv4()}`;
    
    const matchRequest1 = {
      id: matchRequest1Id,
      playerPublicKey: player1PublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "matched",
      matchId
    };
    
    const matchRequest2 = {
      id: matchRequest2Id,
      playerPublicKey: player2PublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "matched",
      matchId
    };
    
    await redis.set(matchRequest1Id, JSON.stringify(matchRequest1));
    await redis.set(matchRequest2Id, JSON.stringify(matchRequest2));
    
    console.log(`\n✅ Developer match created successfully!`);
    console.log(`Match ID: ${matchId}`);
    console.log(`Player 1: ${player1PublicKey}`);
    console.log(`Player 2: ${player2PublicKey}`);
    console.log(`Bet Amount: ${betAmount} SOL`);
    console.log(`\nBoth players can now use this match ID to access the game.`);
    console.log(`For direct access, navigate to: /game/${matchId}`);
    
  } catch (error) {
    console.error(`❌ Error creating developer match: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log("Developer Matchmaking Utility");
  console.log("=============================");
  
  const connected = await initializeRedis();
  
  if (!connected) {
    console.log("❌ Failed to connect to Redis. Exiting...");
    rl.close();
    return;
  }
  
  await showMainMenu();
}

// Handle exit gracefully
rl.on('close', () => {
  console.log('\nThank you for using the Developer Matchmaking Utility');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  rl.close();
});
