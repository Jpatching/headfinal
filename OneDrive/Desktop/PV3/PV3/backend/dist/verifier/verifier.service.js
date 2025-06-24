"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VerifierService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const nacl = __importStar(require("tweetnacl"));
const bs58 = __importStar(require("bs58"));
const crypto_1 = require("crypto");
let VerifierService = VerifierService_1 = class VerifierService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(VerifierService_1.name);
        this.SIGNATURE_EXPIRY = 5 * 60 * 1000;
        const seed = process.env.VERIFIER_SEED
            ? new Uint8Array(JSON.parse(process.env.VERIFIER_SEED))
            : nacl.randomBytes(32);
        this.verifierKeypair = nacl.sign.keyPair.fromSeed(seed);
        this.logger.log('Verifier service initialized');
    }
    async verifyResult(matchId, winnerId, gameData, signature) {
        try {
            const match = await this.prisma.match.findUnique({
                where: { id: matchId },
                include: {
                    player1: true,
                    player2: true,
                },
            });
            if (!match) {
                this.logger.warn(`Match not found: ${matchId}`);
                return false;
            }
            if (match.status !== 'in_progress') {
                this.logger.warn(`Invalid match status for verification: ${match.status}`);
                return false;
            }
            if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
                this.logger.warn(`Invalid winner ID: ${winnerId}`);
                return false;
            }
            const gameResult = {
                matchId,
                gameType: match.gameType,
                player1Id: match.player1Id,
                player2Id: match.player2Id,
                winnerId,
                gameData,
                timestamp: Date.now(),
            };
            const verificationResult = await this.verifyGameSignature(gameResult, signature);
            if (!verificationResult.isValid) {
                this.logger.warn(`Signature verification failed: ${verificationResult.reason}`);
                await this.logSecurityEvent(matchId, 'INVALID_SIGNATURE', {
                    reason: verificationResult.reason,
                    flags: verificationResult.flags,
                });
                return false;
            }
            const gameValidation = await this.validateGameLogic(gameResult);
            if (!gameValidation.isValid) {
                this.logger.warn(`Game logic validation failed: ${gameValidation.reason}`);
                await this.logSecurityEvent(matchId, 'INVALID_GAME_LOGIC', {
                    reason: gameValidation.reason,
                    flags: gameValidation.flags,
                });
                return false;
            }
            const antiCheatResult = await this.runAntiCheatChecks(gameResult);
            if (!antiCheatResult.isValid) {
                this.logger.warn(`Anti-cheat check failed: ${antiCheatResult.reason}`);
                await this.logSecurityEvent(matchId, 'ANTI_CHEAT_VIOLATION', {
                    reason: antiCheatResult.reason,
                    flags: antiCheatResult.flags,
                });
                return false;
            }
            await this.logSecurityEvent(matchId, 'VERIFICATION_SUCCESS', {
                winnerId,
                confidence: Math.min(verificationResult.confidence, gameValidation.confidence, antiCheatResult.confidence),
            });
            this.logger.log(`Game result verified successfully: ${matchId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Verification error: ${error.message}`);
            await this.logSecurityEvent(matchId, 'VERIFICATION_ERROR', {
                error: error.message,
            });
            return false;
        }
    }
    async verifyGameSignature(gameResult, signature) {
        try {
            const now = Date.now();
            if (now - gameResult.timestamp > this.SIGNATURE_EXPIRY) {
                return {
                    isValid: false,
                    reason: 'Signature timestamp expired',
                    confidence: 0,
                    flags: ['EXPIRED_SIGNATURE'],
                };
            }
            const message = this.createGameResultMessage(gameResult);
            const messageBytes = new TextEncoder().encode(message);
            let signatureBytes;
            try {
                signatureBytes = bs58.decode(signature);
            }
            catch {
                return {
                    isValid: false,
                    reason: 'Invalid signature format',
                    confidence: 0,
                    flags: ['INVALID_SIGNATURE_FORMAT'],
                };
            }
            const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, this.verifierKeypair.publicKey);
            if (!isValid) {
                return {
                    isValid: false,
                    reason: 'Signature verification failed',
                    confidence: 0,
                    flags: ['SIGNATURE_MISMATCH'],
                };
            }
            return {
                isValid: true,
                confidence: 100,
                flags: [],
            };
        }
        catch (error) {
            return {
                isValid: false,
                reason: `Signature verification error: ${error.message}`,
                confidence: 0,
                flags: ['VERIFICATION_ERROR'],
            };
        }
    }
    async validateGameLogic(gameResult) {
        try {
            switch (gameResult.gameType) {
                case 'coin_flip':
                    return this.validateCoinFlip(gameResult);
                case 'rock_paper_scissors':
                    return this.validateRockPaperScissors(gameResult);
                case 'dice_roll':
                    return this.validateDiceRoll(gameResult);
                default:
                    return {
                        isValid: false,
                        reason: `Unsupported game type: ${gameResult.gameType}`,
                        confidence: 0,
                        flags: ['UNSUPPORTED_GAME'],
                    };
            }
        }
        catch (error) {
            return {
                isValid: false,
                reason: `Game validation error: ${error.message}`,
                confidence: 0,
                flags: ['VALIDATION_ERROR'],
            };
        }
    }
    validateCoinFlip(gameResult) {
        const { gameData } = gameResult;
        if (!gameData.player1Choice || !gameData.player2Choice || !gameData.result) {
            return {
                isValid: false,
                reason: 'Missing required coin flip data',
                confidence: 0,
                flags: ['MISSING_GAME_DATA'],
            };
        }
        const validChoices = ['heads', 'tails'];
        if (!validChoices.includes(gameData.player1Choice) || !validChoices.includes(gameData.player2Choice)) {
            return {
                isValid: false,
                reason: 'Invalid coin flip choices',
                confidence: 0,
                flags: ['INVALID_CHOICES'],
            };
        }
        if (!validChoices.includes(gameData.result)) {
            return {
                isValid: false,
                reason: 'Invalid coin flip result',
                confidence: 0,
                flags: ['INVALID_RESULT'],
            };
        }
        const expectedWinner = gameData.player1Choice === gameData.result
            ? gameResult.player1Id
            : gameResult.player2Id;
        if (gameResult.winnerId !== expectedWinner) {
            return {
                isValid: false,
                reason: 'Winner does not match game result',
                confidence: 0,
                flags: ['WINNER_MISMATCH'],
            };
        }
        return {
            isValid: true,
            confidence: 95,
            flags: [],
        };
    }
    validateRockPaperScissors(gameResult) {
        const { gameData } = gameResult;
        if (!gameData.player1Choice || !gameData.player2Choice) {
            return {
                isValid: false,
                reason: 'Missing RPS choices',
                confidence: 0,
                flags: ['MISSING_GAME_DATA'],
            };
        }
        const validChoices = ['rock', 'paper', 'scissors'];
        if (!validChoices.includes(gameData.player1Choice) || !validChoices.includes(gameData.player2Choice)) {
            return {
                isValid: false,
                reason: 'Invalid RPS choices',
                confidence: 0,
                flags: ['INVALID_CHOICES'],
            };
        }
        const p1Choice = gameData.player1Choice;
        const p2Choice = gameData.player2Choice;
        let expectedWinner = null;
        if (p1Choice === p2Choice) {
            return {
                isValid: false,
                reason: 'RPS game resulted in tie',
                confidence: 0,
                flags: ['GAME_TIE'],
            };
        }
        if ((p1Choice === 'rock' && p2Choice === 'scissors') ||
            (p1Choice === 'paper' && p2Choice === 'rock') ||
            (p1Choice === 'scissors' && p2Choice === 'paper')) {
            expectedWinner = gameResult.player1Id;
        }
        else {
            expectedWinner = gameResult.player2Id;
        }
        if (gameResult.winnerId !== expectedWinner) {
            return {
                isValid: false,
                reason: 'RPS winner does not match game logic',
                confidence: 0,
                flags: ['WINNER_MISMATCH'],
            };
        }
        return {
            isValid: true,
            confidence: 100,
            flags: [],
        };
    }
    validateDiceRoll(gameResult) {
        const { gameData } = gameResult;
        if (!gameData.player1Roll || !gameData.player2Roll) {
            return {
                isValid: false,
                reason: 'Missing dice roll data',
                confidence: 0,
                flags: ['MISSING_GAME_DATA'],
            };
        }
        if (gameData.player1Roll < 1 || gameData.player1Roll > 6 ||
            gameData.player2Roll < 1 || gameData.player2Roll > 6) {
            return {
                isValid: false,
                reason: 'Invalid dice roll values',
                confidence: 0,
                flags: ['INVALID_ROLL_VALUES'],
            };
        }
        let expectedWinner;
        if (gameData.player1Roll > gameData.player2Roll) {
            expectedWinner = gameResult.player1Id;
        }
        else if (gameData.player2Roll > gameData.player1Roll) {
            expectedWinner = gameResult.player2Id;
        }
        else {
            return {
                isValid: false,
                reason: 'Dice game resulted in tie',
                confidence: 0,
                flags: ['GAME_TIE'],
            };
        }
        if (gameResult.winnerId !== expectedWinner) {
            return {
                isValid: false,
                reason: 'Dice winner does not match rolls',
                confidence: 0,
                flags: ['WINNER_MISMATCH'],
            };
        }
        return {
            isValid: true,
            confidence: 90,
            flags: [],
        };
    }
    async runAntiCheatChecks(gameResult) {
        const flags = [];
        let confidence = 100;
        try {
            const recentMatches = await this.prisma.match.count({
                where: {
                    OR: [
                        { player1Id: gameResult.player1Id },
                        { player2Id: gameResult.player1Id },
                        { player1Id: gameResult.player2Id },
                        { player2Id: gameResult.player2Id },
                    ],
                    createdAt: {
                        gte: new Date(Date.now() - 60000),
                    },
                },
            });
            if (recentMatches > 10) {
                flags.push('HIGH_FREQUENCY_PLAY');
                confidence -= 20;
            }
            const playerStats = await Promise.all([
                this.prisma.user.findUnique({
                    where: { id: gameResult.player1Id },
                    select: { wins: true, totalMatches: true },
                }),
                this.prisma.user.findUnique({
                    where: { id: gameResult.player2Id },
                    select: { wins: true, totalMatches: true },
                }),
            ]);
            for (const stats of playerStats) {
                if (stats && stats.totalMatches > 10) {
                    const winRate = (stats.wins / stats.totalMatches) * 100;
                    if (winRate > 95 || winRate < 5) {
                        flags.push('SUSPICIOUS_WIN_RATE');
                        confidence -= 30;
                    }
                }
            }
            const timeDiff = Math.abs(Date.now() - gameResult.timestamp);
            if (timeDiff > 30000) {
                flags.push('OLD_TIMESTAMP');
                confidence -= 10;
            }
            return {
                isValid: confidence > 50,
                reason: confidence <= 50 ? 'Failed anti-cheat checks' : undefined,
                confidence,
                flags,
            };
        }
        catch (error) {
            return {
                isValid: false,
                reason: `Anti-cheat check error: ${error.message}`,
                confidence: 0,
                flags: ['ANTI_CHEAT_ERROR'],
            };
        }
    }
    createGameResultMessage(gameResult) {
        const data = {
            matchId: gameResult.matchId,
            gameType: gameResult.gameType,
            player1Id: gameResult.player1Id,
            player2Id: gameResult.player2Id,
            winnerId: gameResult.winnerId,
            gameData: JSON.stringify(gameResult.gameData),
            timestamp: gameResult.timestamp,
        };
        const message = Object.keys(data)
            .sort()
            .map(key => `${key}:${data[key]}`)
            .join('|');
        return (0, crypto_1.createHash)('sha256').update(message).digest('hex');
    }
    async signGameResult(gameResult) {
        try {
            const message = this.createGameResultMessage(gameResult);
            const messageBytes = new TextEncoder().encode(message);
            const signature = nacl.sign.detached(messageBytes, this.verifierKeypair.secretKey);
            return bs58.encode(signature);
        }
        catch (error) {
            this.logger.error(`Failed to sign game result: ${error.message}`);
            throw new common_1.BadRequestException('Failed to sign game result');
        }
    }
    getVerifierPublicKey() {
        return bs58.encode(this.verifierKeypair.publicKey);
    }
    async logSecurityEvent(matchId, type, details) {
        try {
            await this.prisma.securityLog.create({
                data: {
                    type,
                    action: 'GAME_VERIFICATION',
                    details: {
                        matchId,
                        ...details,
                    },
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to log security event: ${error.message}`);
        }
    }
    async isHealthy() {
        try {
            const testMessage = 'health_check_' + Date.now();
            const messageBytes = new TextEncoder().encode(testMessage);
            const signature = nacl.sign.detached(messageBytes, this.verifierKeypair.secretKey);
            const isValid = nacl.sign.detached.verify(messageBytes, signature, this.verifierKeypair.publicKey);
            return isValid;
        }
        catch (error) {
            this.logger.error(`Verifier health check failed: ${error.message}`);
            return false;
        }
    }
};
exports.VerifierService = VerifierService;
exports.VerifierService = VerifierService = VerifierService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerifierService);
//# sourceMappingURL=verifier.service.js.map