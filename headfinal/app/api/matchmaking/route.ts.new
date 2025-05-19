import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { 
  createMatchRequest, 
  findMatch, 
  cancelMatchRequest,
  getMatchStatus 
} from '@/lib/matchmaking-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.playerPublicKey) {
      return NextResponse.json(
        { error: "Missing player public key" },
        { status: 400 }
      );
    }
    
    // Required fields: playerPublicKey and betAmount
    const { playerPublicKey, betAmount, action } = body;
    
    // Handle different actions
    switch (action) {
      case 'find':
        return await handleFindMatch(playerPublicKey, betAmount);
      
      case 'cancel':
        return await handleCancelRequest(body.requestId);
      
      case 'check':
        return await handleCheckStatus(body.requestId);
      
      default:
        // Default is to create a new match request
        return await handleCreateRequest(playerPublicKey, betAmount);
    }
  } catch (error) {
    console.error("Matchmaking Error:", error);
    return NextResponse.json(
      { error: "Failed to process matchmaking request", details: error.message },
      { status: 500 }
    );
  }
}

// Handle creating a new match request
async function handleCreateRequest(playerPublicKey: string, betAmount: number) {
  if (!betAmount || betAmount <= 0) {
    return NextResponse.json(
      { error: "Invalid bet amount" },
      { status: 400 }
    );
  }
  
  try {
    // Generate a unique ID for this request
    const requestId = uuidv4();
    
    // Create the match request
    const request = await createMatchRequest({
      id: requestId,
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending"
    });
    
    // Try to find a match immediately
    const match = await findMatch(request);
    
    if (match) {
      // Return match details if found
      return NextResponse.json({
        status: 'matched',
        matchId: match.id,
        requestId,
        player1: match.player1PublicKey,
        player2: match.player2PublicKey,
        betAmount: match.betAmount
      });
    } else {
      // Otherwise return the pending request
      return NextResponse.json({
        status: 'pending',
        requestId,
        message: 'Added to matchmaking queue',
        estimatedWaitTime: '30 seconds'
      });
    }
  } catch (error) {
    console.error("Error creating match request:", error);
    return NextResponse.json(
      { error: "Failed to create match request" },
      { status: 500 }
    );
  }
}

// Handle finding a match for existing request
async function handleFindMatch(playerPublicKey: string, betAmount: number) {
  try {
    // Check for existing matches
    const match = await findMatch({
      id: uuidv4(), // Temporary ID
      playerPublicKey,
      betAmount,
      timestamp: Date.now(),
      status: "pending"
    });
    
    if (match) {
      return NextResponse.json({
        status: 'matched',
        matchId: match.id,
        player1: match.player1PublicKey,
        player2: match.player2PublicKey,
        betAmount: match.betAmount
      });
    } else {
      return NextResponse.json({
        status: 'no_match',
        message: 'No matching opponents found'
      });
    }
  } catch (error) {
    console.error("Error finding match:", error);
    return NextResponse.json(
      { error: "Failed to find a match" },
      { status: 500 }
    );
  }
}

// Handle cancelling a match request
async function handleCancelRequest(requestId: string) {
  if (!requestId) {
    return NextResponse.json(
      { error: "Missing request ID" },
      { status: 400 }
    );
  }
  
  try {
    const result = await cancelMatchRequest(requestId);
    
    if (result) {
      return NextResponse.json({
        status: 'cancelled',
        requestId,
        message: 'Match request cancelled successfully'
      });
    } else {
      return NextResponse.json(
        { error: "Match request not found or already processed" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error cancelling match request:", error);
    return NextResponse.json(
      { error: "Failed to cancel match request" },
      { status: 500 }
    );
  }
}

// Handle checking the status of a match request
async function handleCheckStatus(requestId: string) {
  if (!requestId) {
    return NextResponse.json(
      { error: "Missing request ID" },
      { status: 400 }
    );
  }
  
  try {
    const status = await getMatchStatus(requestId);
    
    if (status) {
      return NextResponse.json({
        status: status.status,
        requestId,
        matchId: status.matchId,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "Match request not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error checking match status:", error);
    return NextResponse.json(
      { error: "Failed to check match status" },
      { status: 500 }
    );
  }
}
