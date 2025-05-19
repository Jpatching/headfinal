/**
 * Redis verification utility
 * 
 * This module provides functions to verify Redis connectivity
 * and can be used both programmatically and as a CLI tool.
 */

import { Redis } from '@upstash/redis';

interface VerificationResult {
  success: boolean;
  message: string;
  details?: {
    environmentVariables: {
      restUrl: boolean;
      restToken: boolean;
    };
    connection: boolean;
    operations: {
      get: boolean;
      set: boolean;
      del: boolean;
      zadd: boolean;
      zrange: boolean;
    };
  };
  error?: Error;
}

/**
 * Verifies Redis connection and basic operations
 */
export async function verifyRedisConnection(): Promise<VerificationResult> {
  try {
    const redisRestUrl = process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisRestToken = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Start building result object
    const result: VerificationResult = {
      success: false,
      message: "Verification started",
      details: {
        environmentVariables: {
          restUrl: !!redisRestUrl,
          restToken: !!redisRestToken
        },
        connection: false,
        operations: {
          get: false,
          set: false,
          del: false,
          zadd: false,
          zrange: false
        }
      }
    };
    
    // Check for required environment variables
    if (!redisRestUrl || !redisRestToken) {
      result.message = "Missing required Redis environment variables";
      return result;
    }
    
    // Initialize Redis client
    const redis = new Redis({
      url: redisRestUrl,
      token: redisRestToken,
    });
    
    // Test connection
    const pingResponse = await redis.ping();
    result.details!.connection = pingResponse === 'PONG';
    
    if (!result.details!.connection) {
      result.message = "Redis connection failed";
      return result;
    }
    
    // Test basic operations
    const testKey = "verify-redis-test-key";
    const testValue = `test-value-${Date.now()}`;
    
    // Test set operation
    await redis.set(testKey, testValue);
    result.details!.operations.set = true;
    
    // Test get operation
    const retrievedValue = await redis.get(testKey);
    result.details!.operations.get = retrievedValue === testValue;
    
    // Test delete operation
    await redis.del(testKey);
    result.details!.operations.del = true;
    
    // Test sorted set operations
    const testSetKey = "verify-redis-test-set";
    
    // Test zadd operation
    await redis.zadd(testSetKey, { "player1": 100, "player2": 200 });
    result.details!.operations.zadd = true;
    
    // Test zrange operation
    const topPlayers = await redis.zrange(testSetKey, 0, -1, { withScores: true, rev: true });
    result.details!.operations.zrange = 
      topPlayers.length === 2 && 
      topPlayers[0].member === "player2" && 
      topPlayers[1].member === "player1";
    
    // Clean up
    await redis.del(testSetKey);
    
    // Determine overall success
    const allOperationsSuccessful = 
      result.details!.operations.get &&
      result.details!.operations.set &&
      result.details!.operations.del &&
      result.details!.operations.zadd &&
      result.details!.operations.zrange;
    
    result.success = result.details!.connection && allOperationsSuccessful;
    result.message = result.success 
      ? "All Redis verification tests passed successfully" 
      : "Some Redis verification tests failed";
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: "Redis verification error",
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// If this file is run directly, execute verification
if (require.main === module) {
  // Running as a script, perform verification and print results
  verifyRedisConnection()
    .then(result => {
      if (result.success) {
        console.log("\n✅ Redis verification successful!");
      } else {
        console.error("\n❌ Redis verification failed:", result.message);
        if (result.details) {
          console.error("Details:", JSON.stringify(result.details, null, 2));
        }
        if (result.error) {
          console.error("Error:", result.error);
        }
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("\n❌ Unhandled error during verification:", error);
      process.exit(1);
    });
}
