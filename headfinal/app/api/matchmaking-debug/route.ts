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
    
    // Get basic stats
    const [queueCount, activeMatches, lastMatched] = await Promise.all([
      upstashRequest('get', ['matchmaking:queue_count']).then(result => result || 0),
      upstashRequest('get', ['matchmaking:active_matches']).then(result => result || 0),
      upstashRequest('get', ['matchmaking:last_matched'])
    ]);
    
    // Get pending match requests
    const pendingRequestsKeys = await upstashRequest('keys', ['match-request:*']);
    const pendingRequests = [];
    
    if (pendingRequestsKeys && pendingRequestsKeys.length > 0) {
      // Get the first 10 request details (to avoid too much data)
      const sampleKeys = pendingRequestsKeys.slice(0, 10);
      for (const key of sampleKeys) {
        const requestData = await upstashRequest('get', [key]);
        if (requestData) {
          try {
            const parsed = typeof requestData === 'string' 
              ? JSON.parse(requestData) 
              : requestData;
            pendingRequests.push(parsed);
          } catch (e) {
            pendingRequests.push({ id: key, error: 'Failed to parse' });
          }
        }
      }
    }
    
    // Get active matches details
    const matchesKeys = await upstashRequest('keys', ['match:*']);
    const recentMatches = [];
    
    if (matchesKeys && matchesKeys.length > 0) {
      // Get the first 5 matches (recent ones)
      const sampleKeys = matchesKeys.slice(0, 5);
      for (const key of sampleKeys) {
        const matchData = await upstashRequest('get', [key]);
        if (matchData) {
          try {
            const parsed = typeof matchData === 'string' 
              ? JSON.parse(matchData) 
              : matchData;
            recentMatches.push(parsed);
          } catch (e) {
            recentMatches.push({ id: key, error: 'Failed to parse' });
          }
        }
      }
    }
    
    // Get stats by bet amount
    const pendingByAmountKeys = await upstashRequest('keys', ['pending-matches-by-amount:*']);
    const pendingByAmount = {};
    
    if (pendingByAmountKeys && pendingByAmountKeys.length > 0) {
      for (const key of pendingByAmountKeys) {
        const members = await upstashRequest('zrange', [key, '0', '-1']);
        const amount = key.split(':')[1];
        pendingByAmount[amount] = members ? members.length : 0;
      }
    }
    
    const debugData = {
      queueCount,
      activeMatches,
      lastMatched,
      pendingRequestsCount: pendingRequestsKeys ? pendingRequestsKeys.length : 0,
      matchesCount: matchesKeys ? matchesKeys.length : 0,
      pendingByAmount,
      pendingRequests,
      recentMatches,
      allKeys: matchmakingKeys
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
