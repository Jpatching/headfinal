import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const keys = await kv.keys('*');
    const systemStats = await kv.get('system:stats') || {};
    
    return NextResponse.json({
      status: 'ok',
      keyCount: keys.length,
      keys: keys.slice(0, 100), // Limit to first 100 keys
      systemStats
    });
  } catch (error) {
    console.error('Redis Debug Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
