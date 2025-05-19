import { NextRequest, NextResponse } from 'next/server';
import { redis } from "@/lib/redis-client";

export async function GET(req: NextRequest) {
  try {
    // Get top players from leaderboard
    const leaderboard = await redis?.zrange('leaderboard', 0, 99, {
      withScores: true,
      rev: true
    }) || [];
    
    return NextResponse.json({
      status: 'ok',
      leaderboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
