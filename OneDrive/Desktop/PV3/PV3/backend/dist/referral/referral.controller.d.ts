import { ReferralService } from './referral.service';
import { ApplyReferralCodeDto, ClaimSolRewardsDto } from './dto/referral.dto';
import { AuthService } from '../auth/auth.service';
export declare class ReferralController {
    private readonly referralService;
    private readonly authService;
    constructor(referralService: ReferralService, authService: AuthService);
    getMyReferralCode(auth: string): Promise<{
        referralCode: string;
    }>;
    applyReferralCode(auth: string, applyCodeDto: ApplyReferralCodeDto): Promise<{
        success: boolean;
        referrer: string;
    }>;
    getReferredUsers(auth: string): Promise<{
        referredUsers: any[];
    }>;
    getSolEarnings(auth: string): Promise<{
        totalEarnings: number;
        pendingEarnings: number;
        claimedEarnings: number;
    }>;
    claimSolRewards(auth: string, claimDto: ClaimSolRewardsDto): Promise<{
        success: boolean;
        transactionId: string;
        amount: number;
    }>;
    getSolHistory(auth: string): Promise<{
        history: import("./dto/referral.dto").ReferralEarning[];
    }>;
    getReferralStats(auth: string): Promise<{
        stats: import("./dto/referral.dto").ReferralStats;
    }>;
    getLeaderboard(): Promise<{
        leaderboard: any[];
    }>;
    private validateSession;
}
