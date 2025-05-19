import { type NextRequest, NextResponse } from "next/server"

// Define the correct type for route params
export interface RouteParams<T = Record<string, string>> {
  params: T
}

// Type for game route params
export interface GameRouteParams extends RouteParams {
  params: {
    id: string
  }
}

// Type for match route params
export interface MatchRouteParams extends RouteParams {
  params: {
    matchId: string
  }
}

// Helper for standard error responses
export function errorResponse(message: string, status = 500) {
  console.error(`API Error: ${message}`);
  return NextResponse.json({ 
    status: 'error', 
    message 
  }, { status });
}

// Helper for standard success responses
export function successResponse(data: any) {
  return NextResponse.json({
    status: 'success',
    ...data
  });
}
