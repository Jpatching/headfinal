import { NextRequest, NextResponse } from 'next/server';
import { redis, matchPrefix } from '@/lib/redis-client';
import { updateLeaderboard } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for completing a match with a winner for testing purposes
 * This should only be used in development/test environments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;
    const body = await request.json();
    const { winnerId } = body;
    
    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }
    
    if (!winnerId) {
      return NextResponse.json(
        { error: "Winner ID is required" },
        { status: 400 }
      );
    }
    
    // Get the match data
    const matchKey = `${matchPrefix}${matchId}`;
    const matchData = await redis.get(matchKey);
    
    if (!matchData) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }
    
    const match = JSON.parse(matchData);
    
    // Validate that the winner is a player in the match
    if (winnerId !== match.player1PublicKey && winnerId !== match.player2PublicKey) {
      return NextResponse.json(
        { error: "Invalid winner ID. Must be a player in the match." },
        { status: 400 }
      );
    }
    
    // Update match status
    match.status = 'completed';
    match.winnerId = winnerId;
    match.completedAt = Date.now();
    
    // Save updated match
    await redis.set(matchKey, JSON.stringify(match));
    
    // Calculate winnings (betting amount from both players)
    const winnings = match.betAmount * 2;
    
    // Update leaderboard
    await updateLeaderboard(winnerId, winnings);
    
    // Return updated match
    return NextResponse.json({
      success: true,
      match,
      winnings
    });
  } catch (error) {
    console.error("Complete match error:", error);
    return NextResponse.json(
      { error: "Failed to complete match", details: error.message },
      { status: 500 }
    );
  }
}
