import { NextRequest, NextResponse } from 'next/server';
import { readLeaderboardData } from '@/lib/leaderboard-service';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Changed from 'nodejs' to 'edge' for Vercel compatibility

export async function GET(req: NextRequest) {
  const headers = new Headers();
  headers.append('Content-Type', 'text/event-stream');
  headers.append('Cache-Control', 'no-cache');
  headers.append('Connection', 'keep-alive');

  // Create a new readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode('event: connected\ndata: Connected to leaderboard stream\n\n'));

      // Setup heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode('event: heartbeat\ndata: ping\n\n'));
      }, HEARTBEAT_INTERVAL);

      // Setup interval to fetch and send leaderboard updates
      const dataInterval = setInterval(async () => {
        try {
          // Fetch latest leaderboard data for both winnings and wins
          const winningsData = await readLeaderboardData(10);
          const formattedWinnings = winningsData.map((player, index) => ({
            rank: index + 1,
            playerId: player.publicKey,
            score: player.totalWinnings
          }));

          // Send winnings leaderboard update
          controller.enqueue(
            encoder.encode(
              `event: leaderboard\ndata: ${JSON.stringify({
                type: 'winnings',
                leaders: formattedWinnings,
                timestamp: new Date().toISOString()
              })}\n\n`
            )
          );

          // Format wins data differently
          const winsData = [...winningsData].sort((a, b) => b.wins - a.wins);
          const formattedWins = winsData.map((player, index) => ({
            rank: index + 1,
            playerId: player.publicKey,
            score: player.wins
          }));

          // Send wins leaderboard update
          controller.enqueue(
            encoder.encode(
              `event: leaderboard\ndata: ${JSON.stringify({
                type: 'wins',
                leaders: formattedWins,
                timestamp: new Date().toISOString()
              })}\n\n`
            )
          );
        } catch (error) {
          console.error('Error in leaderboard stream:', error);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch leaderboard data' })}\n\n`)
          );
        }
      }, 5000); // Send updates every 5 seconds

      // Handle client disconnection
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clearInterval(dataInterval);
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
