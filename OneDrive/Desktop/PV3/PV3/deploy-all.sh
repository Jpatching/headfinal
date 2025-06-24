#!/bin/bash

echo "🚀 PV3 Full Deployment Script"
echo "============================="

# Deploy Backend to Railway
echo "📦 Deploying Backend to Railway..."
cd backend
railway up -d

# Get the backend URL
BACKEND_URL=$(railway status --json | jq -r '.url')
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy Frontend to Vercel
echo "📦 Deploying Frontend to Vercel..."
cd ../frontend

# Update the API URL
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production

# Deploy to Vercel
vercel --prod

echo "✅ Deployment complete!"
echo "Don't forget to:"
echo "1. Update CORS settings in Railway with your Vercel URL"
echo "2. Set environment variables in both services"
echo "3. Run database migrations if needed"