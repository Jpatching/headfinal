import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

/**
 * API endpoint to get game/match details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: "Game ID is required" },
        { status: 400 }
      );
    }

    const gameData = await redis.get(`game:${id}`);
    
    if (!gameData) {
      return NextResponse.json(
        { status: 'error', message: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      id,
      game: gameData
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { status: 'error', message: "Failed to fetch game data" },
      { status: 500 }
    );
  }
}
