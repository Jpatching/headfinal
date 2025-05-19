// Cleanup script for expired match requests
// This script should be run periodically via a cron job or similar

import { processExpiredRequests } from '../lib/matchmaking-service';
import { redis } from '../lib/redis-client';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries
const DEFAULT_EXPIRY_TIME_MS = 2 * 60 * 1000; // 2 minutes

// Helper to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  // Only release if it's our lock (script might have run long and lock was taken by another process)
  if (currentValue === lockValue) {
    await redis.del(lockKey);
    return true;
  }
  
  return false;
}

async function cleanupExpiredRequests(attempt = 1) {
  let lockValue = null;
  
  try {
    console.log(`[${new Date().toISOString()}] Starting cleanup of expired match requests (attempt ${attempt}/${MAX_RETRIES})...`);
    
    // Try to acquire lock
    lockValue = await acquireLock();
    if (!lockValue) {
      console.log('Another cleanup process is already running. Skipping this run.');
      return;
    }
    
    // Get expiry time from environment variable or use default
    const expiryTimeMs = parseInt(process.env.MATCHMAKING_EXPIRY_TIME_MS || DEFAULT_EXPIRY_TIME_MS, 10);
    
    // Process expired requests
    const count = await processExpiredRequests(expiryTimeMs);
    
    // Record last cleanup time and count
    await redis.set('matchmaking:last_cleanup', JSON.stringify({
      timestamp: Date.now(),
      processed: count
    }));
    
    console.log(`[${new Date().toISOString()}] Cleanup complete. Processed ${count} expired match requests.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during cleanup:`, error);
    
    // If we haven't reached max retries, try again after delay
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS/1000} seconds...`);
      await wait(RETRY_DELAY_MS);
      return cleanupExpiredRequests(attempt + 1);
    }
    
    // Record failure
    await redis.set('matchmaking:last_cleanup_error', JSON.stringify({
      timestamp: Date.now(),
      error: error.message
    }));
    
    throw error; // Re-throw for process exit code
  } finally {
    // Release lock if we acquired it
    if (lockValue) {
      await releaseLock(lockValue);
      console.log('Cleanup lock released.');
    }
    
    // Ensure Redis connection is closed
    await redis.quit();
  }
}

// Run the cleanup and handle process exit
cleanupExpiredRequests()
  .then(() => {
    console.log('Cleanup script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error in cleanup script:', error);
    process.exit(1);
  });
