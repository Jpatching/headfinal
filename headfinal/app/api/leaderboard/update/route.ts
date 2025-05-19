import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, score } = data;
    
    if (!userId || typeof score !== 'number') {
      return NextResponse.json(
        { status: 'error', message: 'Both userId and score are required' },
        { status: 400 }
      );
    }
    
    await redis?.zadd('leaderboard', { [userId]: score });
    
    return NextResponse.json({
      status: 'ok',
      message: 'Leaderboard updated successfully',
      userId,
      score
    });
  } catch (error) {
    console.error('Leaderboard Update Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
