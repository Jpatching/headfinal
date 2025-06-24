"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const solana_service_1 = require("../solana/solana.service");
let ReferralService = class ReferralService {
    constructor(solanaService) {
        this.solanaService = solanaService;
        this.referrals = new Map();
        this.earnings = new Map();
    }
    async getMyReferralCode(walletAddress) {
        let referralInfo = this.referrals.get(walletAddress);
        if (!referralInfo) {
            const referralCode = this.generateReferralCode(walletAddress);
            referralInfo = {
                referralCode,
                referredUsers: [],
                totalEarnings: 0,
                pendingEarnings: 0,
                claimedEarnings: 0,
                referralCount: 0,
                isActive: true,
            };
            this.referrals.set(walletAddress, referralInfo);
        }
        return { referralCode: referralInfo.referralCode };
    }
    async applyReferralCode(walletAddress, applyCodeDto) {
        const { referralCode } = applyCodeDto;
        const referrer = Array.from(this.referrals.entries()).find(([_, info]) => info.referralCode === referralCode);
        if (!referrer) {
            throw new common_1.BadRequestException('Invalid referral code');
        }
        const [referrerWallet, referrerInfo] = referrer;
        if (referrerWallet === walletAddress) {
            throw new common_1.BadRequestException('Cannot use your own referral code');
        }
        const userReferralInfo = this.referrals.get(walletAddress);
        if (userReferralInfo?.referredBy) {
            throw new common_1.BadRequestException('User is already referred by someone else');
        }
        if (!userReferralInfo) {
            this.referrals.set(walletAddress, {
                referralCode: this.generateReferralCode(walletAddress),
                referredBy: referrerWallet,
                referredUsers: [],
                totalEarnings: 0,
                pendingEarnings: 0,
                claimedEarnings: 0,
                referralCount: 0,
                isActive: true,
            });
        }
        else {
            userReferralInfo.referredBy = referrerWallet;
        }
        referrerInfo.referredUsers.push(walletAddress);
        referrerInfo.referralCount = referrerInfo.referredUsers.length;
        return { success: true, referrer: referrerWallet };
    }
    async getReferredUsers(walletAddress) {
        const referralInfo = this.referrals.get(walletAddress);
        if (!referralInfo) {
            return [];
        }
        return referralInfo.referredUsers.map(userWallet => ({
            walletAddress: userWallet,
            joinedAt: new Date(),
            totalMatches: Math.floor(Math.random() * 50),
            status: 'active',
        }));
    }
    async getSolEarnings(walletAddress) {
        const referralInfo = this.referrals.get(walletAddress);
        if (!referralInfo) {
            return { totalEarnings: 0, pendingEarnings: 0, claimedEarnings: 0 };
        }
        return {
            totalEarnings: referralInfo.totalEarnings,
            pendingEarnings: referralInfo.pendingEarnings,
            claimedEarnings: referralInfo.claimedEarnings,
        };
    }
    async claimSolRewards(walletAddress, claimDto) {
        const referralInfo = this.referrals.get(walletAddress);
        if (!referralInfo) {
            throw new common_1.NotFoundException('No referral information found');
        }
        if (referralInfo.pendingEarnings <= 0) {
            throw new common_1.BadRequestException('No pending earnings to claim');
        }
        try {
            const transactionId = await this.solanaService.withdrawFromVault('platform_referral_vault', claimDto.destinationWallet, referralInfo.pendingEarnings);
            const claimedAmount = referralInfo.pendingEarnings;
            referralInfo.claimedEarnings += claimedAmount;
            referralInfo.pendingEarnings = 0;
            const userEarnings = this.earnings.get(walletAddress) || [];
            userEarnings.forEach(earning => {
                if (!earning.claimed) {
                    earning.claimed = true;
                    earning.transactionSignature = transactionId;
                }
            });
            return {
                success: true,
                transactionId,
                amount: claimedAmount,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to claim SOL rewards');
        }
    }
    async getSolHistory(walletAddress) {
        return this.earnings.get(walletAddress) || [];
    }
    async getReferralStats(walletAddress) {
        const referralInfo = this.referrals.get(walletAddress);
        if (!referralInfo) {
            return {
                totalReferrals: 0,
                activeReferrals: 0,
                totalEarnings: 0,
                pendingClaims: 0,
                averageEarningPerReferral: 0,
                rank: 0,
            };
        }
        return {
            totalReferrals: referralInfo.referralCount,
            activeReferrals: referralInfo.referredUsers.length,
            totalEarnings: referralInfo.totalEarnings,
            pendingClaims: referralInfo.pendingEarnings,
            averageEarningPerReferral: referralInfo.referralCount > 0
                ? referralInfo.totalEarnings / referralInfo.referralCount
                : 0,
            rank: this.calculateReferralRank(walletAddress),
        };
    }
    async getLeaderboard() {
        const leaderboard = Array.from(this.referrals.entries())
            .map(([wallet, info]) => ({
            walletAddress: wallet,
            referralCount: info.referralCount,
            totalEarnings: info.totalEarnings,
        }))
            .sort((a, b) => b.totalEarnings - a.totalEarnings)
            .slice(0, 50);
        return leaderboard;
    }
    async processReferralReward(userWallet, matchId, platformFee) {
        const userReferralInfo = this.referrals.get(userWallet);
        if (!userReferralInfo?.referredBy) {
            return;
        }
        const referrerWallet = userReferralInfo.referredBy;
        const referrerInfo = this.referrals.get(referrerWallet);
        if (!referrerInfo) {
            return;
        }
        const referralReward = platformFee * 0.01;
        referrerInfo.totalEarnings += referralReward;
        referrerInfo.pendingEarnings += referralReward;
        const referrerEarnings = this.earnings.get(referrerWallet) || [];
        referrerEarnings.push({
            id: `earning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            referredUser: userWallet,
            amount: referralReward,
            matchId,
            timestamp: new Date(),
            claimed: false,
        });
        this.earnings.set(referrerWallet, referrerEarnings);
        console.log(`💰 Referral reward: ${referralReward} SOL to ${referrerWallet} for referring ${userWallet}`);
    }
    generateReferralCode(walletAddress) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 4);
        return `PV3${timestamp.substr(-4)}${random}`.toUpperCase();
    }
    calculateReferralRank(walletAddress) {
        const allReferrals = Array.from(this.referrals.values())
            .sort((a, b) => b.totalEarnings - a.totalEarnings);
        const userReferral = this.referrals.get(walletAddress);
        if (!userReferral)
            return 0;
        return allReferrals.findIndex(r => r.referralCode === userReferral.referralCode) + 1;
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [solana_service_1.SolanaService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map