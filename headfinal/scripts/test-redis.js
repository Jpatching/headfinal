/**
 * Test script for Upstash Redis connectivity
 * Run with: node scripts/test-redis.js
 */

require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function testRedisConnection() {
  console.log("Testing Upstash Redis Connection");
  console.log("===============================");

  // Check for Upstash Redis credentials
  const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisRestUrl && redisRestToken) {
    console.log(`✅ Found Upstash Redis REST URL: ${redisRestUrl}`);
    console.log(`   Type: REST API (Upstash)`);
  } else {
    console.error("❌ No Upstash Redis connection details found in environment variables");
    console.log("   Please set UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN in your .env file");
    return false;
  }

  try {
    // Initialize Redis client with Upstash credentials
    const redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });

    console.log("✅ Upstash Redis client initialized");

    // Test ping
    const pong = await redis.ping();
    console.log(`✅ Upstash Redis connection test result: ${pong}`);
    console.log(`   Connection successful!`);

    // Test basic get/set operations
    try {
      const testKey = "test-key";
      const testValue = "test-value";
      
      // Set a value
      await redis.set(testKey, testValue);
      
      // Get the value back
      const result = await redis.get(testKey);
      
      if (result === testValue) {
        console.log(`✅ Basic Upstash Redis operations successful. Retrieved value: "${result}"`);
      } else {
        console.log(`❌ Basic operations test failed. Expected "${testValue}" but got "${result}"`);
      }
      
      // Clean up
      await redis.del(testKey);
    } catch (error) {
      console.error(`❌ ERROR: Basic Upstash Redis operations failed: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ ERROR: Upstash Redis connection failed: ${error.message}`);
    return false;
  }
}

// Run the test
testRedisConnection()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
