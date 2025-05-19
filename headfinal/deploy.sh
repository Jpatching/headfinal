#!/bin/bash

# Script to build and deploy the application to Vercel

echo "🚀 Building and deploying to Vercel..."
echo "1. Verifying Redis Connection..."
node scripts/verify-redis.js

if [ $? -ne 0 ]; then
  echo "❌ Redis verification failed. Check environment variables and try again."
  exit 1
fi

echo "2. Building the application..."
next build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors and try again."
  exit 1
fi

echo "3. Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed successfully!"
echo "Visit your production site to verify the changes."
