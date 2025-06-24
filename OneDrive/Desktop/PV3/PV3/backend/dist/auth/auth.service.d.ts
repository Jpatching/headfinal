import { PrismaService } from '../database/prisma.service';
export interface AuthRequest {
    wallet: string;
    signature: string;
    message: string;
    timestamp: number;
}
export interface AuthResponse {
    success: boolean;
    user: {
        id: string;
        wallet: string;
        username?: string;
        avatar?: string;
        totalEarnings: number;
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        reputation: number;
    };
    token: string;
    expiresAt: number;
}
export declare class AuthService {
    private prisma;
    private readonly logger;
    private readonly MESSAGE_EXPIRY;
    private readonly TOKEN_EXPIRY;
    constructor(prisma: PrismaService);
    generateAuthMessage(wallet: string): string;
    authenticateWallet(authRequest: AuthRequest): Promise<AuthResponse>;
    private verifySignature;
    private getOrCreateUser;
    private generateSessionToken;
    validateToken(token: string): Promise<{
        userId: string;
        wallet: string;
    } | null>;
    private logSecurityEvent;
    logout(token: string): Promise<void>;
    getUserProfile(token: string): Promise<{
        referrals: {
            totalEarnings: number;
        }[];
    } & {
        createdAt: Date;
        id: string;
        updatedAt: Date;
        wallet: string;
        username: string | null;
        avatar: string | null;
        email: string | null;
        totalEarnings: number;
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        reputation: number;
        achievements: import("@prisma/client/runtime/library").JsonValue | null;
        badges: import("@prisma/client/runtime/library").JsonValue | null;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    validateSession(sessionId: string): Promise<{
        userId: string;
        wallet: string;
    } | null>;
}
