// filepath: scripts/connect-to-match.js
/**
 * Script to connect directly to a match
 * Run with: node scripts/connect-to-match.js
 */
require('dotenv').config();
const { exec } = require('child_process');
const { Redis } = require('@upstash/redis');

// Match ID to connect to
const MATCH_ID = '908d0710-389b-4902-9fa2-f91d1f6514f9';
const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function connectToMatch() {
  console.log(`🎮 Connecting to match ${MATCH_ID}...`);
  
  try {
    // Verify the match exists in Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
    
    const matchKey = `match:${MATCH_ID}`;
    const match = await redis.get(matchKey);
    
    if (!match) {
      console.error(`❌ Match ${MATCH_ID} not found in Redis`);
      process.exit(1);
    }
    
    console.log('✅ Match found in Redis:');
    console.log(match);
    
    // Open the match in the default browser
    const matchUrl = `${BASE_URL}/play/${MATCH_ID}`;
    console.log(`\n🌐 Opening match in browser: ${matchUrl}`);
    
    // Determine the platform and open browser accordingly
    if (process.platform === 'win32') {
      exec(`start ${matchUrl}`);
    } else if (process.platform === 'darwin') {
      exec(`open ${matchUrl}`);
    } else {
      exec(`xdg-open ${matchUrl}`);
    }
    
    console.log('\n✅ Match opened in browser');
    console.log('Note: Both players need to be using the same bet amount to be matched properly');
  } catch (error) {
    console.error(`\n❌ Error connecting to match: ${error.message}`);
    process.exit(1);
  }
}

// Run the connection
connectToMatch();
