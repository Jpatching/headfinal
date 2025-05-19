import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const type = searchParams.get('type') || 'winnings';
    
    // Get top players from leaderboard
    const players = await getLeaderboard(type, limit);
    
    if (!playerData || playerData.length === 0) {
      return NextResponse.json({
        status: 'ok',
        leaderboard: [],
        totalPlayers: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Format the response based on the requested type
    let formattedData;
    if (type === 'wins') {
      // Sort by wins for the wins leaderboard
      formattedData = [...playerData]
        .sort((a, b) => b.wins - a.wins)
        .map((player, index) => ({
          rank: index + 1,
          playerId: player.publicKey,
          username: player.username,
          score: player.wins
        }));
    } else {
      // Default to sorting by winnings
      formattedData = playerData.map((player, index) => ({
        rank: index + 1,
        playerId: player.publicKey,
        username: player.username,
        score: player.totalWinnings
      }));
    }
    
    // Get total player count for pagination
    const totalPlayers = await getTotalPlayerCount();
    
    return NextResponse.json({
      status: 'ok',
      leaderboard: formattedData,
      totalPlayers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
