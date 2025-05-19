import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function GET(req: NextRequest) {
  try {
    // Simple ping test to verify connection
    const ping = await redis.ping();
    
    return NextResponse.json({
      status: ping === 'PONG' ? 'ok' : 'error',
      ping,
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
