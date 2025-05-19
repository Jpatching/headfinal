import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

export async function GET(
  request: NextRequest, 
  { params }: { params: { matchId: string } }
) {  
  try {
    const { matchId } = params;

    if (!matchId) {
      return NextResponse.json(
        { status: 'error', message: "Match ID is required" },
        { status: 400 }
      );
    }    const matchData = await redis.get(`match:${matchId}`);
    
    if (!matchData) {
      return NextResponse.json(
        { status: 'error', message: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      match: JSON.parse(matchData as string)
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { status: 'error', message: "Failed to fetch match data" },
      { status: 500 }
    );
  }
}
