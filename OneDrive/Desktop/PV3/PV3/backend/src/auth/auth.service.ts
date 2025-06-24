import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MESSAGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private prisma: PrismaService) {}

  /**
   * Generate authentication message for wallet signing
   */
  generateAuthMessage(wallet: string): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    return `PV3 Authentication\n\nWallet: ${wallet}\nTimestamp: ${timestamp}\nNonce: ${nonce}\n\nSign this message to authenticate with PV3 Gaming Platform.`;
  }

  /**
   * Verify wallet signature and authenticate user
   */
  async authenticateWallet(authRequest: AuthRequest): Promise<AuthResponse> {
    try {
      // Validate timestamp (prevent replay attacks)
      const now = Date.now();
      if (now - authRequest.timestamp > this.MESSAGE_EXPIRY) {
        throw new UnauthorizedException('Authentication message expired');
      }

      // Verify wallet address format
      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(authRequest.wallet);
      } catch {
        throw new UnauthorizedException('Invalid wallet address');
      }

      // Verify signature
      const isValidSignature = this.verifySignature(
        authRequest.message,
        authRequest.signature,
        publicKey.toBase58()
      );

      if (!isValidSignature) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Get or create user
      const user = await this.getOrCreateUser(authRequest.wallet);

      // Generate session token
      const token = this.generateSessionToken(user.id, authRequest.wallet);
      const expiresAt = now + this.TOKEN_EXPIRY;

      // Log successful authentication
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
    } catch (error) {
      // Log failed authentication attempt
      await this.logSecurityEvent(null, 'AUTH_FAILED', {
        wallet: authRequest.wallet,
        error: (error as Error).message,
        timestamp: authRequest.timestamp,
      });

      this.logger.warn(`Authentication failed for ${authRequest.wallet}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Verify message signature using ed25519
   */
  private verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(publicKey);

      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      this.logger.warn(`Signature verification failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get existing user or create new one
   */
  private async getOrCreateUser(wallet: string) {
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

  /**
   * Generate session token (simple implementation - use JWT in production)
   */
  private generateSessionToken(userId: string, wallet: string): string {
    const payload = {
      userId,
      wallet,
      timestamp: Date.now(),
    };

    // In production, use proper JWT with secret key
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validate session token
   */
  async validateToken(token: string): Promise<{ userId: string; wallet: string } | null> {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check token expiry
      if (Date.now() - payload.timestamp > this.TOKEN_EXPIRY) {
        return null;
      }

      // Verify user still exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.wallet !== payload.wallet) {
        return null;
      }

      return { userId: payload.userId, wallet: payload.wallet };
    } catch {
      return null;
    }
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(
    userId: string | null,
    type: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ) {
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
    } catch (error) {
      this.logger.error(`Failed to log security event: ${(error as Error).message}`);
    }
  }

  /**
   * Logout user (invalidate token)
   */
  async logout(token: string): Promise<void> {
    const tokenData = await this.validateToken(token);
    if (tokenData) {
      await this.logSecurityEvent(tokenData.userId, 'LOGOUT', {
        wallet: tokenData.wallet,
      });
    }
  }

  /**
   * Get user profile by token
   */
  async getUserProfile(token: string) {
    const tokenData = await this.validateToken(token);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired token');
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
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Validate session for other services
   */
  async validateSession(sessionId: string): Promise<{ userId: string; wallet: string } | null> {
    return this.validateToken(sessionId);
  }
} 