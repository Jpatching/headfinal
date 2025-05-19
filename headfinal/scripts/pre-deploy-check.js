/**
 * Pre-deployment verification script
 * Run before deploying to Vercel production to ensure everything is configured correctly
 * 
 * Usage: node scripts/pre-deploy-check.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');

// Add the missing getRedisClient function
function getRedisClient() {
  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis client:', error);
    return null;
  }
}

function checkEnvironmentVariables() {
  console.log('\n📋 Checking environment variables...');
  
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
    console.log('\n⚠️ Some required environment variables are missing!');
    console.log('   Make sure to add them to your Vercel project settings before deploying.');
    console.log('   https://vercel.com/dashboard -> Your Project -> Settings -> Environment Variables');
  }
  
  return !missingVars;
}

function checkRedisConnection() {
  console.log('\n📡 Testing Redis connection...');
  
  try {
    execSync('node scripts/verify-redis.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed!');
    return false;
  }
}

function runBuildTest() {
  console.log('\n🔨 Running build test...');
  
  try {
    // First, clean the .next directory to avoid permission issues
    console.log('Cleaning previous build artifacts...');
    try {
      execSync('rm -rf .next', { stdio: 'inherit' });
    } catch (cleanError) {
      console.log('Could not clean .next directory, attempting build anyway');
    }
    
    // Add a small delay to ensure file locks are released
    console.log('Waiting for file locks to clear...');
    execSync('sleep 2 || timeout /t 2', { stdio: 'inherit' });
    
    // Use --no-lint to speed up the build
    console.log('Starting build process...');
    execSync('next build --no-lint', { stdio: 'inherit' });
    console.log('✅ Build successful!');
    return true;
  } catch (error) {
    console.error('❌ Build failed!');
    console.error('Try manually running: npm run build');
    console.error('If that fails, restart your computer to clear file locks.');
    return false;
  }
}

function checkDeploymentConfiguration() {
  console.log('\n📝 Checking deployment configuration...');
  
  // Check for vercel.json
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  if (!fs.existsSync(vercelConfigPath)) {
    console.log('⚠️ No vercel.json configuration file found.');
    console.log('   Creating a default configuration...');
    
    const defaultConfig = {
      "version": 2,
      "buildCommand": "next build",
      "outputDirectory": ".next",
      "framework": "nextjs",
      "regions": ["iad1"],
      "env": {
        "NEXT_PUBLIC_VERCEL_ENV": "production"
      }
    };
    
    fs.writeFileSync(vercelConfigPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created vercel.json with default configuration');
  } else {
    console.log('✅ vercel.json configuration found');
  }
  
  return true;
}

async function testRedisZADD() {
  try {
    console.log('\n3. Testing Redis ZADD operation...');
    const redis = getRedisClient();
    
    if (!redis) {
      console.error('  ❌ Failed to initialize Redis client');
      return false;
    }
    
    const testKey = `test:zadd:${Date.now()}`;
    const testScore = Date.now();
    const testMember = `test:${Date.now()}`;
    
    // The correct format for Upstash Redis ZADD
    const result = await redis.zadd(testKey, { score: testScore, member: testMember });
    
    console.log(`  ✅ ZADD operation successful: ${result}`);
    
    // Cleanup
    await redis.del(testKey);
    return true;
  } catch (error) {
    console.error(`  ❌ Redis ZADD error: ${error.message}`);
    return false;
  }
}

async function runPreDeploymentChecks() {
  console.log('🚀 Running pre-deployment checks for Vercel production...');
  
  const envCheckPassed = checkEnvironmentVariables();
  const redisCheckPassed = checkRedisConnection();
  const buildTestPassed = runBuildTest();
  const configCheckPassed = checkDeploymentConfiguration();
  const zaddTestPassed = await testRedisZADD();
  
  console.log('\n📋 Pre-deployment Check Summary:');
  console.log(`   Environment Variables: ${envCheckPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Redis Connection: ${redisCheckPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Build Test: ${buildTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Deployment Configuration: ${configCheckPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Redis ZADD Test: ${zaddTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (envCheckPassed && redisCheckPassed && buildTestPassed && configCheckPassed && zaddTestPassed) {
    console.log('\n✅ All pre-deployment checks passed!');
    console.log('\nYou can now deploy to Vercel with:');
    console.log('   vercel --prod');
    return true;
  } else {
    console.log('\n❌ Some pre-deployment checks failed!');
    console.log('   Please fix the issues before deploying to production.');
    return false;
  }
}

runPreDeploymentChecks().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error('Error running pre-deployment checks:', error);
  process.exit(1);
});
