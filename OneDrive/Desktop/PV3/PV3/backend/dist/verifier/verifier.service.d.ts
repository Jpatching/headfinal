import { PrismaService } from '../database/prisma.service';
export interface GameResult {
    matchId: string;
    gameType: string;
    player1Id: string;
    player2Id: string;
    winnerId: string;
    gameData: any;
    timestamp: number;
}
export interface VerificationResult {
    isValid: boolean;
    reason?: string;
    confidence: number;
    flags: string[];
}
export declare class VerifierService {
    private prisma;
    private readonly logger;
    private readonly SIGNATURE_EXPIRY;
    private readonly verifierKeypair;
    constructor(prisma: PrismaService);
    verifyResult(matchId: string, winnerId: string, gameData: any, signature: string): Promise<boolean>;
    private verifyGameSignature;
    private validateGameLogic;
    private validateCoinFlip;
    private validateRockPaperScissors;
    private validateDiceRoll;
    private runAntiCheatChecks;
    private createGameResultMessage;
    signGameResult(gameResult: GameResult): Promise<string>;
    getVerifierPublicKey(): string;
    private logSecurityEvent;
    isHealthy(): Promise<boolean>;
}
