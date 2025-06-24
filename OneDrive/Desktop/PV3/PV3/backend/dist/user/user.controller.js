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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const user_dto_1 = require("./dto/user.dto");
const auth_service_1 = require("../auth/auth.service");
let UserController = class UserController {
    constructor(userService, authService) {
        this.userService = userService;
        this.authService = authService;
    }
    async getProfile(wallet) {
        const profile = await this.userService.getProfile(wallet);
        return { profile };
    }
    async updateProfile(auth, updateProfileDto) {
        const session = await this.validateSession(auth);
        const profile = await this.userService.updateProfile(session.wallet, updateProfileDto);
        return { profile };
    }
    async getUserStats(wallet) {
        const stats = await this.userService.getUserStats(wallet);
        return { stats };
    }
    async getUserEarnings(wallet) {
        const earnings = await this.userService.getUserEarnings(wallet);
        return { earnings };
    }
    async getUserAchievements(wallet) {
        const achievements = await this.userService.getUserAchievements(wallet);
        return { achievements };
    }
    async getNftAvatar(wallet) {
        const nftAvatar = await this.userService.getNftAvatar(wallet);
        return { nftAvatar };
    }
    async updatePreferences(auth, updatePreferencesDto) {
        const session = await this.validateSession(auth);
        const preferences = await this.userService.updatePreferences(session.wallet, updatePreferencesDto);
        return { preferences };
    }
    async getReputation(auth) {
        const session = await this.validateSession(auth);
        const reputation = await this.userService.getReputation(session.wallet);
        return { reputation };
    }
    async getBadges(auth) {
        const session = await this.validateSession(auth);
        const badges = await this.userService.getBadges(session.wallet);
        return { badges };
    }
    async getMatchHistory(wallet) {
        const history = await this.userService.getMatchHistory(wallet);
        return { history };
    }
    async searchUsers(query) {
        const users = await this.userService.searchUsers(query.searchTerm);
        return { users };
    }
    async getActivityFeed(wallet) {
        const activities = await this.userService.getActivityFeed(wallet);
        return { activities };
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
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)(':wallet'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)(':wallet/stats'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)(':wallet/earnings'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserEarnings", null);
__decorate([
    (0, common_1.Get)(':wallet/achievements'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserAchievements", null);
__decorate([
    (0, common_1.Get)(':wallet/nft-avatar'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getNftAvatar", null);
__decorate([
    (0, common_1.Put)('preferences'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdatePreferencesDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('reputation'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getReputation", null);
__decorate([
    (0, common_1.Get)('badges'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getBadges", null);
__decorate([
    (0, common_1.Get)(':wallet/match-history'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMatchHistory", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)(':wallet/activity'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getActivityFeed", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        auth_service_1.AuthService])
], UserController);
//# sourceMappingURL=user.controller.js.map