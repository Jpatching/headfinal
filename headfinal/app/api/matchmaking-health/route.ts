import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

/**
 * Health check endpoint for matchmaking system
 * Returns status information about the matchmaking service and Redis connection
 */
export async function GET() {
  try {
    // Check Redis connection
    const pingResult = await redis.ping();
    const isRedisConnected = pingResult === 'PONG';
    
    // Get matchmaking stats
    const [
      queueCount, 
      activeMatches, 
      lastMatched,
      lastCleanupData
    ] = await Promise.all([
      redis.get('matchmaking:queue_count').then(val => val || '0'),
      redis.get('matchmaking:active_matches').then(val => val || '0'),
      redis.get('matchmaking:last_matched'),
      redis.get('matchmaking:last_cleanup')
    ]);
    
    // Parse last cleanup data
    let lastCleanup = null;
    try {
      if (lastCleanupData) {
        lastCleanup = JSON.parse(lastCleanupData);
      }
    } catch (e) {
      console.error('Error parsing lastCleanupData:', e);
    }
    
    // Check if cleanup has run recently (within last hour)
    const now = Date.now();
    const lastCleanupTime = lastCleanup?.timestamp || 0;
    const cleanupIsRecent = (now - lastCleanupTime) < (60 * 60 * 1000); // 1 hour
    
    // Overall system status
    const isHealthy = isRedisConnected && cleanupIsRecent;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      redis: isRedisConnected ? 'connected' : 'disconnected',
      matchmaking: {
        queueCount: parseInt(queueCount, 10),
        activeMatches: parseInt(activeMatches, 10),
        lastMatched: lastMatched || null,
        cleanup: {
          lastRun: lastCleanup ? new Date(lastCleanup.timestamp).toISOString() : null,
          processed: lastCleanup?.processed || 0,
          isRecent: cleanupIsRecent
        }
      },
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 200, // Still return 200 even if degraded, to avoid false alarms
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
