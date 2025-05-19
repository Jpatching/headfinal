import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await kv.set('system:initialized', true);
    await kv.set('system:startup_time', new Date().toISOString());
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Redis initialized successfully' 
    });
  } catch (error) {
    console.error('Redis Init Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
