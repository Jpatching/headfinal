# Production Verification Guide

This document provides step-by-step instructions for verifying that your Next.js 15 application is working correctly in the Vercel production environment, specifically focusing on matchmaking, betting/payments, and leaderboard functionality.

## Prerequisites

1. Your application must be deployed to Vercel
2. You need to have Upstash Redis properly configured in Vercel
3. Node.js installed locally for running verification scripts

## Step 1: Verify Redis Connection

First, confirm that your Redis connection is working properly by checking the KV status endpoint:

```bash
curl https://your-app.vercel.app/api/kv-status
```

Expected response:
```json
{
  "status": "ok",
  "ping": "PONG",
  "dataTest": "passed",
  "timestamp": "2023-xx-xxTxx:xx:xx.xxxZ"
}
```

If this fails, you can also try the more comprehensive database connection check:

```bash
curl https://your-app.vercel.app/api/db-connection-check
```

If these endpoints are not responding, check your Vercel environment variables for Upstash Redis:
- `UPSTASH_REDIS_KV_REST_API_URL`
- `UPSTASH_REDIS_KV_REST_API_TOKEN`

## Step 2: Run the Comprehensive Verification Script

We've created a comprehensive verification script that tests the entire process:

```bash
# Run the verification script, passing your Vercel URL as an argument
node scripts/verify-production-functionality.js your-app.vercel.app
```

This script will:
1. Verify Redis connection
2. Create match requests for two test players
3. Check if a match was created
4. Simulate completing a match with a winner
5. Check if the leaderboard was updated

## Step 3: Manual Testing

If you need to manually test certain aspects of the application:

### Test Matchmaking

1. Open two different browsers or incognito windows
2. In each window, connect with a different wallet
3. Place the same bet amount in both windows
4. Verify that the players are matched together

### Test Betting/Payments

1. After a match is created, verify that the bet amount is deducted from both players' balances
2. Complete the match by selecting a winner
3. Verify that the winner receives both bet amounts (minus any platform fees)

### Test Leaderboard Updates

1. After matches are completed, verify that the leaderboard is updated
2. The winning player should see their rank and winnings increase

## Troubleshooting

### Redis Connection Issues

1. Verify your Upstash Redis credentials in Vercel
2. Check the Redis connection status using the `/api/kv-status` endpoint
3. Look for any connection errors in the Vercel logs

### Matchmaking Issues

1. Check for any errors in the matchmaking API logs
2. Verify that match requests are being created with:
   ```bash
   curl -X POST https://your-app.vercel.app/api/matchmaking -H "Content-Type: application/json" -d '{"playerPublicKey":"test-player","betAmount":100,"action":"create"}'
   ```

### Leaderboard Issues

1. Check that Redis sorted sets are being updated correctly
2. Verify leaderboard API is working:
   ```bash
   curl https://your-app.vercel.app/api/leaderboard
   ```

## Code References

Here are the key files involved in the functionality:

- `lib/redis-client.ts` - Redis connection and key management
- `lib/redis.js` - Redis utilities and leaderboard functions
- `lib/matchmaking-service.ts` - Core matchmaking logic
- `app/api/matchmaking/route.ts` - Matchmaking API endpoint
- `app/api/kv-status/route.ts` - Redis status endpoint
- `scripts/verify-production-functionality.js` - Comprehensive verification script

## Important Notes

1. **Environment Variables**: Make sure all required environment variables are set in Vercel
2. **Redis Keys**: The application uses specific key patterns for matchmaking and leaderboard
3. **Match Expiration**: Match requests automatically expire after a period of time
4. **Cleanup**: The cleanup cron job should be running to clear expired matches

By following this guide, you can verify that your application is fully functional in the Vercel production environment.
