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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
let LeaderboardService = class LeaderboardService {
    constructor(userService) {
        this.userService = userService;
    }
    async getEarningsLeaderboard() {
        return [
            { walletAddress: 'user1', totalEarnings: 100.5, rank: 1 },
            { walletAddress: 'user2', totalEarnings: 85.2, rank: 2 },
            { walletAddress: 'user3', totalEarnings: 72.8, rank: 3 },
        ];
    }
    async getWinsLeaderboard() {
        return [
            { walletAddress: 'user1', wins: 150, rank: 1 },
            { walletAddress: 'user2', wins: 128, rank: 2 },
            { walletAddress: 'user3', wins: 95, rank: 3 },
        ];
    }
    async getWinrateLeaderboard() {
        return [
            { walletAddress: 'user1', winRate: 0.85, totalMatches: 200, rank: 1 },
            { walletAddress: 'user2', winRate: 0.82, totalMatches: 150, rank: 2 },
            { walletAddress: 'user3', winRate: 0.78, totalMatches: 180, rank: 3 },
        ];
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map