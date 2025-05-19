import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { redis } from '@/lib/redis-client';
import { REDIS_CONFIG } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    // Check all configured environment variables
    const envStatus = {
      UPSTASH_REDIS_KV_REST_API_URL: !!process.env.UPSTASH_REDIS_KV_REST_API_URL,
      UPSTASH_REDIS_KV_REST_API_TOKEN: !!process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
      UPSTASH_REDIS_KV_REST_API_READ_ONLY_TOKEN: !!process.env.UPSTASH_REDIS_KV_REST_API_READ_ONLY_TOKEN,
      UPSTASH_REDIS_KV_URL: !!process.env.UPSTASH_REDIS_KV_URL,
      // Check for the alternative variable names as well
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    };
    
    // Test the Vercel KV client (@vercel/kv)
    let vercelKvStatus = 'error';
    let vercelKvError = null;
    try {
      const vercelKvPing = await kv.ping();
      vercelKvStatus = vercelKvPing === 'PONG' ? 'connected' : 'error';
    } catch (error) {
      vercelKvError = error.message;
    }
    
    // Test the Upstash Redis client (@upstash/redis)
    let upstashStatus = 'error';
    let upstashError = null;
    try {
      const upstashPing = await redis.ping();
      upstashStatus = upstashPing === 'PONG' ? 'connected' : 'error';
    } catch (error) {
      upstashError = error.message;
    }
    
    // Test basic key-value operations
    let operationsStatus = {};
    if (vercelKvStatus === 'connected') {
      try {
        const testKey = 'connection:test:' + Date.now();
        const testValue = { timestamp: new Date().toISOString() };
        
        await kv.set(testKey, testValue);
        const retrieved = await kv.get(testKey);
        await kv.del(testKey);
        
        operationsStatus = {
          write: true,
          read: !!retrieved,
          delete: true,
          value: retrieved
        };
      } catch (error) {
        operationsStatus = {
          error: error.message
        };
      }
    }
    
    // Collect stats
    let stats = null;
    try {
      const keys = await kv.keys('*');
      stats = {
        totalKeys: keys.length,
        sampleKeys: keys.slice(0, 5)
      };
    } catch (error) {
      stats = { error: error.message };
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV
      },
      configuredVars: envStatus,
      redisConfig: {
        restUrlConfigured: REDIS_CONFIG.restUrl === process.env.UPSTASH_REDIS_KV_REST_API_URL,
        restTokenConfigured: REDIS_CONFIG.restToken === process.env.UPSTASH_REDIS_KV_REST_API_TOKEN
      },
      clients: {
        vercelKv: {
          status: vercelKvStatus,
          error: vercelKvError
        },
        upstashRedis: {
          status: upstashStatus,
          error: upstashError
        }
      },
      operations: operationsStatus,
      stats
    });
  } catch (error) {
    console.error('Database Connection Check Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
