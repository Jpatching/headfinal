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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralController = void 0;
const common_1 = require("@nestjs/common");
const referral_service_1 = require("./referral.service");
const referral_dto_1 = require("./dto/referral.dto");
const auth_service_1 = require("../auth/auth.service");
let ReferralController = class ReferralController {
    constructor(referralService, authService) {
        this.referralService = referralService;
        this.authService = authService;
    }
    async getMyReferralCode(auth) {
        const session = await this.validateSession(auth);
        return this.referralService.getMyReferralCode(session.wallet);
    }
    async applyReferralCode(auth, applyCodeDto) {
        const session = await this.validateSession(auth);
        return this.referralService.applyReferralCode(session.wallet, applyCodeDto);
    }
    async getReferredUsers(auth) {
        const session = await this.validateSession(auth);
        const referredUsers = await this.referralService.getReferredUsers(session.wallet);
        return { referredUsers };
    }
    async getSolEarnings(auth) {
        const session = await this.validateSession(auth);
        return this.referralService.getSolEarnings(session.wallet);
    }
    async claimSolRewards(auth, claimDto) {
        const session = await this.validateSession(auth);
        return this.referralService.claimSolRewards(session.wallet, claimDto);
    }
    async getSolHistory(auth) {
        const session = await this.validateSession(auth);
        const history = await this.referralService.getSolHistory(session.wallet);
        return { history };
    }
    async getReferralStats(auth) {
        const session = await this.validateSession(auth);
        const stats = await this.referralService.getReferralStats(session.wallet);
        return { stats };
    }
    async getLeaderboard() {
        const leaderboard = await this.referralService.getLeaderboard();
        return { leaderboard };
    }
    async validateSession(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const sessionId = authHeader.substring(7);
        const session = await this.authService.validateSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        return session;
    }
};
exports.ReferralController = ReferralController;
__decorate([
    (0, common_1.Get)('my-code'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getMyReferralCode", null);
__decorate([
    (0, common_1.Post)('apply-code'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, referral_dto_1.ApplyReferralCodeDto]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "applyReferralCode", null);
__decorate([
    (0, common_1.Get)('referred-users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferredUsers", null);
__decorate([
    (0, common_1.Get)('earnings-sol'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getSolEarnings", null);
__decorate([
    (0, common_1.Post)('claim-sol'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, referral_dto_1.ClaimSolRewardsDto]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "claimSolRewards", null);
__decorate([
    (0, common_1.Get)('sol-history'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getSolHistory", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getReferralStats", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReferralController.prototype, "getLeaderboard", null);
exports.ReferralController = ReferralController = __decorate([
    (0, common_1.Controller)('referrals'),
    __metadata("design:paramtypes", [referral_service_1.ReferralService,
        auth_service_1.AuthService])
], ReferralController);
//# sourceMappingURL=referral.controller.js.map