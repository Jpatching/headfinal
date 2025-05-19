import { NextRequest, NextResponse } from 'next/server';
import { getMatch, getMatchStatus } from '@/lib/matchmaking-service';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Get match or request ID from query params
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const requestId = searchParams.get('requestId');
  
  if (!matchId && !requestId) {
    return NextResponse.json(
      { error: "Missing matchId or requestId parameter" },
      { status: 400 }
    );
  }

  const headers = new Headers();
  headers.append('Content-Type', 'text/event-stream');
  headers.append('Cache-Control', 'no-cache');
  headers.append('Connection', 'keep-alive');

  // Create a new readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode('event: connected\ndata: Connected to matchmaking stream\n\n'));

      // Setup heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode('event: heartbeat\ndata: ping\n\n'));
      }, HEARTBEAT_INTERVAL);

      // Set up interval to check match/request status
      const statusInterval = setInterval(async () => {
        try {
          if (matchId) {
            // Check match status
            const match = await getMatch(matchId);
            
            if (match) {
              controller.enqueue(
                encoder.encode(
                  `event: match\ndata: ${JSON.stringify({
                    id: match.id,
                    status: match.status,
                    player1: match.player1PublicKey,
                    player2: match.player2PublicKey,
                    betAmount: match.betAmount,
                    winnerId: match.winnerId,
                    timestamp: new Date().toISOString()
                  })}\n\n`
                )
              );
              
              // If match is completed or cancelled, close the stream
              if (match.status === 'completed' || match.status === 'cancelled') {
                setTimeout(() => {
                  clearInterval(heartbeatInterval);
                  clearInterval(statusInterval);
                  controller.close();
                }, 3000); // Give client time to process the final update
              }
            } else {
              // Match not found
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Match not found' })}\n\n`)
              );
              clearInterval(heartbeatInterval);
              clearInterval(statusInterval);
              controller.close();
            }
          } else if (requestId) {
            // Check request status
            const status = await getMatchStatus(requestId);
            
            if (status) {
              controller.enqueue(
                encoder.encode(
                  `event: request\ndata: ${JSON.stringify({
                    id: requestId,
                    status: status.status,
                    matchId: status.matchId,
                    timestamp: new Date().toISOString()
                  })}\n\n`
                )
              );
              
              // If request is matched, expired, or cancelled, close the stream after sending one more update
              if (status.status !== 'pending') {
                setTimeout(() => {
                  clearInterval(heartbeatInterval);
                  clearInterval(statusInterval);
                  controller.close();
                }, 3000); // Give client time to process the final update
              }
            } else {
              // Request not found
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Request not found' })}\n\n`)
              );
              clearInterval(heartbeatInterval);
              clearInterval(statusInterval);
              controller.close();
            }
          }
        } catch (error) {
          console.error('Error in matchmaking stream:', error);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch matchmaking data' })}\n\n`)
          );
        }
      }, 2000); // Check status every 2 seconds

      // Handle client disconnection
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clearInterval(statusInterval);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers
  });
}

// Text encoder for SSE messages
const encoder = new TextEncoder();
