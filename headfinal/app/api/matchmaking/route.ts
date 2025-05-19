import { NextRequest, NextResponse } from 'next/server';
import { redis } from "@/lib/redis-client";

/**
 * API endpoint for matchmaking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.userId) {
      return handleMatchmakingRequest(body);
    } else {
      return NextResponse.json(
        { error: "Invalid request. Missing required fields." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Matchmaking Error:", error);
    return NextResponse.json(
      { error: "Failed to process matchmaking request" },
      { status: 500 }
    );
  }
}

// Handle regular matchmaking requests
async function handleMatchmakingRequest(data: any) {
  const userId = data.userId;
  
  // Add to matchmaking queue logic would go here
  await redis?.incr('matchmaking:queue_count');
  
  return NextResponse.json({
    status: 'ok',
    message: 'Added to matchmaking queue',
    userId
  });
}

export async function GET(req: NextRequest) {
  try {
    const stats = {
      inQueue: await redis?.get('matchmaking:queue_count') || 0,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({ status: 'ok', stats });
  } catch (error) {
    console.error('Matchmaking Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
