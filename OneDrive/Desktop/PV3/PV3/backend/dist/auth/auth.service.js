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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const web3_js_1 = require("@solana/web3.js");
const nacl = __importStar(require("tweetnacl"));
const bs58 = __importStar(require("bs58"));
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.MESSAGE_EXPIRY = 5 * 60 * 1000;
        this.TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
    }
    generateAuthMessage(wallet) {
        const timestamp = Date.now();
        const nonce = Math.random().toString(36).substring(2, 15);
        return `PV3 Authentication\n\nWallet: ${wallet}\nTimestamp: ${timestamp}\nNonce: ${nonce}\n\nSign this message to authenticate with PV3 Gaming Platform.`;
    }
    async authenticateWallet(authRequest) {
        try {
            const now = Date.now();
            if (now - authRequest.timestamp > this.MESSAGE_EXPIRY) {
                throw new common_1.UnauthorizedException('Authentication message expired');
            }
            let publicKey;
            try {
                publicKey = new web3_js_1.PublicKey(authRequest.wallet);
            }
            catch {
                throw new common_1.UnauthorizedException('Invalid wallet address');
            }
            const isValidSignature = this.verifySignature(authRequest.message, authRequest.signature, publicKey.toBase58());
            if (!isValidSignature) {
                throw new common_1.UnauthorizedException('Invalid signature');
            }
            const user = await this.getOrCreateUser(authRequest.wallet);
            const token = this.generateSessionToken(user.id, authRequest.wallet);
            const expiresAt = now + this.TOKEN_EXPIRY;
            await this.logSecurityEvent(user.id, 'AUTH_SUCCESS', {
                wallet: authRequest.wallet,
                timestamp: authRequest.timestamp,
            });
            this.logger.log(`User authenticated: ${authRequest.wallet}`);
            return {
                success: true,
                user: {
                    id: user.id,
                    wallet: user.wallet,
                    username: user.username,
                    avatar: user.avatar,
                    totalEarnings: user.totalEarnings,
                    totalMatches: user.totalMatches,
                    wins: user.wins,
                    losses: user.losses,
                    winRate: user.winRate,
                    reputation: user.reputation,
                },
                token,
                expiresAt,
            };
        }
        catch (error) {
            await this.logSecurityEvent(null, 'AUTH_FAILED', {
                wallet: authRequest.wallet,
                error: error.message,
                timestamp: authRequest.timestamp,
            });
            this.logger.warn(`Authentication failed for ${authRequest.wallet}: ${error.message}`);
            throw error;
        }
    }
    verifySignature(message, signature, publicKey) {
        try {
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = bs58.decode(signature);
            const publicKeyBytes = bs58.decode(publicKey);
            return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        }
        catch (error) {
            this.logger.warn(`Signature verification failed: ${error.message}`);
            return false;
        }
    }
    async getOrCreateUser(wallet) {
        let user = await this.prisma.user.findUnique({
            where: { wallet },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    wallet,
                    username: `Player_${wallet.slice(-6)}`,
                    reputation: 1000,
                    totalEarnings: 0,
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                },
            });
            this.logger.log(`New user created: ${wallet}`);
        }
        return user;
    }
    generateSessionToken(userId, wallet) {
        const payload = {
            userId,
            wallet,
            timestamp: Date.now(),
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }
    async validateToken(token) {
        try {
            const payload = JSON.parse(Buffer.from(token, 'base64').toString());
            if (Date.now() - payload.timestamp > this.TOKEN_EXPIRY) {
                return null;
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId },
            });
            if (!user || user.wallet !== payload.wallet) {
                return null;
            }
            return { userId: payload.userId, wallet: payload.wallet };
        }
        catch {
            return null;
        }
    }
    async logSecurityEvent(userId, type, details, ipAddress, userAgent) {
        try {
            await this.prisma.securityLog.create({
                data: {
                    userId,
                    type,
                    action: 'AUTHENTICATION',
                    details,
                    ipAddress,
                    userAgent,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to log security event: ${error.message}`);
        }
    }
    async logout(token) {
        const tokenData = await this.validateToken(token);
        if (tokenData) {
            await this.logSecurityEvent(tokenData.userId, 'LOGOUT', {
                wallet: tokenData.wallet,
            });
        }
    }
    async getUserProfile(token) {
        const tokenData = await this.validateToken(token);
        if (!tokenData) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: tokenData.userId },
            include: {
                referrals: {
                    where: { referrerId: tokenData.userId },
                    select: { totalEarnings: true },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async validateSession(sessionId) {
        return this.validateToken(sessionId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map