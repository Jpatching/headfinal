/**
 * Redis connection verification script
 * Run with: node scripts/verify-redis.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function verifyRedisConnection() {
  console.log('Redis Connection Verification');
  console.log('============================');
  
  // Initialize Redis client with different configurations for fallback
  let redis;
  let connected = false;
  let method = '';
  
  // Try connecting using REST API first (recommended for Vercel)
  try {
    console.log('\n1. Trying Upstash Redis REST API connection...');
    
    const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    
    if (!restUrl || !restToken) {
      console.log('  ❌ Missing REST API URL or token');
    } else {
      redis = new Redis({
        url: restUrl,
        token: restToken,
      });
      
      const pingResult = await redis.ping();
      if (pingResult === 'PONG') {
        console.log('  ✅ REST API connection successful');
        connected = true;
        method = 'REST API';
      } else {
        console.log(`  ❌ Unexpected ping response: ${pingResult}`);
      }
    }
  } catch (error) {
    console.error(`  ❌ REST API connection error: ${error.message}`);
  }
  
  // Try connecting using TLS URL if REST API failed
  if (!connected) {
    try {
      console.log('\n2. Trying Upstash Redis TLS connection...');
      
      const redisUrl = process.env.UPSTASH_REDIS_KV_URL || process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.log('  ❌ Missing Redis URL');
      } else {
        redis = new Redis(redisUrl);
        
        const pingResult = await redis.ping();
        if (pingResult === 'PONG') {
          console.log('  ✅ TLS connection successful');
          connected = true;
          method = 'TLS URL';
        } else {
          console.log(`  ❌ Unexpected ping response: ${pingResult}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ TLS connection error: ${error.message}`);
    }
  }
  
  if (!connected) {
    console.error('\n❌ All Redis connection methods failed');
    process.exit(1);
  }
  
  // Test basic operations
  console.log('\n3. Testing basic Redis operations...');
  
  try {
    // Test set/get
    const testKey = `test:${Date.now()}`;
    const testValue = `value:${Date.now()}`;
    
    await redis.set(testKey, testValue);
    console.log('  ✅ SET operation successful');
    
    const retrievedValue = await redis.get(testKey);
    if (retrievedValue === testValue) {
      console.log('  ✅ GET operation successful');
    } else {
      console.log(`  ❌ GET returned wrong value: expected ${testValue}, got ${retrievedValue}`);
    }
    
    await redis.del(testKey);
    console.log('  ✅ DEL operation successful');
    
    // Test sorted set operations (needed for leaderboards)
    const testZsetKey = `test:zset:${Date.now()}`;
    
    // FIXED: Correct format for ZADD with Upstash Redis
    await redis.zadd(testZsetKey, { score: 10, member: "score1" });
    await redis.zadd(testZsetKey, { score: 20, member: "score2" });
    await redis.zadd(testZsetKey, { score: 30, member: "score3" });
    console.log('  ✅ ZADD operation successful');
    
    const zsetResult = await redis.zrange(testZsetKey, 0, -1, { withScores: true });
    if (zsetResult && zsetResult.length === 3) {
      console.log('  ✅ ZRANGE operation successful');
    } else {
      console.log(`  ❌ ZRANGE returned unexpected result: ${JSON.stringify(zsetResult)}`);
    }
    
    await redis.del(testZsetKey);
  } catch (error) {
    console.error(`  ❌ Redis operations error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n✅ Redis is properly configured and working!');
  console.log(`   Connected using ${method}`);
  console.log('   You are ready to use Redis for matchmaking and leaderboards');
}

verifyRedisConnection().catch(err => {
  console.error('Redis verification failed:', err);
  process.exit(1);
});