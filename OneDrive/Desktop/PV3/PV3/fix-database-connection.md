# Fix Database Connection

## Problem
The PostgreSQL connection is failing because the DATABASE_URL is pointing to an old Railway endpoint that no longer exists.

## Solution

1. **Get your Railway PostgreSQL credentials**:
   - Go to your Railway dashboard
   - Click on your PostgreSQL service
   - Go to the "Variables" tab
   - Find these variables:
     - `PGUSER` (usually "postgres")
     - `PGPASSWORD` (your database password)
     - `PGDATABASE` (usually "railway")

2. **Update your DATABASE_URL**:

   For local development:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR_PGPASSWORD]@metro.proxy.rlwy.net:32906/railway"
   ```

   For production (when deployed on Railway):
   ```
   DATABASE_URL="postgresql://postgres:[YOUR_PGPASSWORD]@postgres.railway.internal:5432/railway"
   ```

3. **Update your .env files**:

   a. Backend (.env):
   ```bash
   cd backend
   mv .env .env.old
   cp .env.new .env
   # Edit .env and replace [YOUR_PASSWORD] with your actual password
   ```

   b. Frontend (.env.local):
   ```bash
   cd frontend
   # Add the same DATABASE_URL to .env.local
   ```

   c. Root directory (.env):
   ```bash
   cd ..
   # Copy the same DATABASE_URL here for Prisma migrations
   ```

4. **Test the connection**:
   ```bash
   cd backend
   npx prisma db push  # This will sync your schema
   npm run start:dev   # Start the backend
   ```

## Railway Networking Info

Your PostgreSQL service has:
- **Public TCP Proxy**: `metro.proxy.rlwy.net:32906` (for external connections)
- **Private Network**: `postgres.railway.internal:5432` (for internal Railway services)
- **HTTP Domain**: `postgres-production-1f7e.up.railway.app` (not used for PostgreSQL)

## Environment Variables to Add in Railway

When deploying your backend to Railway, add these environment variables:
- Use the private network URL: `postgresql://postgres:[PASSWORD]@postgres.railway.internal:5432/railway`
- This provides faster, more secure internal communication

## Next Steps

1. Update all .env files with the correct DATABASE_URL
2. Run `npx prisma db push` to sync your schema
3. Test the connection with `npm run start:dev`
4. Commit the .env.example file (but never commit actual .env files)