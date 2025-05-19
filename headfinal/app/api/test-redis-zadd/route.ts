import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { key, score, member } = await req.json();

    // Validate required parameters
    if (!key || score === undefined || !member) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters. Need key, score, and member.' 
      }, { status: 400 });
    }

    // Convert score to number if it's not already
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Score must be a valid number' 
      }, { status: 400 });
    }

    // Initialize Redis with Upstash credentials
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || '',
    });

    // Execute ZADD command - correct Upstash syntax with object format
    // This is the key difference from the error in pre-deploy check
    const result = await redis.zadd(key, { score: numericScore, member });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully added member "${member}" with score ${numericScore} to key "${key}"`,
      result: result
    });
  } catch (error) {
    console.error('Redis ZADD test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
