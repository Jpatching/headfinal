import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ status: 'error', message: 'Key parameter is required' }, { status: 400 });
    }
    
    const value = await kv.get(key);
    return NextResponse.json({ status: 'ok', key, value });
  } catch (error) {
    console.error('Redis Inspect Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
