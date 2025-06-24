#!/bin/bash

# PV3 Smart Contract Deployment Script
# Deploys PV3 gaming platform contracts to Solana mainnet

set -e

echo "🚀 Starting PV3 Smart Contract Deployment..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first."
    exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first."
    exit 1
fi

# Set cluster to mainnet
echo "🌐 Setting cluster to mainnet..."
solana config set --url mainnet-beta

# Verify wallet exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "❌ Wallet not found. Please run 'solana-keygen new' first."
    exit 1
fi

WALLET_ADDRESS=$(solana address)
echo "💰 Deploying from wallet: $WALLET_ADDRESS"

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💳 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 5" | bc -l) )); then
    echo "⚠️  Warning: Low balance. Deployment may fail. Recommended: 5+ SOL"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the program
echo "🔨 Building PV3 program..."
anchor build

# Get the program ID
PROGRAM_ID=$(anchor keys list | grep "pv3" | awk '{print $2}')
echo "📋 Program ID: $PROGRAM_ID"

# Update lib.rs with correct program ID
echo "🔧 Updating program ID in source code..."
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/pv3/src/lib.rs

# Rebuild with correct program ID
echo "🔨 Rebuilding with correct program ID..."
anchor build

# Deploy to mainnet
echo "🚀 Deploying to mainnet..."
anchor deploy --provider.cluster mainnet

# Verify deployment
echo "✅ Verifying deployment..."
solana program show $PROGRAM_ID

echo ""
echo "🎉 PV3 Smart Contract Deployment Complete!"
echo ""
echo "📊 Deployment Summary:"
echo "   Program ID: $PROGRAM_ID"
echo "   Network: Solana Mainnet"
echo "   Deployer: $WALLET_ADDRESS"
echo "   Timestamp: $(date)"
echo ""
echo "🔗 Explorer Link: https://solscan.io/account/$PROGRAM_ID"
echo ""
echo "⚠️  IMPORTANT: Update your backend configuration with this Program ID:"
echo "   SOLANA_PROGRAM_ID=$PROGRAM_ID"
echo ""
echo "🎯 Next Steps:"
echo "   1. Initialize the platform with initialize() function"
echo "   2. Set treasury and referral pool addresses"
echo "   3. Configure verifier service public key"
echo "   4. Set up 2-of-3 admin multisig"
echo ""

echo "✅ Deployment complete!" 