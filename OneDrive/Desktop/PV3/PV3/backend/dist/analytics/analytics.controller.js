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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const analytics_dto_1 = require("./dto/analytics.dto");
const auth_service_1 = require("../auth/auth.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, authService) {
        this.analyticsService = analyticsService;
        this.authService = authService;
    }
    async getRevenueMetrics(auth, query) {
        this.validateSession(auth);
        const metrics = await this.analyticsService.getRevenueMetrics(query);
        return { metrics };
    }
    async getUserActivityMetrics(auth, query) {
        this.validateSession(auth);
        const metrics = await this.analyticsService.getUserActivityMetrics(query);
        return { metrics };
    }
    async getGamePerformanceMetrics(auth, query) {
        this.validateSession(auth);
        const metrics = await this.analyticsService.getGamePerformanceMetrics(query);
        return { metrics };
    }
    async getReferralMetrics(auth, query) {
        this.validateSession(auth);
        const metrics = await this.analyticsService.getReferralMetrics(query);
        return { metrics };
    }
    async getPlatformOverview(auth, query) {
        this.validateSession(auth);
        const overview = await this.analyticsService.getPlatformOverview(query);
        return { overview };
    }
    async getCustomMetrics(auth, query) {
        this.validateSession(auth);
        const metrics = await this.analyticsService.getCustomMetrics(query);
        return { metrics };
    }
    async getPublicStats() {
        const overview = await this.analyticsService.getPlatformOverview({});
        return {
            stats: {
                totalUsers: overview.totalUsers,
                totalMatches: overview.totalMatches,
                totalVolume: overview.totalVolume,
                healthScore: overview.healthScore,
            }
        };
    }
    validateSession(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const sessionId = authHeader.substring(7);
        const session = this.authService.validateSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        return session;
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('revenue'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRevenueMetrics", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserActivityMetrics", null);
__decorate([
    (0, common_1.Get)('games'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getGamePerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('referrals'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getReferralMetrics", null);
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPlatformOverview", null);
__decorate([
    (0, common_1.Get)('custom'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCustomMetrics", null);
__decorate([
    (0, common_1.Get)('public/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPublicStats", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        auth_service_1.AuthService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map