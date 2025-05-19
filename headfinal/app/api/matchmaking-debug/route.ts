import { NextRequest, NextResponse } from 'next/server';

// Function to make requests to Upstash Redis REST API
async function upstashRequest(command: string, args: string[] = []) {
  const UPSTASH_URL = process.env.UPSTASH_REDIS_KV_REST_API_URL || "https://intimate-cowbird-32452.upstash.io";
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || "AX7EAAIjcDFmOTIyN2UzNDAwM2I0MjBhOWU0NjMwODJjMTEzZmNhZXAxMA";
  
  const response = await fetch(`${UPSTASH_URL}/${command}/${args.join('/')}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Upstash Redis REST API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.result;
}

export async function GET(req: NextRequest) {
  try {
    // Use Upstash REST API instead of kv
    const matchmakingKeys = await upstashRequest('keys', ['matchmaking:*']);
    
    const [queueCount, activeMatches, lastMatched] = await Promise.all([
      upstashRequest('get', ['matchmaking:queue_count']).then(result => result || 0),
      upstashRequest('get', ['matchmaking:active_matches']).then(result => result || 0),
      upstashRequest('get', ['matchmaking:last_matched'])
    ]);
    
    const debugData = {
      queueCount,
      activeMatches,
      lastMatched,
      keys: matchmakingKeys
    };
    
    return NextResponse.json({
      status: 'ok',
      debugData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Matchmaking Debug Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
