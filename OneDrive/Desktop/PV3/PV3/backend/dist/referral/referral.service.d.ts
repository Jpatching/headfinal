import { SolanaService } from '../solana/solana.service';
import { ApplyReferralCodeDto, ClaimSolRewardsDto, ReferralEarning, ReferralStats } from './dto/referral.dto';
export declare class ReferralService {
    private readonly solanaService;
    private referrals;
    private earnings;
    constructor(solanaService: SolanaService);
    getMyReferralCode(walletAddress: string): Promise<{
        referralCode: string;
    }>;
    applyReferralCode(walletAddress: string, applyCodeDto: ApplyReferralCodeDto): Promise<{
        success: boolean;
        referrer: string;
    }>;
    getReferredUsers(walletAddress: string): Promise<any[]>;
    getSolEarnings(walletAddress: string): Promise<{
        totalEarnings: number;
        pendingEarnings: number;
        claimedEarnings: number;
    }>;
    claimSolRewards(walletAddress: string, claimDto: ClaimSolRewardsDto): Promise<{
        success: boolean;
        transactionId: string;
        amount: number;
    }>;
    getSolHistory(walletAddress: string): Promise<ReferralEarning[]>;
    getReferralStats(walletAddress: string): Promise<ReferralStats>;
    getLeaderboard(): Promise<any[]>;
    processReferralReward(userWallet: string, matchId: string, platformFee: number): Promise<void>;
    private generateReferralCode;
    private calculateReferralRank;
}
