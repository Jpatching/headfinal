/**
 * Deployment verification script
 * Run before deploying to production
 */

require('dotenv').config();
const { execSync } = require('child_process');

async function verifyDeployment() {
  console.log('Pre-deployment verification');
  console.log('==========================');
  
  // 1. Check for required environment variables
  console.log('\n1. Checking environment variables...');
  const requiredVars = [
    'UPSTASH_REDIS_KV_REST_API_URL',
    'UPSTASH_REDIS_KV_REST_API_TOKEN'
  ];
  
  let missingVars = false;
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing environment variable: ${varName}`);
      missingVars = true;
    } else {
      console.log(`✅ Found ${varName}`);
    }
  }
  
  if (missingVars) {
    console.error('\n❌ Some required environment variables are missing. Please set them before deploying.');
    process.exit(1);
  }
  
  // 2. Test Redis connection
  console.log('\n2. Testing Redis connection...');
  try {
    execSync('node scripts/test-redis.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Redis connection test failed. Please fix before deploying.');
    process.exit(1);
  }
  
  // 3. Verify leaderboard functionality
  console.log('\n3. Verifying leaderboard functionality...');
  try {
    execSync('node scripts/verify-leaderboard.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Leaderboard verification failed. Please fix before deploying.');
    process.exit(1);
  }
  
  // 4. Run build to check for any build errors
  console.log('\n4. Running build check...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Build failed. Please fix build errors before deploying.');
    process.exit(1);
  }
  
  console.log('\n✅ All checks passed! You are ready to deploy to production.');
  console.log('\nTo deploy to Vercel, run:');
  console.log('  vercel --prod');
}

verifyDeployment().catch(console.error);
