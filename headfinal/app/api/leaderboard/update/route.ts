import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

// Consistent key names across the application
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, score, wins } = data;
    
    if (!userId || typeof score !== 'number') {
      return NextResponse.json(
        { status: 'error', message: 'Both userId and score are required' },
        { status: 400 }
      );
    }
    
    // Update both leaderboards with consistent format
    await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, { score, member: userId });
    
    // Also update wins leaderboard if provided
    if (typeof wins === 'number') {
      await redis.zadd(LEADERBOARD_BY_WINS_KEY, { score: wins, member: userId });
    }
    
    return NextResponse.json({
      status: 'ok',
      message: 'Leaderboard updated successfully',
      userId,
      score,
      wins: wins || null
    });
  } catch (error) {
    console.error('Leaderboard Update Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { status: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}
