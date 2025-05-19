import { NextRequest, NextResponse } from 'next/server';
import { redis } from "@/lib/redis-client";

export async function GET(req: NextRequest) {
  try {
    // Simple ping test
    const ping = await redis.ping();
    
    const isConnected = ping === "PONG";
    
    return NextResponse.json({
      status: isConnected ? 'ok' : 'error',
      services: {
        redis: isConnected ? 'connected' : 'disconnected'
      },
      environment: process.env.VERCEL_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
