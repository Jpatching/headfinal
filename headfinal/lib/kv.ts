import { kv } from '@vercel/kv';

// Types
export interface LeaderboardPlayer {
  id: string;
  publicKey: string;
  username?: string;
  wins: number;
  losses: number;
  totalWinnings: number;
  totalPlayed: number;
  lastPlayed: number;
  avatarUrl?: string;
}

// Leaderboard functions
export async function getTopPlayers(limit = 10): Promise<LeaderboardPlayer[]> {
  try {
    // Get players from the sorted set by total winnings
    const players = await kv.zrange<string[]>('leaderboard:by-winnings', 0, limit - 1, {
      rev: true, // Highest first
    });
    
    if (!players || players.length === 0) {
      return [];
    }
    
    // Get the full player data for each entry
    const playerData = await Promise.all(
      players.map(publicKey => kv.get<LeaderboardPlayer>(`player:${publicKey}`))
    );
    
    // Filter out any null results and sort by winnings
    return playerData
      .filter(Boolean) as LeaderboardPlayer[]
      .sort((a, b) => b.totalWinnings - a.totalWinnings);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

// Update player stats
export async function updatePlayerStats({
  publicKey,
  username,
  isWinner,
  winAmount,
}: {
  publicKey: string;
  username?: string;
  isWinner: boolean;
  winAmount: number;
}): Promise<LeaderboardPlayer> {
  try {
    // Get existing player or create new one
    const existingPlayer = await kv.get<LeaderboardPlayer>(`player:${publicKey}`);
    
    const player: LeaderboardPlayer = existingPlayer || {
      id: publicKey,
      publicKey,
      wins: 0,
      losses: 0,
      totalWinnings: 0,
      totalPlayed: 0,
      lastPlayed: Date.now(),
    };
    
    // Update stats
    player.totalPlayed++;
    player.lastPlayed = Date.now();
    
    if (isWinner) {
      player.wins++;
      player.totalWinnings += winAmount;
    } else {
      player.losses++;
    }
    
    // Update username if provided
    if (username) {
      player.username = username;
    }
    
    // Save updated player data
    await kv.set(`player:${publicKey}`, player);
    
    // Update sorted sets for quick access
    await kv.zadd('leaderboard:by-winnings', { [publicKey]: player.totalWinnings });
    await kv.zadd('leaderboard:by-wins', { [publicKey]: player.wins });
    
    return player;
  } catch (error) {
    console.error('Error updating player stats:', error);
    throw error;
  }
}

// Get player stats
export async function getPlayerStats(publicKey: string): Promise<LeaderboardPlayer | null> {
  try {
    const player = await kv.get<LeaderboardPlayer>(`player:${publicKey}`);
    return player;
  } catch (error) {
    console.error('Error getting player stats:', error);
    return null;
  }
}
