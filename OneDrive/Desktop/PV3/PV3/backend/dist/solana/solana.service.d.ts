import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
export interface EscrowAccount {
    matchId: string;
    player1: PublicKey;
    player2?: PublicKey;
    wager: number;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    winner?: PublicKey;
    createdAt: BN;
}
export declare class SolanaService {
    private readonly logger;
    private connection;
    private program;
    private wallet;
    private treasuryWallet;
    private referralWallet;
    constructor();
    createMatchEscrow(matchId: string, playerWallet: string, wager: number): Promise<string>;
    joinMatch(escrowAddress: string, playerWallet: string, wager: number): Promise<void>;
    submitMatchResult(escrowAddress: string, winnerWallet: string, signature: string): Promise<void>;
    refundMatch(escrowAddress: string): Promise<void>;
    getEscrowData(escrowAddress: string): Promise<EscrowAccount | null>;
    verifyTransaction(signature: string): Promise<boolean>;
    getWalletBalance(walletAddress: string): Promise<number>;
    withdrawFromVault(vaultAddress: string, destinationAddress: string, amount: number): Promise<string>;
    isHealthy(): Promise<boolean>;
    getNetworkStats(): Promise<{
        slot: number;
        blockHeight: number;
        epochInfo: any;
    }>;
}
