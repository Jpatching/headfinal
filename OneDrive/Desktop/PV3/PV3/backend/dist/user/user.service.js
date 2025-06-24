"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
let UserService = class UserService {
    constructor() {
        this.users = new Map();
    }
    async getProfile(walletAddress) {
        const user = this.users.get(walletAddress);
        if (!user) {
            return this.createDefaultProfile(walletAddress);
        }
        return user;
    }
    async updateProfile(walletAddress, updateProfileDto) {
        const user = await this.getProfile(walletAddress);
        if (updateProfileDto.username && updateProfileDto.username !== user.username) {
            const existingUser = Array.from(this.users.values()).find(u => u.username === updateProfileDto.username && u.walletAddress !== walletAddress);
            if (existingUser) {
                throw new common_1.BadRequestException('Username already taken');
            }
        }
        const updatedUser = {
            ...user,
            ...updateProfileDto,
            lastActive: new Date(),
        };
        this.users.set(walletAddress, updatedUser);
        return updatedUser;
    }
    async getUserStats(walletAddress) {
        const user = await this.getProfile(walletAddress);
        return user.stats;
    }
    async getUserEarnings(walletAddress) {
        return [
            {
                id: 'earning_1',
                type: 'match_win',
                amount: 1.5,
                matchId: 'match_123',
                timestamp: new Date(Date.now() - 86400000),
            },
            {
                id: 'earning_2',
                type: 'referral_bonus',
                amount: 0.1,
                referredUser: 'user_456',
                timestamp: new Date(Date.now() - 172800000),
            },
        ];
    }
    async getUserAchievements(walletAddress) {
        return [
            {
                id: 'first_win',
                name: 'First Victory',
                description: 'Win your first match',
                icon: '🏆',
                unlockedAt: new Date(Date.now() - 86400000),
            },
            {
                id: 'streak_5',
                name: 'On Fire',
                description: 'Win 5 matches in a row',
                icon: '🔥',
                unlockedAt: new Date(Date.now() - 43200000),
                progress: {
                    current: 5,
                    target: 5,
                },
            },
        ];
    }
    async getNftAvatar(walletAddress) {
        const user = await this.getProfile(walletAddress);
        if (!user.nftAvatar) {
            return null;
        }
        return {
            nftAddress: user.nftAvatar,
            imageUrl: 'https://example.com/nft-image.png',
        };
    }
    async updatePreferences(walletAddress, updatePreferencesDto) {
        const user = await this.getProfile(walletAddress);
        const updatedPreferences = {
            ...user.preferences,
            ...updatePreferencesDto,
        };
        const updatedUser = {
            ...user,
            preferences: updatedPreferences,
            lastActive: new Date(),
        };
        this.users.set(walletAddress, updatedUser);
        return updatedPreferences;
    }
    async getReputation(walletAddress) {
        const user = await this.getProfile(walletAddress);
        return {
            score: user.reputation,
            rank: this.calculateReputationRank(user.reputation),
            factors: [
                { name: 'Win Rate', value: user.stats.winRate, weight: 30 },
                { name: 'Match Volume', value: user.stats.totalMatches, weight: 20 },
                { name: 'Fair Play', value: 100, weight: 25 },
                { name: 'Community', value: 85, weight: 25 },
            ],
        };
    }
    async getBadges(walletAddress) {
        const user = await this.getProfile(walletAddress);
        return user.badges;
    }
    async updateMatchStats(walletAddress, matchResult) {
        const user = await this.getProfile(walletAddress);
        const updatedStats = {
            ...user.stats,
            totalMatches: user.stats.totalMatches + 1,
            wins: matchResult.won ? user.stats.wins + 1 : user.stats.wins,
            losses: matchResult.won ? user.stats.losses : user.stats.losses + 1,
            totalEarnings: user.stats.totalEarnings + matchResult.earnings,
            totalWagered: user.stats.totalWagered + matchResult.wager,
        };
        updatedStats.winRate = updatedStats.wins / updatedStats.totalMatches;
        updatedStats.averageWager = updatedStats.totalWagered / updatedStats.totalMatches;
        if (matchResult.won) {
            updatedStats.currentWinStreak = user.stats.currentWinStreak + 1;
            updatedStats.longestWinStreak = Math.max(updatedStats.longestWinStreak, updatedStats.currentWinStreak);
        }
        else {
            updatedStats.currentWinStreak = 0;
        }
        const updatedUser = {
            ...user,
            stats: updatedStats,
            reputation: this.calculateReputation(updatedStats),
            lastActive: new Date(),
        };
        this.users.set(walletAddress, updatedUser);
        await this.checkAndUnlockAchievements(walletAddress, updatedStats);
    }
    createDefaultProfile(walletAddress) {
        const defaultProfile = {
            walletAddress,
            createdAt: new Date(),
            lastActive: new Date(),
            reputation: 50,
            level: 1,
            stats: {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalEarnings: 0,
                totalWagered: 0,
                averageWager: 0,
                longestWinStreak: 0,
                currentWinStreak: 0,
                rank: 0,
                badges: [],
            },
            preferences: {
                gamePreferences: {
                    favoriteGames: [],
                    preferredWagerRange: { min: 0.1, max: 10 },
                },
                notificationSettings: {
                    matchInvites: true,
                    tournamentUpdates: true,
                    earnings: true,
                    marketing: false,
                },
            },
            badges: [],
        };
        this.users.set(walletAddress, defaultProfile);
        return defaultProfile;
    }
    calculateReputationRank(reputation) {
        if (reputation >= 90)
            return 'Legendary';
        if (reputation >= 80)
            return 'Expert';
        if (reputation >= 70)
            return 'Veteran';
        if (reputation >= 60)
            return 'Skilled';
        if (reputation >= 50)
            return 'Novice';
        return 'Rookie';
    }
    calculateReputation(stats) {
        let reputation = 50;
        reputation += stats.winRate * 25;
        reputation += Math.min(stats.totalMatches / 100, 1) * 15;
        if (stats.totalMatches > 10) {
            const consistency = 1 - Math.abs(0.5 - stats.winRate);
            reputation += consistency * 10;
        }
        return Math.min(Math.max(reputation, 0), 100);
    }
    async checkAndUnlockAchievements(walletAddress, stats) {
        const user = this.users.get(walletAddress);
        if (!user)
            return;
        const newBadges = [];
        if (stats.wins === 1 && !user.badges.includes('first_win')) {
            newBadges.push('first_win');
        }
        if (stats.currentWinStreak >= 5 && !user.badges.includes('streak_5')) {
            newBadges.push('streak_5');
        }
        if (stats.currentWinStreak >= 10 && !user.badges.includes('streak_10')) {
            newBadges.push('streak_10');
        }
        if (stats.totalMatches >= 100 && !user.badges.includes('volume_100')) {
            newBadges.push('volume_100');
        }
        if (stats.totalEarnings >= 10 && !user.badges.includes('earnings_10')) {
            newBadges.push('earnings_10');
        }
        if (newBadges.length > 0) {
            user.badges.push(...newBadges);
            this.users.set(walletAddress, user);
        }
    }
    async getMatchHistory(walletAddress) {
        return [
            {
                matchId: 'match_123',
                gameId: 'rps',
                opponent: 'Opponent1...xyz',
                result: 'won',
                wager: 0.5,
                earnings: 0.97,
                timestamp: new Date(Date.now() - 3600000),
            },
            {
                matchId: 'match_124',
                gameId: 'coinflip',
                opponent: 'Opponent2...abc',
                result: 'lost',
                wager: 0.3,
                earnings: 0,
                timestamp: new Date(Date.now() - 7200000),
            },
        ];
    }
    async searchUsers(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return Array.from(this.users.values())
            .filter(user => user.username?.toLowerCase().includes(searchLower) ||
            user.walletAddress.toLowerCase().includes(searchLower))
            .slice(0, 10);
    }
    async getActivityFeed(walletAddress) {
        return [
            {
                type: 'match_completed',
                description: 'Won match against Opponent1...xyz',
                timestamp: new Date(Date.now() - 1800000),
                details: { earnings: 0.97 },
            },
            {
                type: 'achievement_unlocked',
                description: 'Unlocked "5 Win Streak" badge',
                timestamp: new Date(Date.now() - 3600000),
                details: { badge: 'streak_5' },
            },
        ];
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map