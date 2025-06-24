# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PV3 is a next-generation 1v1 skill gaming platform built on Solana. The platform consists of:

- **Frontend**: Next.js web application for game lobby, wallet integration, and match history
- **Backend**: NestJS API server handling game logic, WebSocket connections, and Solana interactions
- **Smart Contracts**: Anchor-based Solana programs managing match escrow and payouts
- **Unity Games**: WebGL builds served through CloudFront (game implementations)
- **Verifier Service**: Game result verification with ed25519 signatures

## Development Commands

### Root Level
```bash
# Install all dependencies
pnpm install

# Run frontend development server
pnpm dev

# Build frontend
pnpm build

# Lint frontend
pnpm lint

# Database operations
pnpm db:seed         # Seed database with initial data
prisma generate      # Generate Prisma client
prisma db push       # Push schema to database
```

### Backend (NestJS)
```bash
cd backend

# Development
npm run start:dev    # Run with ts-node
npm run start:debug  # Run with debugger

# Production
npm run build        # Compile TypeScript
npm start           # Start production server

# Database
npm run db:migrate   # Push schema changes
npm run db:generate  # Generate Prisma client

# Deployment
npm run deploy      # Full deploy (migrate + build + start)
```

### Smart Contracts
```bash
cd contracts

# Build contracts
anchor build
npm run build

# Deploy
npm run deploy              # Deploy to current cluster
npm run deploy:devnet       # Deploy to devnet
node deploy-pv3.js         # Direct deployment script

# Test
anchor test
npm test
```

## Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Prisma, Solana Wallet Adapter
- **Backend**: NestJS 10, Socket.io, Prisma ORM, Express
- **Smart Contracts**: Anchor 0.31.1, Solana Web3.js
- **Database**: PostgreSQL (via Prisma)
- **Deployment**: Vercel (frontend), Railway (backend), Solana (contracts)

### Core Modules (Backend)

1. **Auth Module**: Wallet-based authentication with message signing
2. **Match Module**: Game matchmaking, WebSocket management, match lifecycle
3. **Solana Module**: Blockchain interactions, escrow management
4. **Verifier Module**: Game result verification and signature validation
5. **User Module**: User profiles, stats tracking
6. **Tournament Module**: Tournament management and brackets
7. **Leaderboard Module**: Rankings and statistics
8. **Security Module**: IP blocking, rate limiting, audit logging

### Database Schema

The platform uses a shared Prisma schema (`/prisma/schema.prisma`) with these core models:
- **User**: Player profiles, stats, achievements
- **Match**: Game sessions, wagers, results
- **Tournament**: Competitive events and brackets
- **Referral**: Referral system tracking
- **SecurityLog/AuditLog**: Security and admin action tracking

### Smart Contract Architecture

The PV3 program (`/contracts/programs/pv3/src/lib.rs`) implements:
- Non-custodial PDA vaults for match escrow
- Per-match isolation for security
- 2-of-3 multisig for emergency actions
- Verifier service integration for result validation

### Security Features

- WebSocket authentication via signed messages
- IP blocking and rate limiting
- Comprehensive audit logging
- Non-custodial escrow system
- Ed25519 signature verification for game results

## Environment Variables

### Frontend (.env)
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://backend.railway.app
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
PORT=8080
NODE_ENV=production
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

### Contracts (.env)
```
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Deployment

### Frontend (Vercel)
- Auto-deploys from GitHub
- Preview deployments for PRs
- Environment variables set in Vercel dashboard

### Backend (Railway)
```bash
cd backend
railway login
railway up
```

### Smart Contracts
```bash
cd contracts
npm run deploy:devnet  # For testnet
npm run deploy         # For configured cluster
```

## Key Files to Understand

1. **Backend Architecture**: `/backend/src/app.module.ts` - Main module composition
2. **Match Logic**: `/backend/src/match/match.service.ts` - Core game flow
3. **Smart Contract**: `/contracts/programs/pv3/src/lib.rs` - On-chain logic
4. **Database Schema**: `/prisma/schema.prisma` - Data models
5. **Frontend Entry**: `/frontend/src/app/page.tsx` - Main UI
6. **Solana Integration**: `/frontend/src/hooks/usePV3.ts` - Blockchain hooks

## Common Issues & Solutions

### Frontend Build Issues
- **Missing components**: Components are split between `/src/components` and `/frontend/src/components`
- **Path aliases**: Use `@/` for imports in frontend, which maps to `./src/`
- **Prisma imports**: Use `import prisma from '@/lib/prisma'` (default export)

### Backend Build Issues
- **Node version**: Requires Node.js 20.18.0+ (backend package.json specifies this)
- **Prisma generation**: Always run `prisma generate` before building
- **TypeScript paths**: Backend uses absolute imports from `src/`

### Deployment Notes
- **Frontend**: Uses `/frontend` directory, not root-level `/src`
- **Backend**: Working directory is `/backend` for all commands
- **Contracts**: Requires Anchor CLI installation for building

## Quick Commands Reference

```bash
# Frontend (from /frontend directory)
cd frontend && npm install && npm run build

# Backend (from /backend directory)  
cd backend && npm install && npm run build

# Contracts (from /contracts directory)
cd contracts && npm install && anchor build

# Run all builds from root
(cd frontend && npm run build) && (cd backend && npm run build)
```

## Project Structure Clarification

```
/PV3/
├── /frontend/          # Next.js frontend app
│   ├── /src/          # Frontend source code
│   └── package.json   # Frontend dependencies
├── /backend/          # NestJS backend API
│   ├── /src/          # Backend source code
│   └── package.json   # Backend dependencies
├── /contracts/        # Solana smart contracts
│   ├── /programs/     # Anchor programs
│   └── package.json   # Contract dependencies
├── /src/              # Root-level components (legacy)
├── /lib/              # Root-level utilities
└── /prisma/           # Shared database schema
```

## Testing & Verification

### Frontend Tests
```bash
cd frontend
npm run lint         # Run linter
npm run build       # Verify build works
```

### Backend Tests
```bash
cd backend
npm run build       # Verify TypeScript compilation
npm run start:dev   # Test development server
```

### Contract Tests
```bash
cd contracts
anchor test         # Run contract tests (requires local validator)
```