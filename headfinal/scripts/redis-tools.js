/**
 * Upstash Redis tools for managing matchmaking and leaderboard data
 * 
 * Usage: 
 *   npm run redis [command] [args]
 * 
 * Commands:
 *   ping - Test connection
 *   list-matches - List all matches
 *   list-players - List all players
 *   view-leaderboard - View the leaderboard
 *   clear-matches - Clear all matches (caution!)
 *   clear-leaderboard - Clear the leaderboard (caution!)
 *   help - Show this help message
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');

// Key prefixes (should match those in redis-client.ts)
const PLAYER_KEY_PREFIX = 'player:';
const MATCH_REQUEST_PREFIX = 'matchRequest:';
const MATCH_PREFIX = 'match:';
const PENDING_MATCHES_PREFIX = 'pendingMatches:amount:';
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

// Create a Redis client
let kv;
try {
  // Use Upstash Redis credentials
  const upstashUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    kv = new Redis({
      url: upstashUrl,
      token: upstashToken
    });
    console.log("Upstash Redis client initialized");
  } else {
    console.error("No Upstash Redis credentials found in environment variables. Please set UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN");
    process.exit(1);
  }
} catch (error) {
  console.error("Failed to initialize Upstash Redis client:", error);
  process.exit(1);
}

// Helper functions
async function pingRedis() {
  try {
    const result = await kv.ping();
    console.log(`Redis connection: ${result === 'PONG' ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  } catch (error) {
    console.error('Redis ping failed:', error);
  }
}

async function listMatches() {
  try {
    // Get all match keys
    const matchRequestKeys = await kv.keys(`${MATCH_REQUEST_PREFIX}*`);
    const matchKeys = await kv.keys(`${MATCH_PREFIX}*`);
    
    console.log(`\n=== Match Requests (${matchRequestKeys.length}) ===`);
    for (const key of matchRequestKeys) {
      const data = await kv.get(key);
      console.log(`${key}: ${JSON.stringify(data, null, 2)}`);
    }
    
    console.log(`\n=== Matches (${matchKeys.length}) ===`);
    for (const key of matchKeys) {
      const data = await kv.get(key);
      console.log(`${key}: ${JSON.stringify(data, null, 2)}`);
    }
    
    // Get pending matches by amount
    const pendingKeys = await kv.keys(`${PENDING_MATCHES_PREFIX}*`);
    console.log(`\n=== Pending Matches by Amount (${pendingKeys.length}) ===`);
    for (const key of pendingKeys) {
      const members = await kv.zrange(key, 0, -1);
      console.log(`${key}: ${members.length} pending matches`);
      if (members.length > 0) {
        console.log(`  Members: ${members.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('Error listing matches:', error);
  }
}

async function listPlayers() {
  try {
    const playerKeys = await kv.keys(`${PLAYER_KEY_PREFIX}*`);
    console.log(`\n=== Players (${playerKeys.length}) ===`);
    
    for (const key of playerKeys) {
      const data = await kv.get(key);
      console.log(`${key}: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.error('Error listing players:', error);
  }
}

async function viewLeaderboard() {
  try {
    console.log('\n=== Leaderboard by Winnings ===');
    const playersByWinnings = await kv.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, 9, { rev: true });
    console.log(`Top 10 players by winnings: ${playersByWinnings.length} found`);
    
    for (let i = 0; i < playersByWinnings.length; i++) {
      const playerKey = playersByWinnings[i];
      const playerData = await kv.get(playerKey);
      console.log(`${i+1}. ${playerKey}: ${JSON.stringify(playerData, null, 2)}`);
    }
    
    console.log('\n=== Leaderboard by Wins ===');
    const playersByWins = await kv.zrange(LEADERBOARD_BY_WINS_KEY, 0, 9, { rev: true });
    console.log(`Top 10 players by wins: ${playersByWins.length} found`);
    
    for (let i = 0; i < playersByWins.length; i++) {
      const playerKey = playersByWins[i];
      const playerData = await kv.get(playerKey);
      console.log(`${i+1}. ${playerKey}: ${JSON.stringify(playerData, null, 2)}`);
    }
  } catch (error) {
    console.error('Error viewing leaderboard:', error);
  }
}

async function clearMatches() {
  try {
    const matchRequestKeys = await kv.keys(`${MATCH_REQUEST_PREFIX}*`);
    const matchKeys = await kv.keys(`${MATCH_PREFIX}*`);
    const pendingKeys = await kv.keys(`${PENDING_MATCHES_PREFIX}*`);
    
    const confirm = await askForConfirmation(
      `Are you sure you want to delete ${matchRequestKeys.length} match requests, ${matchKeys.length} matches, and ${pendingKeys.length} pending match sets? (yes/no): `
    );
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled');
      return;
    }
    
    // Delete match requests
    for (const key of matchRequestKeys) {
      await kv.del(key);
    }
    
    // Delete matches
    for (const key of matchKeys) {
      await kv.del(key);
    }
    
    // Delete pending matches sets
    for (const key of pendingKeys) {
      // Get all members and remove them
      const members = await kv.zrange(key, 0, -1);
      for (const member of members) {
        await kv.zrem(key, member);
      }
    }
    
    console.log('All matches cleared successfully');
  } catch (error) {
    console.error('Error clearing matches:', error);
  }
}

async function clearLeaderboard() {
  try {
    const confirm = await askForConfirmation(
      'Are you sure you want to clear the leaderboard? This will remove all player entries! (yes/no): '
    );
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled');
      return;
    }
    
    // Get all members from leaderboards
    const playersByWinnings = await kv.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, -1);
    const playersByWins = await kv.zrange(LEADERBOARD_BY_WINS_KEY, 0, -1);
    
    // Remove all members
    for (const player of playersByWinnings) {
      await kv.zrem(LEADERBOARD_BY_WINNINGS_KEY, player);
    }
    
    for (const player of playersByWins) {
      await kv.zrem(LEADERBOARD_BY_WINS_KEY, player);
    }
    
    // Do you want to also remove player data?
    const confirmPlayers = await askForConfirmation(
      'Do you also want to remove all player data? (yes/no): '
    );
    
    if (confirmPlayers.toLowerCase() === 'yes') {
      const playerKeys = await kv.keys(`${PLAYER_KEY_PREFIX}*`);
      for (const key of playerKeys) {
        await kv.del(key);
      }
      console.log(`Removed ${playerKeys.length} player records`);
    }
    
    console.log('Leaderboard cleared successfully');
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
  }
}

// Helper to ask for confirmation
function askForConfirmation(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Show help message
function showHelp() {
  console.log(`
Redis Tools for Matchmaking and Leaderboard Management

Usage: npm run redis [command] [args]

Commands:
  ping                Test Redis connection
  list-matches        List all matches and match requests
  list-players        List all player data
  view-leaderboard    View the top players on the leaderboard
  clear-matches       Clear all matches (use with caution!)
  clear-leaderboard   Clear the leaderboard (use with caution!)
  help                Show this help message
  `);
}

// Main function to process commands
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    showHelp();
    return;
  }
  
  switch (command.toLowerCase()) {
    case 'ping':
      await pingRedis();
      break;
    case 'list-matches':
      await listMatches();
      break;
    case 'list-players':
      await listPlayers();
      break;
    case 'view-leaderboard':
      await viewLeaderboard();
      break;
    case 'clear-matches':
      await clearMatches();
      break;
    case 'clear-leaderboard':
      await clearLeaderboard();
      break;
    case 'help':
      showHelp();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
      break;
  }
}

// Run the main function
main().catch(console.error);
