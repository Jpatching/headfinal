# Deploy script for Windows PowerShell
# Run with: .\deploy.ps1

Write-Host "🚀 Building and deploying to Vercel..." -ForegroundColor Cyan
Write-Host "1. Verifying Redis Connection..." -ForegroundColor Cyan
node scripts/verify-redis.js

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Redis verification failed. Check environment variables and try again." -ForegroundColor Red
  exit 1
}

Write-Host "2. Building the application..." -ForegroundColor Cyan
npx next build

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed. Fix errors and try again." -ForegroundColor Red
  exit 1
}

Write-Host "3. Deploying to Vercel..." -ForegroundColor Cyan
npx vercel --prod

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "Visit your production site to verify the changes." -ForegroundColor Cyan
