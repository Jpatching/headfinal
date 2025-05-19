import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const queueCount = await kv.get('matchmaking:queue_count') || 0;
    const activeMatches = await kv.get('matchmaking:active_matches') || 0;
    
    return NextResponse.json({
      status: 'ok',
      queueCount,
      activeMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Matchmaking Status Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
