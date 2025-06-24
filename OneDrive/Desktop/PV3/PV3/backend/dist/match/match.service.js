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
var MatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const solana_service_1 = require("../solana/solana.service");
const verifier_service_1 = require("../verifier/verifier.service");
let MatchService = MatchService_1 = class MatchService {
    constructor(prisma, solanaService, verifierService) {
        this.prisma = prisma;
        this.solanaService = solanaService;
        this.verifierService = verifierService;
        this.logger = new common_1.Logger(MatchService_1.name);
        this.SUPPORTED_GAMES = ['coin_flip', 'rock_paper_scissors', 'dice_roll'];
        this.MIN_WAGER = 0.01;
        this.MAX_WAGER = 10.0;
        this.DEFAULT_EXPIRY_MINUTES = 30;
    }
    async createMatch(userId, dto) {
        try {
            if (!this.SUPPORTED_GAMES.includes(dto.gameType)) {
                throw new common_1.BadRequestException(`Unsupported game type: ${dto.gameType}`);
            }
            if (dto.wager < this.MIN_WAGER || dto.wager > this.MAX_WAGER) {
                throw new common_1.BadRequestException(`Wager must be between ${this.MIN_WAGER} and ${this.MAX_WAGER} SOL`);
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const pendingMatch = await this.prisma.match.findFirst({
                where: {
                    player1Id: userId,
                    status: 'pending',
                },
            });
            if (pendingMatch) {
                throw new common_1.BadRequestException('You already have a pending match. Cancel it first or wait for someone to join.');
            }
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + (dto.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES));
            const match = await this.prisma.match.create({
                data: {
                    gameType: dto.gameType,
                    wager: dto.wager,
                    status: 'pending',
                    player1Id: userId,
                    gameData: {
                        expiryTime: expiryTime.toISOString(),
                        created: new Date().toISOString(),
                    },
                },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            const escrowAddress = await this.solanaService.createMatchEscrow(match.id, user.wallet, dto.wager);
            const updatedMatch = await this.prisma.match.update({
                where: { id: match.id },
                data: { escrowAddress },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            this.logger.log(`Match created: ${match.id} by ${user.wallet}`);
            return this.formatMatchResponse(updatedMatch);
        }
        catch (error) {
            this.logger.error(`Failed to create match: ${error.message}`);
            throw error;
        }
    }
    async joinMatch(userId, dto) {
        try {
            const match = await this.prisma.match.findUnique({
                where: { id: dto.matchId },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            if (!match) {
                throw new common_1.NotFoundException('Match not found');
            }
            if (match.status !== 'pending') {
                throw new common_1.BadRequestException('Match is not available for joining');
            }
            if (match.player1Id === userId) {
                throw new common_1.BadRequestException('Cannot join your own match');
            }
            const gameData = match.gameData;
            const expiryTime = new Date(gameData?.expiryTime);
            if (new Date() > expiryTime) {
                await this.cancelMatch(match.player1Id, dto.matchId);
                throw new common_1.BadRequestException('Match has expired');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.solanaService.joinMatch(match.escrowAddress, user.wallet, match.wager);
            const updatedMatch = await this.prisma.match.update({
                where: { id: dto.matchId },
                data: {
                    player2Id: userId,
                    status: 'in_progress',
                    startedAt: new Date(),
                    gameData: Object.assign({}, match.gameData || {}, { joined: new Date().toISOString() }),
                },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                    player2: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            this.logger.log(`Match joined: ${match.id} by ${user.wallet}`);
            return this.formatMatchResponse(updatedMatch);
        }
        catch (error) {
            this.logger.error(`Failed to join match: ${error.message}`);
            throw error;
        }
    }
    async submitResult(userId, dto) {
        try {
            const match = await this.prisma.match.findUnique({
                where: { id: dto.matchId },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                    player2: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            if (!match) {
                throw new common_1.NotFoundException('Match not found');
            }
            if (match.status !== 'in_progress') {
                throw new common_1.BadRequestException('Match is not in progress');
            }
            if (match.player1Id !== userId && match.player2Id !== userId) {
                throw new common_1.ForbiddenException('You are not a participant in this match');
            }
            if (dto.winnerId !== match.player1Id && dto.winnerId !== match.player2Id) {
                throw new common_1.BadRequestException('Invalid winner specified');
            }
            const isValidResult = await this.verifierService.verifyResult(dto.matchId, dto.winnerId, dto.gameData, dto.signature);
            if (!isValidResult) {
                throw new common_1.BadRequestException('Invalid game result or signature');
            }
            const winner = dto.winnerId === match.player1Id ? match.player1 : match.player2;
            const loser = dto.winnerId === match.player1Id ? match.player2 : match.player1;
            await this.solanaService.submitMatchResult(match.escrowAddress, winner.wallet, dto.signature);
            const updatedMatch = await this.prisma.match.update({
                where: { id: dto.matchId },
                data: {
                    status: 'completed',
                    winnerId: dto.winnerId,
                    endedAt: new Date(),
                    result: dto.gameData,
                    signature: dto.signature,
                },
                include: {
                    player1: {
                        select: { id: true, wallet: true, username: true },
                    },
                    player2: {
                        select: { id: true, wallet: true, username: true },
                    },
                },
            });
            await this.updateUserStats(dto.winnerId, match.player1Id === dto.winnerId ? match.player2Id : match.player1Id, match.wager);
            this.logger.log(`Match completed: ${match.id}, winner: ${winner.wallet}`);
            return this.formatMatchResponse(updatedMatch);
        }
        catch (error) {
            this.logger.error(`Failed to submit result: ${error.message}`);
            throw error;
        }
    }
    async cancelMatch(userId, matchId) {
        try {
            const match = await this.prisma.match.findUnique({
                where: { id: matchId },
            });
            if (!match) {
                throw new common_1.NotFoundException('Match not found');
            }
            if (match.player1Id !== userId) {
                throw new common_1.ForbiddenException('Only the match creator can cancel');
            }
            if (match.status !== 'pending') {
                throw new common_1.BadRequestException('Can only cancel pending matches');
            }
            if (match.escrowAddress) {
                await this.solanaService.refundMatch(match.escrowAddress);
            }
            await this.prisma.match.update({
                where: { id: matchId },
                data: { status: 'cancelled' },
            });
            this.logger.log(`Match cancelled: ${matchId}`);
        }
        catch (error) {
            this.logger.error(`Failed to cancel match: ${error.message}`);
            throw error;
        }
    }
    async getMatch(matchId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: {
                player1: {
                    select: { id: true, wallet: true, username: true },
                },
                player2: {
                    select: { id: true, wallet: true, username: true },
                },
            },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        return this.formatMatchResponse(match);
    }
    async getAvailableMatches(gameType, limit = 20) {
        const where = {
            status: 'pending',
            gameData: {
                path: ['expiryTime'],
                gt: new Date().toISOString(),
            },
        };
        if (gameType) {
            where.gameType = gameType;
        }
        const matches = await this.prisma.match.findMany({
            where,
            include: {
                player1: {
                    select: { id: true, wallet: true, username: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return matches.map(match => this.formatMatchResponse(match));
    }
    async getUserMatches(userId, limit = 50) {
        const matches = await this.prisma.match.findMany({
            where: {
                OR: [
                    { player1Id: userId },
                    { player2Id: userId },
                ],
            },
            include: {
                player1: {
                    select: { id: true, wallet: true, username: true },
                },
                player2: {
                    select: { id: true, wallet: true, username: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return matches.map(match => this.formatMatchResponse(match));
    }
    async updateUserStats(winnerId, loserId, wager) {
        try {
            const totalPot = wager * 2;
            const platformFee = totalPot * 0.065;
            const winnerEarnings = totalPot - platformFee;
            await this.prisma.user.update({
                where: { id: winnerId },
                data: {
                    totalMatches: { increment: 1 },
                    wins: { increment: 1 },
                    totalEarnings: { increment: winnerEarnings },
                },
            });
            await this.prisma.user.update({
                where: { id: loserId },
                data: {
                    totalMatches: { increment: 1 },
                    losses: { increment: 1 },
                },
            });
            await this.recalculateWinRate(winnerId);
            await this.recalculateWinRate(loserId);
        }
        catch (error) {
            this.logger.error(`Failed to update user stats: ${error.message}`);
        }
    }
    async recalculateWinRate(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { wins: true, totalMatches: true },
        });
        if (user && user.totalMatches > 0) {
            const winRate = (user.wins / user.totalMatches) * 100;
            await this.prisma.user.update({
                where: { id: userId },
                data: { winRate },
            });
        }
    }
    formatMatchResponse(match) {
        return {
            id: match.id,
            gameType: match.gameType,
            wager: match.wager,
            status: match.status,
            createdAt: match.createdAt,
            expiryTime: match.gameData?.expiryTime ? new Date(match.gameData.expiryTime) : undefined,
            player1: match.player1,
            player2: match.player2 || undefined,
            winner: match.winner || undefined,
            escrowAddress: match.escrowAddress || undefined,
            gameData: match.gameData || undefined,
        };
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = MatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        solana_service_1.SolanaService,
        verifier_service_1.VerifierService])
], MatchService);
//# sourceMappingURL=match.service.js.map