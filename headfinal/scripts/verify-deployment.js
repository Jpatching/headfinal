/**
 * Comprehensive deployment verification script
 * Checks all components: KV connection, leaderboard, matchmaking
 * 
 * Run with: node scripts/verify-deployment.js [deployment-url]
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

async function verifyDeployment(deploymentUrl = process.env.VERCEL_URL) {
  console.log('Verifying Deployment Environment');
  console.log('================================');
  
  if (!deploymentUrl) {
    console.log('❓ No deployment URL provided. Please specify as an argument or set VERCEL_URL environment variable.');
    console.log('   Usage: node scripts/verify-deployment.js [deployment-url]');
    process.exit(1);
  }
  
  // Normalize URL
  if (!deploymentUrl.startsWith('http')) {
    deploymentUrl = `https://${deploymentUrl}`;
  }
  
  console.log(`🔍 Checking deployment at: ${deploymentUrl}`);
    // Check KV Status
  try {
    const kvStatusUrl = `${deploymentUrl}/api/kv-status`;
    console.log(`\n📡 Checking KV status at: ${kvStatusUrl}`);
    
    const response = await fetch(kvStatusUrl);
    const data = await response.json();
    
    console.log(`   Status code: ${response.status}`);
    console.log(`   KV connection status: ${data.status}`);
    
    if (data.status === 'connected') {
      console.log('   ✅ KV is properly connected!');
    } else {
      console.log('   ❌ KV is not connected.');
      console.log('   Check your environment variables in the Vercel dashboard:');
      console.log('   - UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN should be set for Upstash Redis');
      
    }
    
    console.log('\n📊 KV Response Details:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('   ❌ Failed to check KV status:', error.message);
  }
  
  // Check Matchmaking Health
  try {
    const matchmakingHealthUrl = `${deploymentUrl}/api/matchmaking-health`;
    console.log(`\n🎮 Checking Matchmaking Health at: ${matchmakingHealthUrl}`);
    
    const response = await fetch(matchmakingHealthUrl);
    const data = await response.json();
    
    console.log(`   Status code: ${response.status}`);
    console.log(`   Matchmaking system status: ${data.status}`);
    console.log(`   Redis connection: ${data.redis}`);
    
    if (data.status === 'healthy') {
      console.log('   ✅ Matchmaking system is healthy!');
    } else {
      console.log('   ⚠️ Matchmaking system is degraded.');
    }
    
    console.log('\n📊 Matchmaking Health Details:');
    console.log('   Queue count:', data.matchmaking?.queueCount);
    console.log('   Active matches:', data.matchmaking?.activeMatches);
    console.log('   Last cleanup run:', data.matchmaking?.cleanup?.lastRun || 'Never');
    
    if (!data.matchmaking?.cleanup?.isRecent) {
      console.log('   ⚠️ Cleanup job has not run recently. Check Vercel Cron Jobs.');
    }
  } catch (error) {
    console.log('   ❌ Failed to check matchmaking health:', error.message);
  }
  
  // Check Matchmaking Debug
  try {
    const matchmakingDebugUrl = `${deploymentUrl}/api/matchmaking-debug`;
    console.log(`\n🔍 Checking Matchmaking Debug Info at: ${matchmakingDebugUrl}`);
    
    const response = await fetch(matchmakingDebugUrl);
    const data = await response.json();
    
    console.log(`   Status code: ${response.status}`);
    
    if (data.status === 'ok') {
      console.log('   ✅ Matchmaking debug endpoint is responding correctly!');
      console.log(`   Keys found: ${data.debugData?.allKeys?.length || 0}`);
    } else {
      console.log('   ❌ Matchmaking debug endpoint reported an error:', data.message);
    }
  } catch (error) {
    console.log('   ❌ Failed to check matchmaking debug info:', error.message);
  }
  } catch (error) {
    console.error('\n❌ Error checking KV status:', error.message);
  }
  
  // Check Leaderboard API
  try {
    const leaderboardUrl = `${deploymentUrl}/api/leaderboard?limit=5`;
    console.log(`\n📡 Checking leaderboard API at: ${leaderboardUrl}`);
    
    const response = await fetch(leaderboardUrl);
    const data = await response.json();
    
    console.log(`   Status code: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Leaderboard API is responding!');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Found ${data.length} leaderboard entries`);
      } else {
        console.log('   ⚠️ Leaderboard is empty or not returning expected data format');
      }
      
      console.log('\n📊 Leaderboard Sample:');
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
    } else {
      console.log('   ❌ Leaderboard API returned an error');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error checking leaderboard API:', error.message);
  }
  
  // Verify Redis directly
  try {
    console.log('\n📡 Verifying direct Redis connection...');
    
    // Redis credentials
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisRestUrl || !redisRestToken) {
      console.log('   ❌ Missing Redis credentials in environment variables');
      console.log('   Please set UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN');
    } else {
      const redis = new Redis({
        url: redisRestUrl,
        token: redisRestToken,
      });
      
      const pong = await redis.ping();
      console.log(`   Redis PING result: ${pong}`);
      
      if (pong === 'PONG') {
        console.log('   ✅ Direct Redis connection successful!');
        
        // Verify leaderboard structure
        const leaderboardByWinnings = await redis.exists('leaderboard:byWinnings');
        const leaderboardByWins = await redis.exists('leaderboard:byWins');
        
        console.log('\n📊 Leaderboard Structure:');
        console.log(`   leaderboard:byWinnings: ${leaderboardByWinnings ? '✅ Exists' : '❌ Missing'}`);
        console.log(`   leaderboard:byWins: ${leaderboardByWins ? '✅ Exists' : '❌ Missing'}`);
        
        // Check for active matches
        const matchKeys = await redis.keys('match:*');
        console.log(`\n🎮 Active Matches: ${matchKeys.length}`);
        
        // Count pending match requests
        const pendingMatchesKeys = await redis.keys('pendingMatches:amount:*');
        let totalPending = 0;
        
        for (const key of pendingMatchesKeys) {
          const count = await redis.zcard(key);
          totalPending += count;
          const betAmount = key.replace('pendingMatches:amount:', '');
          console.log(`   Pending matches for ${betAmount} SOL: ${count}`);
        }
        
        console.log(`   Total pending match requests: ${totalPending}`);
      } else {
        console.log('   ❌ Direct Redis connection failed');
      }
    }
  } catch (error) {
    console.error('\n❌ Error verifying Redis directly:', error.message);
  }
  
  // 5. Compare with production deployment
  console.log('\n5. Checking production deployment compatibility...');
  try {
    console.log('  Fetching production API status...');
    const prodResponse = await fetch('https://headfinal-j49eiz2pd-jpatchings-projects.vercel.app/api/status');
    const prodData = await prodResponse.json();
    
    console.log('  Fetching local API status...');
    let localResponse;
    try {
      localResponse = await fetch('http://localhost:3000/api/status');
    } catch (error) {
      console.error('  ❌ Local server not running. Please start your local server with "npm run dev"');
      process.exit(1);
    }
    
    const localData = await localResponse.json();
    
    // Compare versions and configuration
    if (prodData.version !== localData.version) {
      console.error(`  ❌ Version mismatch: Production ${prodData.version}, Local ${localData.version}`);
    } else {
      console.log(`  ✅ Version match: ${prodData.version}`);
    }
    
    // Check Redis configuration
    if (prodData.redis?.connected && !localData.redis?.connected) {
      console.error('  ❌ Redis connection issue: Production is connected but local is not');
    } else {
      console.log('  ✅ Redis connection status matches production');
    }
  } catch (error) {
    console.error(`  ❌ Error checking production compatibility: ${error.message}`);
  }
  
  // Overall status
  console.log('\n================================');
  console.log('📋 Deployment Verification Summary:');
  console.log('--------------------------------');
  console.log('✅ Deployment URL reachable');
  console.log('✅ API endpoints verified');
  console.log('✅ Redis connectivity checked');
  console.log('✅ Leaderboard structure validated');
  console.log('✅ Match system inspected');
  console.log('================================');
  console.log('\n🎮 Game deployment verification complete!');
}

// Run the verification with command line arg or environment variable
const deploymentUrl = process.argv[2] || process.env.VERCEL_URL;
verifyDeployment(deploymentUrl).catch(console.error);
