import { PublicKey, Connection } from '@solana/web3.js';

// PV3 Smart Contract Configuration
export const PV3_CONFIG = {
  // Network Configuration
  CLUSTER: 'devnet' as const,
  RPC_URL: 'https://api.devnet.solana.com',
  
  // Smart Contract Addresses (from our deployment)
  PROGRAM_ID: new PublicKey('51mQPjsgLs5XpPMmtux9jmTaRqbsi36jKoDGADfjzbDs'),
  CONFIG_PDA: new PublicKey('A8MebiN11Uu9ptd1VpMG8iVU9RkVUxw13JgzniAAg5At'),
  
  // Platform Wallets
  TREASURY_WALLET: new PublicKey('59sK3SsSd76QkjzeN2ZmRUtEsC54e4mjdzmjmYPbZ7rN'),
  REFERRAL_POOL: new PublicKey('GcH9Y4fM7cycgtNpiBFKCUXWqTjrtpAyuMQ3vupyRH69'),
  VERIFIER_PUBKEY: new PublicKey('6qThdrwT8BwhXh3ehwbdvQoZCdyCZBt8EQPidjy3DNpZ'),
  
  // Admin Multisig
  ADMINS: [
    new PublicKey('BA128mWgxnkxot8WXstYNfvXjnaSveEbg7zhwmy7gwj4'),
    new PublicKey('5sqfWKUqrWdjt8sWoJzEM1RpF3cLs9EvXpBjYFRWpueL'),
    new PublicKey('CGSjjrNJrCAseUATBgkWBY59VGoYGqMQMakY8KMPyAa8'),
  ],
  
  // Platform Fees (basis points: 65 = 0.65%, 550 = 5.5%, 100 = 1%)
  FEES: {
    PLATFORM_FEE: 550, // 5.5%
    REFERRAL_FEE: 100,  // 1%
    TOTAL_FEE: 650,     // 6.5%
  },
  
  // Game Types
  GAME_TYPES: {
    COIN_FLIP: 0,
    ROCK_PAPER_SCISSORS: 1,
    DICE_ROLL: 2,
    NUMBER_GUESS: 3,
  },
} as const;

// Connection instance
export const connection = new Connection(PV3_CONFIG.RPC_URL, 'confirmed');

// PDA derivation helpers
export const derivePDAs = {
  config: () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config', 'utf8')],
      PV3_CONFIG.PROGRAM_ID
    );
  },
  
  match: (matchId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('match', 'utf8'), Buffer.from(matchId, 'utf8')],
      PV3_CONFIG.PROGRAM_ID
    );
  },
  
  sessionVault: (playerPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('session', 'utf8'), playerPubkey.toBuffer()],
      PV3_CONFIG.PROGRAM_ID
    );
  },
  
  playerProfile: (playerPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('player', 'utf8'), playerPubkey.toBuffer()],
      PV3_CONFIG.PROGRAM_ID
    );
  },
};

// IDL for program interaction
export const PV3_IDL = {
  version: '0.1.0',
  name: 'pv3',
  instructions: [
    {
      name: 'initialize',
      accounts: [
        { name: 'config', isMut: true, isSigner: false },
        { name: 'payer', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'treasury', type: 'publicKey' },
        { name: 'referralPool', type: 'publicKey' },
        { name: 'verifierPubkey', type: 'publicKey' },
        { name: 'admin1', type: 'publicKey' },
        { name: 'admin2', type: 'publicKey' },
        { name: 'admin3', type: 'publicKey' },
      ],
    },
    {
      name: 'createMatch',
      accounts: [
        { name: 'match', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'sessionVault', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'matchId', type: 'string' },
        { name: 'wagerAmount', type: 'u64' },
        { name: 'gameType', type: 'u8' },
      ],
    },
    {
      name: 'joinMatch',
      accounts: [
        { name: 'match', isMut: true, isSigner: false },
        { name: 'joiner', isMut: true, isSigner: true },
        { name: 'sessionVault', isMut: true, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
};

// Utility functions
export const formatSOL = (lamports: number): string => {
  return (lamports / 1e9).toFixed(9);
};

export const parseSOL = (sol: string): number => {
  return parseFloat(sol) * 1e9;
};

export const generateMatchId = (): string => {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}; 