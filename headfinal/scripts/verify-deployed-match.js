// filepath: scripts/verify-deployed-match.js
/**
 * Script to verify a specific match exists in a deployed environment
 * Run with: node scripts/verify-deployed-match.js [API_BASE_URL]
 */

const API_BASE_URL = process.argv[2] || 'https://headfinal-j49eiz2pd-jpatchings-projects.vercel.app';
const MATCH_ID = '908d0710-389b-4902-9fa2-f91d1f6514f9';

async function verifyMatch() {
  console.log(`🔍 Verifying match ${MATCH_ID} at ${API_BASE_URL}...`);
  
  try {
    // 1. First check the API endpoint
    console.log('\n1. Testing API endpoint...');
    const matchResponse = await fetch(`${API_BASE_URL}/api/matches/${MATCH_ID}`);
    
    if (!matchResponse.ok) {
      const error = await matchResponse.text();
      throw new Error(`Match API returned status ${matchResponse.status}: ${error}`);
    }
    
    const matchData = await matchResponse.json();
    console.log(`✅ API endpoint returned match data: ${JSON.stringify(matchData, null, 2)}`);
    
    // 2. Check that the status API is working
    console.log('\n2. Testing Redis status...');
    const statusResponse = await fetch(`${API_BASE_URL}/api/redis-status`);
    
    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      throw new Error(`Status API returned error: ${error}`);
    }
    
    const statusData = await statusResponse.json();
    console.log(`✅ Redis status: ${JSON.stringify(statusData, null, 2)}`);
    
    // All tests passed
    console.log('\n✅ All tests passed - match is accessible in the deployed environment');
    console.log(`📱 Match URL: ${API_BASE_URL}/play/${MATCH_ID}`);
  } catch (error) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the verification
verifyMatch();
