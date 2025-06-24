# Deploy Frontend to Vercel

## Prerequisites
- Vercel account
- Vercel CLI installed: `npm i -g vercel`

## Deployment Steps

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Configure during deployment**:
   - Project name: `pv3-gaming`
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm install`

4. **Set Environment Variables in Vercel Dashboard**:
   ```
   DATABASE_URL=postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@postgres.railway.internal:5432/railway
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_API_URL=https://pv3-production.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://pv3-gaming.vercel.app
   NEXT_PUBLIC_SITE_NAME=PV3.FUN
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Post-Deployment
- Update CORS in backend to include your Vercel URL
- Update `NEXT_PUBLIC_API_URL` to your Railway backend URL