import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Basic check if we're running in a Vercel environment
    const isVercel = process.env.VERCEL === '1';
    
    return NextResponse.json({ 
      status: 'ok', 
      environment: isVercel ? 'vercel' : 'other',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Storage Status Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
