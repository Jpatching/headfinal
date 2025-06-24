# PV3 Gaming Platform

A next-generation gaming platform built on Solana.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8.6.0+
- Rust + Cargo
- Solana CLI
- Anchor CLI

### Setup Instructions

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development environment:
```bash
pnpm dev
```

## 📁 Project Structure

- `/backend` - Main API server (Node.js/Express)
- `/frontend` - Web client (Next.js)
- `/verifier` - Game verification service
- `/contracts` - Solana smart contracts
- `/games` - Game implementations
- `/prisma` - Database schema and migrations
- `/dev` - Development utilities
- `/docs` - Documentation

## 🔒 Security Features

- Non-custodial PDA vaults
- Per-match isolation
- Verifier service with ed25519 signatures
- 2-of-3 multisig for emergency actions
- Comprehensive IP blocking and DDOS protection
- WebSocket security measures

## 🛠 Development

- Run tests: `pnpm test`
- Run linter: `pnpm lint`
- Format code: `pnpm format`

## 📝 License

Proprietary - All rights reserved 

## 🎯 PV3 Full Deployment Strategy

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Unity Games   │    │   Backend API   │
│   (Vercel)      │◄──►│   (CloudFront)  │◄──►│   (Railway)     │
│                 │    │                 │    │                 │
│ • Game Lobby    │    │ • WebGL Builds  │    │ • NestJS API    │
│ • Wallet UI     │    │ • .wasm/.js     │    │ • WebSocket     │
│ • Match History │    │ • Client-side   │    │ • Solana calls  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │      Solana Blockchain      │
                    │   • Smart Contracts         │
                    │   • Match Escrow PDAs       │
                    │   • Session Vaults          │
                    └─────────────────────────────┘

## 🚀 Phase 1: Railway Backend (NOW)

Let's start with creating the Railway project: 