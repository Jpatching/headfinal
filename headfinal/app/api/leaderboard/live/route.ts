// SSE endpoint for real-time leaderboard updates
import { NextRequest } from 'next/server';
import { redis } from "@/lib/redis-client";

// Constants
const LEADERBOARD_BY_WINNINGS_KEY = 'leaderboard:byWinnings';
const LEADERBOARD_BY_WINS_KEY = 'leaderboard:byWins';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Set headers for SSE
  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Function to send leaderboard data
  const sendLeaderboardUpdate = async () => {
    try {
      // Get top players by winnings
      const byWinnings = await redis.zrange(LEADERBOARD_BY_WINNINGS_KEY, 0, 19, {
        rev: true,
        withScores: true
      }) as (string | number)[];

      // Get top players by wins
      const byWins = await redis.zrange(LEADERBOARD_BY_WINS_KEY, 0, 19, {
        rev: true,
        withScores: true
      }) as (string | number)[];

      // Format data for client
      const data = {
        byWinnings: formatLeaderboardData(byWinnings),
        byWins: formatLeaderboardData(byWins),
        timestamp: new Date().toISOString()
      };

      // Send event to client
      const event = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(event));
    } catch (error) {
      console.error('Error sending leaderboard update:', error);
      const errorEvent = `data: ${JSON.stringify({ error: 'Failed to get leaderboard data' })}\n\n`;
      await writer.write(encoder.encode(errorEvent));
    }
  };

  // Send initial data
  await sendLeaderboardUpdate();

  // Keep the connection alive and send updates every 5 seconds
  const intervalId = setInterval(async () => {
    await sendLeaderboardUpdate();
  }, 5000);

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    clearInterval(intervalId);
    writer.close();
  });

  return response;
}

// Helper to format leaderboard data
function formatLeaderboardData(data: (string | number)[]): Array<{rank: number, playerId: string, score: number}> {
  const result = [];
  for (let i = 0; i < data.length; i += 2) {
    result.push({
      rank: i/2 + 1,
      playerId: data[i] as string,
      score: data[i + 1] as number
    });
  }
  return result;
}
