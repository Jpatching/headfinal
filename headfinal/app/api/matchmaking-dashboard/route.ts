import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Redis client
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || '',
    });

    // Get basic matchmaking stats
    const [
      queueCount, 
      activeMatches, 
      lastMatched,
      lastCleanupData,
      pingResult
    ] = await Promise.all([
      redis.get('matchmaking:queue_count').then(val => val || 0),
      redis.get('matchmaking:active_matches').then(val => val || 0),
      redis.get('matchmaking:last_matched'),
      redis.get('matchmaking:last_cleanup'),
      redis.ping().catch(() => 'FAILED')
    ]);

    // Test ZADD functionality
    let zaddStatus = 'untested';
    const testKey = `test:zadd:${Date.now()}`;
    try {
      const timestamp = Date.now();
      const zaddResult = await redis.zadd(testKey, { score: timestamp, member: 'test-member' });
      if (zaddResult) {
        zaddStatus = 'working';
        // Clean up test key
        await redis.del(testKey);
      } else {
        zaddStatus = 'failed';
      }
    } catch (error) {
      zaddStatus = `error: ${error.message}`;
    }

    // Count active match requests
    const matchRequestKeys = await redis.keys('matchRequest:*');
    const matchKeys = await redis.keys('match:*');
    const pendingMatchesKeys = await redis.keys('pendingMatches:amount:*');

    // Get details of last 5 active matches
    const recentMatches = [];
    if (matchKeys && matchKeys.length > 0) {
      const sampleKeys = matchKeys.slice(0, 5);
      for (const key of sampleKeys) {
        const matchData = await redis.get(key);
        if (matchData) {
          recentMatches.push(matchData);
        }
      }
    }

    // Get pending matches by bet amount
    const pendingByAmount = {};
    if (pendingMatchesKeys && pendingMatchesKeys.length > 0) {
      for (const key of pendingMatchesKeys) {
        const amount = key.replace('pendingMatches:amount:', '');
        const count = await redis.zcard(key);
        pendingByAmount[amount] = count;
      }
    }

    return NextResponse.json({
      status: pingResult === 'PONG' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      redisConnection: pingResult === 'PONG' ? 'connected' : 'failed',
      zaddFunctionality: zaddStatus,
      stats: {
        queueCount,
        activeMatches,
        lastMatched,
        matchRequestsCount: matchRequestKeys?.length || 0,
        matchesCount: matchKeys?.length || 0,
        pendingByAmount
      },
      recentMatches,
      lastCleanup: lastCleanupData ? JSON.parse(lastCleanupData) : null
    });
  } catch (error) {
    console.error('Matchmaking Dashboard Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
