/**
 * Core verification script that checks only critical functionality
 * Run before deploying to ensure wagering will work
 * 
 * Usage: node scripts/verify-core.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function verifyCoreComponents() {
  console.log('🔍 Verifying core components for live wagering...');
  
  // 1. Check Redis connection
  try {
    console.log('\n1. Testing Redis connection...');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    const ping = await redis.ping();
    if (ping === 'PONG') {
      console.log('✅ Redis connection is working');
    } else {
      console.error('❌ Redis connection failed');
      return false;
    }
    
    // Test ZADD specifically
    const testKey = `test:verify:${Date.now()}`;
    const score = Date.now();
    const member = `test:${Date.now()}`;
    
    try {
      // Fix: Using the correct format for Upstash Redis ZADD
      const scoreObj = {};
      scoreObj[score] = member;
      await redis.zadd(testKey, scoreObj);
      console.log('✅ Redis ZADD operation is working');
      
      // Cleanup
      await redis.del(testKey);
    } catch (error) {
      console.error('❌ Redis ZADD operation failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Redis check failed:', error.message);
    return false;
  }
  
  // 2. Check escrow key configuration
  console.log('\n2. Checking escrow configuration...');
  if (!process.env.ESCROW_PUBLIC_KEY || !process.env.ESCROW_PRIVATE_KEY) {
    console.error('❌ Escrow keys are not configured correctly');
    return false;
  }
  console.log('✅ Escrow keys are configured');
  
  // 3. Check Solana RPC endpoint
  console.log('\n3. Checking Solana RPC configuration...');
  if (!process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT) {
    console.error('❌ Solana RPC endpoint is not configured');
    return false;
  }
  console.log('✅ Solana RPC endpoint is configured');
  
  console.log('\n✅ All core components for wagering are properly configured!');
  console.log('You and your friend should be able to play with real Solana wagering on Vercel.');
  
  return true;
}

verifyCoreComponents()
  .then(success => {
    if (!success) {
      console.log('\n❌ Core verification failed! Please fix the issues before deploying.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during verification:', error);
    process.exit(1);
  });
