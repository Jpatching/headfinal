#!/usr/bin/env node

/**
 * PV3 Smart Contract Deployment - Fixed for Anchor 0.30.1
 */

const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { Wallet, AnchorProvider, setProvider, Program } = require('@coral-xyz/anchor');
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

const CLUSTER_URL = process.env.SOLANA_RPC_URL;
const DEPLOY_WALLET_KEY = JSON.parse(process.env.DEPLOY_WALLET_PRIVATE_KEY);
const TREASURY_WALLET = process.env.TREASURY_WALLET;
const REFERRAL_POOL = process.env.REFERRAL_POOL_WALLET;
const VERIFIER_PUBKEY = process.env.VERIFIER_PUBKEY;
const ADMIN1 = process.env.ADMIN1_PUBKEY;
const ADMIN2 = process.env.ADMIN2_PUBKEY;
const ADMIN3 = process.env.ADMIN3_PUBKEY;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);

async function deployPV3() {
  console.log('🧪 DEVNET DEPLOYMENT - FREE TESTING');
  console.log('━'.repeat(50));
  console.log('📍 Network: Devnet (FREE)');
  console.log('💰 Cost: $0.00');
  console.log('🎯 Purpose: Testing & Development');
  console.log('━'.repeat(50));

  try {
    // Setup connection
    const connection = new Connection(CLUSTER_URL, 'confirmed');
    console.log(`🔗 Connected to: ${CLUSTER_URL}`);

    // Setup wallet
    const keypair = Keypair.fromSecretKey(new Uint8Array(DEPLOY_WALLET_KEY));
    const wallet = new Wallet(keypair);
    console.log(`💰 Deploying from: ${keypair.publicKey.toString()}`);

    // Check balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`💳 Balance: ${balance / 1e9} SOL`);

    // Setup provider
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    setProvider(provider);

    // For now, just test basic connectivity and account creation
    console.log('\n🔧 Testing PV3 Platform Setup...');

    // Find config PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('config', 'utf8')],
      PROGRAM_ID
    );
    console.log(`📋 Config PDA: ${configPDA.toString()}`);

    // Check if config account exists
    const configAccount = await connection.getAccountInfo(configPDA);
    if (configAccount) {
      console.log('✅ Config account already exists');
    } else {
      console.log('🆕 Config account needs to be created');
    }

    // Test match PDA derivation
    const matchId = 'test-match-001';
    const [matchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('match', 'utf8'), Buffer.from(matchId, 'utf8')],
      PROGRAM_ID
    );
    console.log(`🎮 Test Match PDA: ${matchPDA.toString()}`);

    // Output configuration for frontend/backend
    console.log('\n🎉 PV3 Configuration Ready!');
    console.log('━'.repeat(50));
    console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
    console.log(`🏦 Treasury: ${TREASURY_WALLET}`);
    console.log(`🔄 Referral Pool: ${REFERRAL_POOL}`);
    console.log(`🔐 Verifier: ${VERIFIER_PUBKEY}`);
    console.log(`📊 Config PDA: ${configPDA.toString()}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`);
    console.log('━'.repeat(50));
    
    console.log('\n⚙️  Backend Environment Variables:');
    console.log(`SOLANA_PROGRAM_ID=${PROGRAM_ID.toString()}`);
    console.log(`SOLANA_CONFIG_PDA=${configPDA.toString()}`);
    console.log('SOLANA_CLUSTER=devnet');
    console.log('SOLANA_RPC_URL=https://api.devnet.solana.com');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Smart contract addresses configured');
    console.log('2. 🚧 Build frontend with these addresses');
    console.log('3. 🚧 Test match creation/joining flows');
    console.log('4. 🚧 Deploy actual smart contract code');
    console.log('5. 🚧 Full integration testing');
    console.log('\n🆓 All testing on devnet is FREE! Get more SOL anytime with:');
    console.log(`solana airdrop 2 ${keypair.publicKey.toString()}`);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run deployment
deployPV3().catch(console.error); 