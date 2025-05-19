import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const ping = await kv.ping();
    return NextResponse.json({ status: 'ok', ping });
  } catch (error) {
    console.error('Redis Test Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
