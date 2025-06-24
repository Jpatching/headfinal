# Finding Your Railway Database URL

Since Railway's UI has changed, here are ways to find your database connection string:

## Method 1: Railway CLI
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link to your project: `railway link`
4. Get the DATABASE_URL: `railway variables`

## Method 2: Check Railway's Networking Tab
In your PostgreSQL service, look for:
- **TCP Proxy**: `metro.proxy.rlwy.net:32906` (for external connections)
- **Private Networking**: `postgres.railway.internal:5432` (for internal connections)

## Method 3: Try These Connection Strings

For local development, try these in order:

1. **TCP Proxy (standard)**:
   ```
   postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@metro.proxy.rlwy.net:32906/railway
   ```

2. **TCP Proxy with SSL**:
   ```
   postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@metro.proxy.rlwy.net:32906/railway?sslmode=require
   ```

3. **If you have a different proxy endpoint**, use:
   ```
   postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@[YOUR_PROXY_HOST]:[YOUR_PROXY_PORT]/railway
   ```

## Method 4: Environment Variables in Railway

When deploying to Railway, add these environment variables to your service:

```bash
# For internal connection (recommended for production)
DATABASE_URL=postgresql://postgres:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{POSTGRES_DB}}
```

This will automatically use Railway's internal networking.

## Testing the Connection

To test if your DATABASE_URL works:

```bash
cd backend
npx prisma db push
```

If it connects successfully, you'll see Prisma sync your schema.