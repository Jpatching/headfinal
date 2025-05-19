import { redis } from '@/lib/redis-client';

export async function GET() {
  try {
    const pingResult = await redis.ping();
    return Response.json({ 
      status: pingResult === 'PONG' ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
