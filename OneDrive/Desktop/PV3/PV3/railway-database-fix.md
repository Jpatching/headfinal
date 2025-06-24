# Railway PostgreSQL Connection Fix

## The Problem
Your Railway PostgreSQL database is not accessible from external connections using:
- `postgres-production-1f7e.up.railway.app` (HTTP domain, not for PostgreSQL)
- `metro.proxy.rlwy.net:32906` (TCP proxy seems down/changed)

## Solutions

### Option 1: Use Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to your project directory
cd /mnt/c/Users/patch/OneDrive/Desktop/PV3/PV3

# Link to your Railway project
railway link

# Get all environment variables
railway variables

# Look for DATABASE_URL or DATABASE_PUBLIC_URL
```

### Option 2: Check Railway Dashboard Again
1. Go to your PostgreSQL service
2. Look for tabs: **Settings**, **Variables**, **Networking**, **Logs**
3. In **Networking**, check if "Enable Public Networking" is ON
4. Look for any connection strings in the service overview

### Option 3: Use Internal Connection (Deploy to Railway)
When your app is deployed to Railway, use:
```
DATABASE_URL="postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@postgres.railway.internal:5432/railway"
```

### Option 4: Enable Public Access
If public access is disabled:
1. Go to PostgreSQL service → Settings
2. Look for "Public Networking" or "TCP Proxy"
3. Enable it if it's disabled
4. Railway will provide a new public connection string

## For Now (Development Workaround)

### Use a local PostgreSQL database:
1. Install PostgreSQL locally
2. Update .env files:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/pv3_dev"
   ```
3. Run migrations:
   ```bash
   npx prisma db push
   ```

### Or use a free PostgreSQL service:
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Free tier available
- [ElephantSQL](https://www.elephantsql.com) - Free tier available

## Production Deployment

When deploying to Railway, add these environment variables to your service:

```bash
DATABASE_URL=${{POSTGRES.DATABASE_URL}}
# or
DATABASE_URL=postgresql://postgres:${{POSTGRES.PGPASSWORD}}@${{POSTGRES.RAILWAY_PRIVATE_DOMAIN}}:5432/${{POSTGRES.PGDATABASE}}
```

This will automatically use Railway's internal networking.