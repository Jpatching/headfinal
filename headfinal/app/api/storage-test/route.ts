import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Simple test to check if we can access storage
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Storage Test Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
