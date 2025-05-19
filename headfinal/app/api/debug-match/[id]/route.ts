import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

// Debug endpoint to verify match details
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {  
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: "Match ID is required" },
        { status: 400 }
      );
    }

    // Check if it already has the prefix
    const matchKey = id.startsWith('match:') ? id : `match:${id}`;
    const rawData = await redis.get(matchKey);
    
    if (!rawData) {
      return NextResponse.json(
        { status: 'error', message: "Match not found in Redis" },
        { status: 404 }
      );
    }

    // Log the raw match data for debugging
    console.log("Raw match data:", rawData);
    
    // Parse and verify the match data
    let parsedData;
    try {
      parsedData = JSON.parse(rawData as string);
    } catch (err) {
      return NextResponse.json(
        { status: 'error', message: "Failed to parse match data", raw: rawData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      match: parsedData,
      rawString: rawData
    });
  } catch (error) {
    console.error("Error fetching debug match info:", error);
    return NextResponse.json(
      { status: 'error', message: "Failed to retrieve match data", details: error.message },
      { status: 500 }
    );
  }
}
