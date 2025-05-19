// filepath: app/api/redis-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

// Simple API endpoint to verify Redis connection status
export async function GET(req: NextRequest) {
  try {
    // Try to ping Redis
    const pingResult = await redis.ping();
    
    // Get environment info
    const envInfo = {
      hasRestUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasRestToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasKvUrl: !!process.env.UPSTASH_REDIS_KV_REST_API_URL,
      hasKvToken: !!process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
      vercelEnv: process.env.VERCEL_ENV || 'development',
      nodeEnv: process.env.NODE_ENV || 'development',
    };
    
    return NextResponse.json({
      status: pingResult === 'PONG' ? 'connected' : 'error',
      ping: pingResult,
      environment: envInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis Status Error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
