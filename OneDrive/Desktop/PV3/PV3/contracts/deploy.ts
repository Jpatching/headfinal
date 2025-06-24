import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { PublicKey } from '@solana/web3.js';

/**
 * PV3 Smart Contract Deployment Script
 * Deploys PV3 gaming platform contracts to Solana mainnet
 */

console.log('🚀 Starting PV3 Smart Contract Deployment...');

// Configuration
const CLUSTER = 'mainnet-beta';
const REQUIRED_BALANCE = 5; // SOL

async function deploy() {
  try {
    // Check tools
    console.log('🔍 Checking required tools...');
    
    try {
      execSync('solana --version', { stdio: 'pipe' });
      console.log('✅ Solana CLI found');
    } catch (error) {
      console.error('❌ Solana CLI not found. Please install it first.');
      process.exit(1);
    }

    try {
      execSync('anchor --version', { stdio: 'pipe' });
      console.log('✅ Anchor CLI found');
    } catch (error) {
      console.error('❌ Anchor CLI not found. Please install it first.');
      process.exit(1);
    }

    // Set cluster
    console.log(`🌐 Setting cluster to ${CLUSTER}...`);
    execSync(`solana config set --url ${CLUSTER}`, { stdio: 'inherit' });

    // Check wallet
    console.log('💰 Checking wallet...');
    const walletAddress = execSync('solana address', { encoding: 'utf8' }).trim();
    console.log(`   Wallet: ${walletAddress}`);

    const balanceOutput = execSync('solana balance', { encoding: 'utf8' }).trim();
    const balance = parseFloat(balanceOutput.split(' ')[0]);
    console.log(`   Balance: ${balance} SOL`);

    if (balance < REQUIRED_BALANCE) {
      console.warn(`⚠️  Warning: Low balance (${balance} SOL). Recommended: ${REQUIRED_BALANCE}+ SOL`);
      console.warn('   Deployment may fail due to insufficient funds.');
    }

    // Build program
    console.log('🔨 Building PV3 program...');
    execSync('anchor build', { stdio: 'inherit' });

    // Get program ID
    console.log('📋 Getting program ID...');
    const keysOutput = execSync('anchor keys list', { encoding: 'utf8' });
    const programIdMatch = keysOutput.match(/pv3:\s+([A-Za-z0-9]+)/);
    
    if (!programIdMatch) {
      throw new Error('Could not find program ID in anchor keys output');
    }
    
    const programId = programIdMatch[1];
    console.log(`   Program ID: ${programId}`);

    // Validate program ID
    try {
      new PublicKey(programId);
      console.log('✅ Program ID is valid');
    } catch (error) {
      throw new Error(`Invalid program ID: ${programId}`);
    }

    // Update lib.rs with correct program ID
    console.log('🔧 Updating program ID in source code...');
    const libPath = 'programs/pv3/src/lib.rs';
    let libContent = readFileSync(libPath, 'utf8');
    
    // Replace the declare_id! macro
    const declareIdRegex = /declare_id!\(".*"\);/;
    const newDeclareId = `declare_id!("${programId}");`;
    
    if (declareIdRegex.test(libContent)) {
      libContent = libContent.replace(declareIdRegex, newDeclareId);
      writeFileSync(libPath, libContent);
      console.log('✅ Program ID updated in source code');
    } else {
      console.warn('⚠️  Could not find declare_id! macro to update');
    }

    // Rebuild with correct program ID
    console.log('🔨 Rebuilding with correct program ID...');
    execSync('anchor build', { stdio: 'inherit' });

    // Deploy to mainnet
    console.log('🚀 Deploying to mainnet...');
    console.log('   This may take several minutes...');
    
    try {
      execSync(`anchor deploy --provider.cluster ${CLUSTER}`, { stdio: 'inherit' });
      console.log('✅ Deployment successful!');
    } catch (error) {
      console.error('❌ Deployment failed');
      throw error;
    }

    // Verify deployment
    console.log('✅ Verifying deployment...');
    try {
      execSync(`solana program show ${programId}`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Could not verify deployment, but it may have succeeded');
    }

    // Success message
    console.log('');
    console.log('🎉 PV3 Smart Contract Deployment Complete!');
    console.log('');
    console.log('📊 Deployment Summary:');
    console.log(`   Program ID: ${programId}`);
    console.log(`   Network: Solana ${CLUSTER}`);
    console.log(`   Deployer: ${walletAddress}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('');
    console.log(`🔗 Explorer: https://solscan.io/account/${programId}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Update your backend with this Program ID:');
    console.log(`   SOLANA_PROGRAM_ID=${programId}`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Initialize platform with initialize() function');
    console.log('   2. Set treasury and referral pool addresses');
    console.log('   3. Configure verifier service public key');
    console.log('   4. Set up 2-of-3 admin multisig');
    console.log('   5. Update backend environment variables');
    console.log('');

    // Save deployment info
    const deploymentInfo = {
      programId,
      cluster: CLUSTER,
      deployer: walletAddress,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://solscan.io/account/${programId}`
    };

    writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('📝 Deployment info saved to deployment.json');

  } catch (error) {
    console.error('');
    console.error('❌ Deployment failed:');
    console.error(error.message);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Ensure you have enough SOL for deployment');
    console.error('   2. Check your Solana RPC connection');
    console.error('   3. Verify your wallet has the correct permissions');
    console.error('   4. Try deploying to devnet first for testing');
    process.exit(1);
  }
}

// Run deployment
deploy(); 