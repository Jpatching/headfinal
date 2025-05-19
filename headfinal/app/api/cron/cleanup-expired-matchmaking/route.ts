import { NextResponse } from 'next/server';
import { processExpiredRequests } from '@/lib/matchmaking-service';
import { redis } from '@/lib/redis-client';

// Set a lock to prevent multiple cleanups running simultaneously
async function acquireLock() {
  const lockKey = 'matchmaking:cleanup_lock';
  const lockValue = Date.now().toString();
  const lockExpirySeconds = 60; // Lock expires after 60 seconds (failsafe)
  
  // Try to set the lock with NX (only if it doesn't exist)
  const result = await redis.set(lockKey, lockValue, 'EX', lockExpirySeconds, 'NX');
  
  return result === 'OK' ? lockValue : null;
}

// Release the lock when done
async function releaseLock(lockValue) {
  const lockKey = 'matchmaking:cleanup_lock';
  
  // Get the current lock value
  const currentValue = await redis.get(lockKey);
  
  // Only release if it's our lock
  if (currentValue === lockValue) {
    await redis.del(lockKey);
    return true;
  }
  
  return false;
}

export async function GET() {
  let lockValue = null;
  
  try {
    console.log('[Cron] Starting cleanup of expired match requests...');
    
    // Try to acquire lock
    lockValue = await acquireLock();
    if (!lockValue) {
      console.log('[Cron] Another cleanup process is already running. Skipping this run.');
      return NextResponse.json({
        success: false,
        message: 'Another cleanup process is already running'
      });
    }
    
    // Get expiry time from environment variable or use default (2 minutes)
    const expiryTimeMs = parseInt(process.env.MATCHMAKING_EXPIRY_TIME_MS || 2 * 60 * 1000, 10);
    
    // Process expired requests
    const count = await processExpiredRequests(expiryTimeMs);
    
    // Record last cleanup time and count
    await redis.set('matchmaking:last_cleanup', JSON.stringify({
      timestamp: Date.now(),
      processed: count
    }));
    
    console.log(`[Cron] Cleanup complete. Processed ${count} expired match requests.`);
    
    return NextResponse.json({
      success: true,
      processed: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error during cleanup:', error);
    
    // Record failure
    await redis.set('matchmaking:last_cleanup_error', JSON.stringify({
      timestamp: Date.now(),
      error: error.message
    }));
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    // Release lock if we acquired it
    if (lockValue) {
      await releaseLock(lockValue);
      console.log('[Cron] Cleanup lock released.');
    }
  }
}
