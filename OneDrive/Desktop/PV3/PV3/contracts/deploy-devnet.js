#!/usr/bin/env node

/**
 * PV3 DEVNET Deployment Script - FREE TESTING
 */

const fs = require('fs');
const path = require('path');

// Load devnet environment
const envPath = path.join(__dirname, 'env.devnet');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse and set environment variables
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
});

// Import the main deployment function
const { deployPV3 } = require('./deploy-pv3');

console.log('🧪 DEVNET DEPLOYMENT - FREE TESTING');
console.log('━'.repeat(50));
console.log('📍 Network: Devnet (FREE)');
console.log('💰 Cost: $0.00');
console.log('🎯 Purpose: Testing & Development');
console.log('━'.repeat(50));

// Run deployment
deployPV3().then(() => {
  console.log('\n✅ DEVNET DEPLOYMENT COMPLETE!');
  console.log('🧪 Now you can:');
  console.log('1. Build your frontend');
  console.log('2. Test full game flows');
  console.log('3. Perfect the user experience');
  console.log('4. Deploy to mainnet when ready');
}).catch(console.error); 