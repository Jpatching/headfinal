import { kv } from '@vercel/kv';
import { redis, getPlayerKey } from './redis-client';
import { leaderboardKeyPrefix } from './kv-client';

// Define player stats interface
export interface PlayerStats {
  publicKey: string;
  username?: string;
  wins: number;
  losses: number;
  totalWinnings: number;
  totalPlayed: number;
  lastPlayed: number;
}

// Main leaderboard keys
const LEADERBOARD_BY_WINNINGS_KEY = `${leaderboardKeyPrefix}byWinnings`;
const LEADERBOARD_BY_WINS_KEY = `${leaderboardKeyPrefix}byWins`;

// Helper function to use KV if available, fallback to Redis client
async function getClient() {
  try {
    // Try to ping KV to check if it's available
    await kv.ping();
    console.log('Using KV client for leaderboard operations');
    return { useKv: true };
  } catch (error) {
    if (process.env.VERCEL) {
      console.error('KV client failed in Vercel environment:', error);
      console.log('Falling back to Redis client for leaderboard operations');
    } else {
      console.log('Falling back to Redis client for leaderboard operations');
    }
    return { useKv: false };
  }
}

// Update player stats in leaderboard
export async function updatePlayerStats({ 
  publicKey, 
  username, 
  isWinner, 
  winAmount 
}: { 
  publicKey: string; 
  username?: string; 
  isWinner: boolean; 
  winAmount: number;
}): Promise<PlayerStats> {
  try {
    const { useKv } = await getClient();
    
    // Get existing player stats or create new ones
    const playerKey = getPlayerKey(publicKey);
    let playerStats: PlayerStats;
    
    let existingPlayer;
    
    if (useKv) {
      existingPlayer = await kv.get(playerKey);
    } else {
      existingPlayer = await redis.get(playerKey);
    }
    
    if (existingPlayer) {
      playerStats = JSON.parse(existingPlayer as string);
      // Update stats
      if (isWinner) {
        playerStats.wins += 1;
        playerStats.totalWinnings += winAmount;
      } else {
        playerStats.losses += 1;
      }
      playerStats.totalPlayed += 1;
      
      // Log update for monitoring
      console.log(`Updated player stats for ${publicKey.slice(0,6)}...: Wins=${playerStats.wins}, Losses=${playerStats.losses}, Winnings=${playerStats.totalWinnings}`);
    } else {
      // Create new player record
      playerStats = {
        publicKey,
        username: username || publicKey.slice(0, 6) + '...',
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        totalWinnings: isWinner ? winAmount : 0,
        totalPlayed: 1,
        lastPlayed: Date.now()
      };
      console.log(`Created new player record for ${publicKey.slice(0,6)}...`);
    }
    
    // Update username if provided
    if (username) {
      playerStats.username = username;
    }
    
    // Update last played timestamp
    playerStats.lastPlayed = Date.now();
    
    // Save updated player stats
    if (useKv) {
      await kv.set(playerKey, JSON.stringify(playerStats));
      // Update leaderboards (sorted by total winnings and wins)
      await kv.zadd(LEADERBOARD_BY_WINNINGS_KEY, { [publicKey]: playerStats.totalWinnings });
      await kv.zadd(LEADERBOARD_BY_WINS_KEY, { [publicKey]: playerStats.wins });
      console.log(`Saved player stats to KV for ${publicKey.slice(0,6)}...`);
    } else {
      await redis.set(playerKey, JSON.stringify(playerStats));
      // Use the direct format for zadd that works with the Upstash Redis client
      await redis.zadd(LEADERBOARD_BY_WINNINGS_KEY, playerStats.totalWinnings, publicKey);
      await redis.zadd(LEADERBOARD_BY_WINS_KEY, playerStats.wins, publicKey);
      console.log(`Saved player stats to Redis for ${publicKey.slice(0,6)}...`);
    }
    
    return playerStats;
  } catch (error) {
    console.error("Error updating player stats:", error);
    // Return basic player stats as fallback
    return {
      publicKey,
      username: username || publicKey.slice(0, 6) + '...',
      wins: isWinner ? 1 : 0, 
      losses: isWinner ? 0 : 1,
      totalWinnings: isWinner ? winAmount : 0,
      totalPlayed: 1,
      lastPlayed: Date.now()
    };
  }
}

// Get player stats from leaderboard
export async function getPlayerStats(publicKey: string): Promise<PlayerStats | null> {
  try {
    const { useKv } = await getClient();
    const playerKey = getPlayerKey(publicKey);
    
    let playerData;
    if (useKv) {
      playerData = await kv.get(playerKey);
    } else {
      playerData = await redis.get(playerKey);
    }
    
    if (!playerData) return null;
    
    return JSON.parse(playerData as string) as PlayerStats;
  } catch (error) {
    console.error("Error getting player stats:", error);
    return null;
  }
}

// Get player rank in leaderboard
export async function getPlayerRank(publicKey: string): Promise<number | null> {
  try {
    const { useKv } = await getClient();
    
    // Get rank (0-based index), true for reverse order (highest score first)
    let rank;
    if (useKv) {
      rank = await kv.zrevrank(LEADERBOARD_BY_WINNINGS_KEY, publicKey);
    } else {
      rank = await redis.zrank(LEADERBOARD_BY_WINNINGS_KEY, publicKey, true);
    }
    
    // Return 1-based rank or null if player not found
    return rank !== null ? (rank as number) + 1 : null;
  } catch (error) {
    console.error("Error getting player rank:", error);
    return null;
  }
}

// Read leaderboard data
export async function readLeaderboardData(limit: number = 10): Promise<PlayerStats[]> {
  try {
    const { useKv } = await getClient();
    
    // Get top players by score (winnings)
    let topPlayerKeys;
    if (useKv) {
      topPlayerKeys = await kv.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, limit - 1, { rev: true });
    } else {
      topPlayerKeys = await redis.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, limit - 1, true);
    }
    
    if (!topPlayerKeys || topPlayerKeys.length === 0) {
      return []; // Return empty array if no players
    }
    
    // Get player details for each key
    const playerPromises = (topPlayerKeys as string[]).map(async (publicKey) => {
      const playerKey = getPlayerKey(publicKey);
      let playerData;
      
      if (useKv) {
        playerData = await kv.get(playerKey);
      } else {
        playerData = await redis.get(playerKey);
      }
      
      return playerData ? JSON.parse(playerData as string) as PlayerStats : null;
    });
    
    const players = await Promise.all(playerPromises);
    return players.filter((player): player is PlayerStats => player !== null);
  } catch (error) {
    console.error("Error reading leaderboard data:", error);
    return []; // Return empty array on error
  }
}

// Get total player count in leaderboard
export async function getTotalPlayerCount(): Promise<number> {
  try {
    const { useKv } = await getClient();
    
    if (useKv) {
      return (await kv.zcard(LEADERBOARD_BY_WINNINGS_KEY)) || 0;
    } else {
      return await redis.zcard(LEADERBOARD_BY_WINNINGS_KEY);
    }
  } catch (error) {
    console.error("Error getting total player count:", error);
    return 0;
  }
}
