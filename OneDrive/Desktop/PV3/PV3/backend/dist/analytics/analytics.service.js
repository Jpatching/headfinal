"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_dto_1 = require("./dto/analytics.dto");
let AnalyticsService = class AnalyticsService {
    constructor() {
        this.mockData = {
            totalUsers: 15420,
            totalMatches: 42180,
            totalVolume: 1247.89,
            totalRevenue: 81.11,
            monthlyGrowth: {
                users: 23.4,
                revenue: 31.2,
                matches: 28.7,
            }
        };
    }
    async getRevenueMetrics(query) {
        const baseRevenue = this.getBaseRevenueForTimeRange(query.timeRange || analytics_dto_1.TimeRange.DAY);
        return {
            totalRevenue: baseRevenue,
            platformFees: baseRevenue * 0.846,
            referralPayouts: baseRevenue * 0.154,
            netRevenue: baseRevenue * 0.846,
            transactionCount: Math.floor(baseRevenue * 15.6),
            averageTransactionValue: 0.064,
            revenueByGame: this.getMockGameRevenue(),
            revenueByHour: this.getMockHourlyRevenue(),
        };
    }
    async getUserActivityMetrics(query) {
        const timeMultiplier = this.getTimeMultiplier(query.timeRange || analytics_dto_1.TimeRange.DAY);
        return {
            totalUsers: Math.floor(this.mockData.totalUsers * timeMultiplier),
            activeUsers: Math.floor(this.mockData.totalUsers * 0.12 * timeMultiplier),
            newUsers: Math.floor(this.mockData.totalUsers * 0.03 * timeMultiplier),
            returningUsers: Math.floor(this.mockData.totalUsers * 0.09 * timeMultiplier),
            dailyActiveUsers: this.getMockDailyActiveUsers(),
            userRetention: {
                day1: 0.67,
                day7: 0.34,
                day30: 0.18,
            },
            avgSessionDuration: 847,
            avgMatchesPerUser: 2.7,
        };
    }
    async getGamePerformanceMetrics(query) {
        const timeMultiplier = this.getTimeMultiplier(query.timeRange || analytics_dto_1.TimeRange.DAY);
        return {
            totalMatches: Math.floor(this.mockData.totalMatches * timeMultiplier),
            averageMatchDuration: 312,
            completionRate: 0.934,
            disputeRate: 0.023,
            popularGames: this.getMockPopularGames(),
            peakHours: this.getMockPeakHours(),
        };
    }
    async getReferralMetrics(query) {
        const timeMultiplier = this.getTimeMultiplier(query.timeRange || analytics_dto_1.TimeRange.DAY);
        return {
            totalReferrals: Math.floor(234 * timeMultiplier),
            activeReferrers: Math.floor(89 * timeMultiplier),
            totalReferralRevenue: 12.47 * timeMultiplier,
            averageReferralValue: 0.053,
            topReferrers: this.getMockTopReferrers(),
            conversionRate: 0.78,
        };
    }
    async getPlatformOverview(query) {
        return {
            totalUsers: this.mockData.totalUsers,
            totalMatches: this.mockData.totalMatches,
            totalVolume: this.mockData.totalVolume,
            totalRevenue: this.mockData.totalRevenue,
            growthRate: this.mockData.monthlyGrowth,
            healthScore: 0.87,
        };
    }
    async getCustomMetrics(query) {
        const timeRange = query.timeRange || analytics_dto_1.TimeRange.DAY;
        return {
            query,
            timeRange,
            customData: {
                peakConcurrentUsers: 423,
                averageWaitTime: 4.2,
                serverUptime: 0.9987,
                errorRate: 0.0008,
                avgResponseTime: 67,
            },
            generated: new Date(),
        };
    }
    getBaseRevenueForTimeRange(timeRange) {
        const baseDaily = 2.84;
        switch (timeRange) {
            case analytics_dto_1.TimeRange.HOUR:
                return baseDaily / 24;
            case analytics_dto_1.TimeRange.DAY:
                return baseDaily;
            case analytics_dto_1.TimeRange.WEEK:
                return baseDaily * 7;
            case analytics_dto_1.TimeRange.MONTH:
                return baseDaily * 30;
            case analytics_dto_1.TimeRange.QUARTER:
                return baseDaily * 90;
            case analytics_dto_1.TimeRange.YEAR:
                return baseDaily * 365;
            default:
                return baseDaily;
        }
    }
    getTimeMultiplier(timeRange) {
        switch (timeRange) {
            case analytics_dto_1.TimeRange.HOUR:
                return 1 / 24;
            case analytics_dto_1.TimeRange.DAY:
                return 1;
            case analytics_dto_1.TimeRange.WEEK:
                return 7;
            case analytics_dto_1.TimeRange.MONTH:
                return 30;
            case analytics_dto_1.TimeRange.QUARTER:
                return 90;
            case analytics_dto_1.TimeRange.YEAR:
                return 365;
            default:
                return 1;
        }
    }
    getMockGameRevenue() {
        return [
            {
                gameId: 'game_rps',
                gameName: 'Rock Paper Scissors',
                totalVolume: 89.34,
                matchCount: 1247,
                revenue: 5.81,
                averageMatchValue: 0.072,
            },
            {
                gameId: 'game_ttt',
                gameName: 'Tic Tac Toe',
                totalVolume: 56.78,
                matchCount: 892,
                revenue: 3.69,
                averageMatchValue: 0.064,
            },
            {
                gameId: 'game_coinflip',
                gameName: 'Coin Flip',
                totalVolume: 123.45,
                matchCount: 2891,
                revenue: 8.02,
                averageMatchValue: 0.043,
            },
        ];
    }
    getMockHourlyRevenue() {
        const hours = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
            hours.push({
                hour: hour.toISOString(),
                revenue: Math.random() * 0.5 + 0.05,
                transactionCount: Math.floor(Math.random() * 50 + 5),
            });
        }
        return hours;
    }
    getMockDailyActiveUsers() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            days.push(Math.floor(Math.random() * 200 + 800));
        }
        return days;
    }
    getMockPopularGames() {
        return [
            {
                gameId: 'game_coinflip',
                gameName: 'Coin Flip',
                matchCount: 2891,
                totalVolume: 123.45,
                averageRating: 4.2,
                uniquePlayers: 1247,
            },
            {
                gameId: 'game_rps',
                gameName: 'Rock Paper Scissors',
                matchCount: 1247,
                totalVolume: 89.34,
                averageRating: 4.5,
                uniquePlayers: 892,
            },
            {
                gameId: 'game_ttt',
                gameName: 'Tic Tac Toe',
                matchCount: 892,
                totalVolume: 56.78,
                averageRating: 4.1,
                uniquePlayers: 634,
            },
        ];
    }
    getMockPeakHours() {
        return [
            { hour: 20, matchCount: 145, activeUsers: 423 },
            { hour: 21, matchCount: 132, activeUsers: 398 },
            { hour: 19, matchCount: 128, activeUsers: 387 },
            { hour: 22, matchCount: 98, activeUsers: 312 },
            { hour: 18, matchCount: 87, activeUsers: 289 },
        ];
    }
    getMockTopReferrers() {
        return [
            {
                walletAddress: 'Ref1...xyz',
                referralCount: 34,
                totalEarnings: 2.14,
                conversionRate: 0.89,
            },
            {
                walletAddress: 'Ref2...abc',
                referralCount: 28,
                totalEarnings: 1.67,
                conversionRate: 0.82,
            },
            {
                walletAddress: 'Ref3...def',
                referralCount: 23,
                totalEarnings: 1.45,
                conversionRate: 0.76,
            },
        ];
    }
    trackEvent(eventType, data) {
        console.log(`📊 Analytics Event: ${eventType}`, data);
    }
    trackUserAction(walletAddress, action, metadata) {
        this.trackEvent('user_action', {
            walletAddress,
            action,
            metadata,
            timestamp: new Date(),
        });
    }
    trackTransaction(from, to, amount, type) {
        this.trackEvent('transaction', {
            from,
            to,
            amount,
            type,
            timestamp: new Date(),
        });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)()
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map