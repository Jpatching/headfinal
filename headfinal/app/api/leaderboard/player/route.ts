import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const rank = await redis?.zrevrank('leaderboard', userId);
    const score = await redis?.zscore('leaderboard', userId);
    
    return NextResponse.json({
      status: 'ok',
      userId,
      rank: rank !== null ? rank + 1 : null,
      score: score || 0
    });
  } catch (error) {
    console.error('Player Leaderboard Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
