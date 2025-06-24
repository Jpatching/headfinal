# Deploy Backend to Railway

## Prerequisites
- Railway account
- Railway CLI installed: `npm i -g @railway/cli`

## Deployment Steps

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link -p 16b7a71a-ef43-4843-bb75-eb3b4514e240
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=8000
   railway variables set DATABASE_URL="postgresql://postgres:tVbhdDNbjWHrxkOgivpbQIwxeaVioeIe@postgres.railway.internal:5432/railway"
   railway variables set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   railway variables set SOLANA_PRIVATE_KEY="[27,49,245,50,66,43,65,236,135,217,112,63,215,53,130,54,141,22,39,62,93,25,40,30,183,71,140,151,184,94,51,6,34,15,45,53,228,89,45,53,97,38,169,60,61,162,13,5,239,227,218,195,168,161,193,61,160,131,222,64,110,113,209,7]"
   railway variables set VERIFIER_SEED="[12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78]"
   railway variables set PV3_PROGRAM_ID="51mQPjsgLs5XpPMmtux9jmTaRqbsi36jKoDGADfjzbDs"
   railway variables set JWT_SECRET="pv3_super_secret_jwt_key_change_in_production_2024"
   railway variables set TREASURY_WALLET="3HxHULfdF6R5yPxrzVKhm4hM96ambeT7urMGVtU5v1pz"
   railway variables set REFERRAL_WALLET="3HxHULfdF6R5yPxrzVKhm4hM96ambeT7urMGVtU5v1pz"
   railway variables set MIN_WAGER="0.01"
   railway variables set MAX_WAGER="10.0"
   railway variables set PLATFORM_FEE_PERCENT="0.065"
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

## Alternative: Deploy via Dashboard

1. Go to Railway dashboard
2. Select your project
3. Click "New Service" > "GitHub Repo" or "Empty Service"
4. Set:
   - Root Directory: `/backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Add all environment variables in the Variables tab
6. Deploy

## Post-Deployment
- Note your backend URL (e.g., `https://pv3-production.up.railway.app`)
- Update frontend's `NEXT_PUBLIC_API_URL` with this URL
- Ensure PostgreSQL service is in the same project for internal networking