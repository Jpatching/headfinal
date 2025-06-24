"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SolanaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const anchor = __importStar(require("@project-serum/anchor"));
let SolanaService = SolanaService_1 = class SolanaService {
    constructor() {
        this.logger = new common_1.Logger(SolanaService_1.name);
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKeyString) {
            throw new Error('SOLANA_PRIVATE_KEY environment variable is required');
        }
        const privateKeyBytes = JSON.parse(privateKeyString);
        const keypair = web3_js_1.Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
        this.wallet = new anchor_1.Wallet(keypair);
        this.treasuryWallet = new web3_js_1.PublicKey(process.env.TREASURY_WALLET || keypair.publicKey.toString());
        this.referralWallet = new web3_js_1.PublicKey(process.env.REFERRAL_WALLET || keypair.publicKey.toString());
        const provider = new anchor_1.AnchorProvider(this.connection, this.wallet, {
            commitment: 'confirmed',
        });
        anchor.setProvider(provider);
        const programId = new web3_js_1.PublicKey(process.env.PV3_PROGRAM_ID || 'PV3ProgramId11111111111111111111111111111111');
        this.logger.log('Solana service initialized');
    }
    async createMatchEscrow(matchId, playerWallet, wager) {
        try {
            const player = new web3_js_1.PublicKey(playerWallet);
            const wagerLamports = wager * web3_js_1.LAMPORTS_PER_SOL;
            const [escrowPda] = await web3_js_1.PublicKey.findProgramAddress([
                Buffer.from('match_escrow'),
                Buffer.from(matchId),
            ], this.program?.programId || new web3_js_1.PublicKey('PV3ProgramId11111111111111111111111111111111'));
            const createEscrowIx = web3_js_1.SystemProgram.createAccount({
                fromPubkey: this.wallet.publicKey,
                newAccountPubkey: escrowPda,
                lamports: await this.connection.getMinimumBalanceForRentExemption(1000),
                space: 1000,
                programId: this.program?.programId || new web3_js_1.PublicKey('PV3ProgramId11111111111111111111111111111111'),
            });
            const transaction = new web3_js_1.Transaction();
            transaction.add(createEscrowIx);
            const signature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
            await this.connection.confirmTransaction(signature, 'confirmed');
            this.logger.log(`Escrow created for match ${matchId}: ${escrowPda.toString()}`);
            return escrowPda.toString();
        }
        catch (error) {
            this.logger.error(`Failed to create escrow: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to create match escrow: ${error.message}`);
        }
    }
    async joinMatch(escrowAddress, playerWallet, wager) {
        try {
            const escrowPda = new web3_js_1.PublicKey(escrowAddress);
            const player = new web3_js_1.PublicKey(playerWallet);
            const wagerLamports = wager * web3_js_1.LAMPORTS_PER_SOL;
            const transferIx = web3_js_1.SystemProgram.transfer({
                fromPubkey: player,
                toPubkey: escrowPda,
                lamports: wagerLamports,
            });
            const transaction = new web3_js_1.Transaction();
            transaction.add(transferIx);
            this.logger.log(`Player ${playerWallet} joined match with escrow ${escrowAddress}`);
        }
        catch (error) {
            this.logger.error(`Failed to join match: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to join match: ${error.message}`);
        }
    }
    async submitMatchResult(escrowAddress, winnerWallet, signature) {
        try {
            const escrowPda = new web3_js_1.PublicKey(escrowAddress);
            const winner = new web3_js_1.PublicKey(winnerWallet);
            const escrowAccount = await this.connection.getAccountInfo(escrowPda);
            if (!escrowAccount) {
                throw new common_1.BadRequestException('Escrow account not found');
            }
            const totalBalance = escrowAccount.lamports;
            const platformFee = Math.floor(totalBalance * 0.065);
            const treasuryFee = Math.floor(platformFee * 0.846);
            const referralFee = Math.floor(platformFee * 0.154);
            const winnerPayout = totalBalance - platformFee;
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.SystemProgram.transfer({
                fromPubkey: escrowPda,
                toPubkey: winner,
                lamports: winnerPayout,
            }));
            transaction.add(web3_js_1.SystemProgram.transfer({
                fromPubkey: escrowPda,
                toPubkey: this.treasuryWallet,
                lamports: treasuryFee,
            }));
            transaction.add(web3_js_1.SystemProgram.transfer({
                fromPubkey: escrowPda,
                toPubkey: this.referralWallet,
                lamports: referralFee,
            }));
            const txSignature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
            await this.connection.confirmTransaction(txSignature, 'confirmed');
            this.logger.log(`Match result processed. Winner: ${winnerWallet}, Payout: ${winnerPayout / web3_js_1.LAMPORTS_PER_SOL} SOL`);
        }
        catch (error) {
            this.logger.error(`Failed to submit match result: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to process match result: ${error.message}`);
        }
    }
    async refundMatch(escrowAddress) {
        try {
            const escrowPda = new web3_js_1.PublicKey(escrowAddress);
            const escrowAccount = await this.connection.getAccountInfo(escrowPda);
            if (!escrowAccount) {
                throw new common_1.BadRequestException('Escrow account not found');
            }
            this.logger.log(`Match refunded for escrow ${escrowAddress}`);
        }
        catch (error) {
            this.logger.error(`Failed to refund match: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to refund match: ${error.message}`);
        }
    }
    async getEscrowData(escrowAddress) {
        try {
            const escrowPda = new web3_js_1.PublicKey(escrowAddress);
            const accountInfo = await this.connection.getAccountInfo(escrowPda);
            if (!accountInfo) {
                return null;
            }
            return {
                matchId: 'mock-match-id',
                player1: new web3_js_1.PublicKey('11111111111111111111111111111111'),
                wager: accountInfo.lamports / web3_js_1.LAMPORTS_PER_SOL / 2,
                status: 'pending',
                createdAt: new anchor_1.BN(Date.now()),
            };
        }
        catch (error) {
            this.logger.error(`Failed to get escrow data: ${error.message}`);
            return null;
        }
    }
    async verifyTransaction(signature) {
        try {
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
            });
            return transaction !== null;
        }
        catch (error) {
            this.logger.error(`Failed to verify transaction: ${error.message}`);
            return false;
        }
    }
    async getWalletBalance(walletAddress) {
        try {
            const publicKey = new web3_js_1.PublicKey(walletAddress);
            const balance = await this.connection.getBalance(publicKey);
            return balance / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (error) {
            this.logger.error(`Failed to get wallet balance: ${error.message}`);
            return 0;
        }
    }
    async withdrawFromVault(vaultAddress, destinationAddress, amount) {
        try {
            const vault = new web3_js_1.PublicKey(vaultAddress);
            const destination = new web3_js_1.PublicKey(destinationAddress);
            const lamports = amount * web3_js_1.LAMPORTS_PER_SOL;
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.SystemProgram.transfer({
                fromPubkey: vault,
                toPubkey: destination,
                lamports,
            }));
            const signature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
            await this.connection.confirmTransaction(signature, 'confirmed');
            this.logger.log(`Withdrawal completed: ${amount} SOL from ${vaultAddress} to ${destinationAddress}`);
            return signature;
        }
        catch (error) {
            this.logger.error(`Failed to withdraw from vault: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to withdraw from vault: ${error.message}`);
        }
    }
    async isHealthy() {
        try {
            const slot = await this.connection.getSlot();
            return slot > 0;
        }
        catch (error) {
            this.logger.error(`Solana health check failed: ${error.message}`);
            return false;
        }
    }
    async getNetworkStats() {
        try {
            const [slot, blockHeight, epochInfo] = await Promise.all([
                this.connection.getSlot(),
                this.connection.getBlockHeight(),
                this.connection.getEpochInfo(),
            ]);
            return { slot, blockHeight, epochInfo };
        }
        catch (error) {
            this.logger.error(`Failed to get network stats: ${error.message}`);
            throw error;
        }
    }
};
exports.SolanaService = SolanaService;
exports.SolanaService = SolanaService = SolanaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SolanaService);
//# sourceMappingURL=solana.service.js.map