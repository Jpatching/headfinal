// filepath: scripts/check-match.js
/**
 * Script to check if a match exists in Redis and is accessible
 * Run with: node scripts/check-match.js [MATCH_ID]
 */
require('dotenv').config();
const { Redis } = require('@upstash/redis');

// Match ID to check (default or from command line)
const MATCH_ID = process.argv[2] || '908d0710-389b-4902-9fa2-f91d1f6514f9';

async function checkMatch() {
  console.log(`🔍 Checking match: ${MATCH_ID}`);
  
  try {
    // Initialize Redis client
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
    });
    
    // Test Redis connection
    const pingResult = await redis.ping();
    console.log(`Redis connection: ${pingResult === 'PONG' ? '✅ Connected' : '❌ Failed'}`);
    
    if (pingResult !== 'PONG') {
      throw new Error('Redis connection failed');
    }
    
    // Check if match exists
    const matchKey = `match:${MATCH_ID}`;
    console.log(`Looking for match with key: ${matchKey}`);
    
    const matchData = await redis.get(matchKey);
    
    if (!matchData) {
      console.log('❌ Match not found in Redis');
      
      // Look for any matches
      const allMatches = await redis.keys('match:*');
      console.log(`Found ${allMatches.length} other matches in Redis`);
      
      if (allMatches.length > 0) {
        console.log('Here are some available matches:');
        for (const key of allMatches.slice(0, 5)) {
          const match = await redis.get(key);
          console.log(`- ${key}: ${JSON.stringify(match)}`);
        }
      }
    } else {
      console.log('✅ Match found:');
      console.log(matchData);
      
      // Print connect instructions
      console.log('\n🎮 To join this match:');
      console.log(`1. Open a browser to: http://localhost:3000/play/${MATCH_ID}`);
      console.log(`2. Production URL: https://headfinal-j49eiz2pd-jpatchings-projects.vercel.app/play/${MATCH_ID}`);
      console.log('\nNote: Both players need to use the same bet amount to be matched');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the check
checkMatch();
