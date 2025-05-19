import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function GET(req: NextRequest) {
  try {
    // Simple ping test to verify connection
    const ping = await redis.ping();
    
    // Try a simple operation to verify data operations
    const testKey = "kv-status-test";
    const testValue = "connected-" + Date.now();
    
    // Set a value
    await redis.set(testKey, testValue);
    
    // Get it back
    const retrievedValue = await redis.get(testKey);
    
    // Delete it (cleanup)
    await redis.del(testKey);
    
    return NextResponse.json({
      status: ping === 'PONG' && retrievedValue === testValue ? 'ok' : 'error',
      ping,
      dataTest: retrievedValue === testValue ? 'passed' : 'failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis Status Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
