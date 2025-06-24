import { PrismaService } from '../database/prisma.service';
import { SolanaService } from '../solana/solana.service';
import { VerifierService } from '../verifier/verifier.service';
export interface CreateMatchDto {
    gameType: string;
    wager: number;
    expiryMinutes?: number;
}
export interface JoinMatchDto {
    matchId: string;
}
export interface SubmitResultDto {
    matchId: string;
    winnerId: string;
    gameData: any;
    signature: string;
}
export interface MatchResponse {
    id: string;
    gameType: string;
    wager: number;
    status: string;
    createdAt: Date;
    expiryTime?: Date;
    player1: {
        id: string;
        wallet: string;
        username?: string;
    };
    player2?: {
        id: string;
        wallet: string;
        username?: string;
    };
    winner?: {
        id: string;
        wallet: string;
        username?: string;
    };
    escrowAddress?: string;
    gameData?: any;
}
export declare class MatchService {
    private prisma;
    private solanaService;
    private verifierService;
    private readonly logger;
    private readonly SUPPORTED_GAMES;
    private readonly MIN_WAGER;
    private readonly MAX_WAGER;
    private readonly DEFAULT_EXPIRY_MINUTES;
    constructor(prisma: PrismaService, solanaService: SolanaService, verifierService: VerifierService);
    createMatch(userId: string, dto: CreateMatchDto): Promise<MatchResponse>;
    joinMatch(userId: string, dto: JoinMatchDto): Promise<MatchResponse>;
    submitResult(userId: string, dto: SubmitResultDto): Promise<MatchResponse>;
    cancelMatch(userId: string, matchId: string): Promise<void>;
    getMatch(matchId: string): Promise<MatchResponse>;
    getAvailableMatches(gameType?: string, limit?: number): Promise<MatchResponse[]>;
    getUserMatches(userId: string, limit?: number): Promise<MatchResponse[]>;
    private updateUserStats;
    private recalculateWinRate;
    private formatMatchResponse;
}
