import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';

export interface EscrowAccount {
  matchId: string;
  player1: PublicKey;
  player2?: PublicKey;
  wager: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  winner?: PublicKey;
  createdAt: BN;
}

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private program: Program;
  private wallet: Wallet;
  private treasuryWallet: PublicKey;
  private referralWallet: PublicKey;

  constructor() {
    // Initialize Solana connection
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize wallet from private key
    const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyString) {
      throw new Error('SOLANA_PRIVATE_KEY environment variable is required');
    }

    const privateKeyBytes = JSON.parse(privateKeyString);
    const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
    this.wallet = new Wallet(keypair);

    // Initialize treasury and referral wallets
    this.treasuryWallet = new PublicKey(process.env.TREASURY_WALLET || keypair.publicKey.toString());
    this.referralWallet = new PublicKey(process.env.REFERRAL_WALLET || keypair.publicKey.toString());

    // Initialize Anchor program
    const provider = new AnchorProvider(this.connection, this.wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(provider);

    // Load program (this would be your deployed PV3 program)
    const programId = new PublicKey(process.env.PV3_PROGRAM_ID || 'PV3ProgramId11111111111111111111111111111111');
    // this.program = new Program(idl, programId, provider);

    this.logger.log('Solana service initialized');
  }

  /**
   * Create match escrow PDA
   */
  async createMatchEscrow(matchId: string, playerWallet: string, wager: number): Promise<string> {
    try {
      const player = new PublicKey(playerWallet);
      const wagerLamports = wager * LAMPORTS_PER_SOL;

      // Generate PDA for match escrow
      const [escrowPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('match_escrow'),
          Buffer.from(matchId),
        ],
        this.program?.programId || new PublicKey('PV3ProgramId11111111111111111111111111111111')
      );

      // Create escrow account instruction
      const createEscrowIx = SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: escrowPda,
        lamports: await this.connection.getMinimumBalanceForRentExemption(1000), // Adjust size as needed
        space: 1000, // Adjust based on your escrow account structure
        programId: this.program?.programId || new PublicKey('PV3ProgramId11111111111111111111111111111111'),
      });

      // Initialize escrow instruction (this would call your program)
      // const initEscrowIx = await this.program.methods
      //   .initializeEscrow(matchId, new BN(wagerLamports))
      //   .accounts({
      //     escrow: escrowPda,
      //     player1: player,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();

      // For now, create a simple transaction
      const transaction = new Transaction();
      transaction.add(createEscrowIx);
      // transaction.add(initEscrowIx);

      // Send transaction
      const signature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
      await this.connection.confirmTransaction(signature, 'confirmed');

      this.logger.log(`Escrow created for match ${matchId}: ${escrowPda.toString()}`);
      return escrowPda.toString();
    } catch (error) {
      this.logger.error(`Failed to create escrow: ${error.message}`);
      throw new BadRequestException(`Failed to create match escrow: ${error.message}`);
    }
  }

  /**
   * Join match by depositing wager to escrow
   */
  async joinMatch(escrowAddress: string, playerWallet: string, wager: number): Promise<void> {
    try {
      const escrowPda = new PublicKey(escrowAddress);
      const player = new PublicKey(playerWallet);
      const wagerLamports = wager * LAMPORTS_PER_SOL;

      // Join match instruction (this would call your program)
      // const joinMatchIx = await this.program.methods
      //   .joinMatch()
      //   .accounts({
      //     escrow: escrowPda,
      //     player2: player,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();

      // Transfer wager to escrow
      const transferIx = SystemProgram.transfer({
        fromPubkey: player,
        toPubkey: escrowPda,
        lamports: wagerLamports,
      });

      const transaction = new Transaction();
      transaction.add(transferIx);
      // transaction.add(joinMatchIx);

      // This would need to be signed by the player in a real implementation
      // For now, we'll simulate it
      this.logger.log(`Player ${playerWallet} joined match with escrow ${escrowAddress}`);
    } catch (error) {
      this.logger.error(`Failed to join match: ${error.message}`);
      throw new BadRequestException(`Failed to join match: ${error.message}`);
    }
  }

  /**
   * Submit match result and process payout
   */
  async submitMatchResult(escrowAddress: string, winnerWallet: string, signature: string): Promise<void> {
    try {
      const escrowPda = new PublicKey(escrowAddress);
      const winner = new PublicKey(winnerWallet);

      // Get escrow account data
      const escrowAccount = await this.connection.getAccountInfo(escrowPda);
      if (!escrowAccount) {
        throw new BadRequestException('Escrow account not found');
      }

      // Calculate payouts based on PV3 fee structure
      const totalBalance = escrowAccount.lamports;
      const platformFee = Math.floor(totalBalance * 0.065); // 6.5% total fee
      const treasuryFee = Math.floor(platformFee * 0.846); // 5.5% of total (84.6% of platform fee)
      const referralFee = Math.floor(platformFee * 0.154); // 1% of total (15.4% of platform fee)
      const winnerPayout = totalBalance - platformFee;

      // Create payout transaction
      const transaction = new Transaction();

      // Transfer to winner
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: escrowPda,
          toPubkey: winner,
          lamports: winnerPayout,
        })
      );

      // Transfer treasury fee
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: escrowPda,
          toPubkey: this.treasuryWallet,
          lamports: treasuryFee,
        })
      );

      // Transfer referral fee
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: escrowPda,
          toPubkey: this.referralWallet,
          lamports: referralFee,
        })
      );

      // Submit result instruction (this would call your program)
      // const submitResultIx = await this.program.methods
      //   .submitResult(signature)
      //   .accounts({
      //     escrow: escrowPda,
      //     winner: winner,
      //     treasury: this.treasuryWallet,
      //     referralPool: this.referralWallet,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();

      // transaction.add(submitResultIx);

      // Send transaction
      const txSignature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
      await this.connection.confirmTransaction(txSignature, 'confirmed');

      this.logger.log(`Match result processed. Winner: ${winnerWallet}, Payout: ${winnerPayout / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      this.logger.error(`Failed to submit match result: ${error.message}`);
      throw new BadRequestException(`Failed to process match result: ${error.message}`);
    }
  }

  /**
   * Refund match (cancel pending match)
   */
  async refundMatch(escrowAddress: string): Promise<void> {
    try {
      const escrowPda = new PublicKey(escrowAddress);

      // Get escrow account data
      const escrowAccount = await this.connection.getAccountInfo(escrowPda);
      if (!escrowAccount) {
        throw new BadRequestException('Escrow account not found');
      }

      // Refund instruction (this would call your program)
      // const refundIx = await this.program.methods
      //   .refundMatch()
      //   .accounts({
      //     escrow: escrowPda,
      //     player1: player1, // Would need to get from escrow data
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .instruction();

      // For now, simulate refund
      this.logger.log(`Match refunded for escrow ${escrowAddress}`);
    } catch (error) {
      this.logger.error(`Failed to refund match: ${error.message}`);
      throw new BadRequestException(`Failed to refund match: ${error.message}`);
    }
  }

  /**
   * Get escrow account data
   */
  async getEscrowData(escrowAddress: string): Promise<EscrowAccount | null> {
    try {
      const escrowPda = new PublicKey(escrowAddress);
      
      // Get account data (this would deserialize your program account)
      const accountInfo = await this.connection.getAccountInfo(escrowPda);
      if (!accountInfo) {
        return null;
      }

      // For now, return mock data
      return {
        matchId: 'mock-match-id',
        player1: new PublicKey('11111111111111111111111111111111'),
        wager: accountInfo.lamports / LAMPORTS_PER_SOL / 2, // Assuming 2 players
        status: 'pending',
        createdAt: new BN(Date.now()),
      };
    } catch (error) {
      this.logger.error(`Failed to get escrow data: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify transaction signature
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });

      return transaction !== null;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${error.message}`);
      return false;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      this.logger.error(`Failed to get wallet balance: ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Withdraw from vault (for referral service)
   */
  async withdrawFromVault(vaultAddress: string, destinationAddress: string, amount: number): Promise<string> {
    try {
      const vault = new PublicKey(vaultAddress);
      const destination = new PublicKey(destinationAddress);
      const lamports = amount * LAMPORTS_PER_SOL;

      // Create withdrawal transaction
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: vault,
          toPubkey: destination,
          lamports,
        })
      );

      // Send transaction
      const signature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
      await this.connection.confirmTransaction(signature, 'confirmed');

      this.logger.log(`Withdrawal completed: ${amount} SOL from ${vaultAddress} to ${destinationAddress}`);
      return signature;
    } catch (error) {
      this.logger.error(`Failed to withdraw from vault: ${(error as Error).message}`);
      throw new BadRequestException(`Failed to withdraw from vault: ${(error as Error).message}`);
    }
  }

  /**
   * Health check - verify connection to Solana
   */
  async isHealthy(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch (error) {
      this.logger.error(`Solana health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get network stats
   */
  async getNetworkStats(): Promise<{
    slot: number;
    blockHeight: number;
    epochInfo: any;
  }> {
    try {
      const [slot, blockHeight, epochInfo] = await Promise.all([
        this.connection.getSlot(),
        this.connection.getBlockHeight(),
        this.connection.getEpochInfo(),
      ]);

      return { slot, blockHeight, epochInfo };
    } catch (error) {
      this.logger.error(`Failed to get network stats: ${error.message}`);
      throw error;
    }
  }
} 