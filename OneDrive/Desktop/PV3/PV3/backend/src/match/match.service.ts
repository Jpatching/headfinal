import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
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

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  private readonly SUPPORTED_GAMES = ['coin_flip', 'rock_paper_scissors', 'dice_roll'];
  private readonly MIN_WAGER = 0.01; // 0.01 SOL
  private readonly MAX_WAGER = 10.0; // 10 SOL
  private readonly DEFAULT_EXPIRY_MINUTES = 30;

  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
    private verifierService: VerifierService
  ) {}

  /**
   * Create a new match
   */
  async createMatch(userId: string, dto: CreateMatchDto): Promise<MatchResponse> {
    try {
      // Validate game type
      if (!this.SUPPORTED_GAMES.includes(dto.gameType)) {
        throw new BadRequestException(`Unsupported game type: ${dto.gameType}`);
      }

      // Validate wager amount
      if (dto.wager < this.MIN_WAGER || dto.wager > this.MAX_WAGER) {
        throw new BadRequestException(`Wager must be between ${this.MIN_WAGER} and ${this.MAX_WAGER} SOL`);
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has any pending matches
      const pendingMatch = await this.prisma.match.findFirst({
        where: {
          player1Id: userId,
          status: 'pending',
        },
      });

      if (pendingMatch) {
        throw new BadRequestException('You already have a pending match. Cancel it first or wait for someone to join.');
      }

      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + (dto.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES));

      // Create match in database
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

      // Create Solana escrow account
      const escrowAddress = await this.solanaService.createMatchEscrow(
        match.id,
        user.wallet,
        dto.wager
      );

      // Update match with escrow address
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
    } catch (error) {
      this.logger.error(`Failed to create match: ${error.message}`);
      throw error;
    }
  }

  /**
   * Join an existing match
   */
  async joinMatch(userId: string, dto: JoinMatchDto): Promise<MatchResponse> {
    try {
      // Get match
      const match = await this.prisma.match.findUnique({
        where: { id: dto.matchId },
        include: {
          player1: {
            select: { id: true, wallet: true, username: true },
          },
        },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      // Validate match status
      if (match.status !== 'pending') {
        throw new BadRequestException('Match is not available for joining');
      }

      // Check if user is trying to join their own match
      if (match.player1Id === userId) {
        throw new BadRequestException('Cannot join your own match');
      }

      // Check if match has expired
      const gameData = match.gameData as any;
      const expiryTime = new Date(gameData?.expiryTime);
      if (new Date() > expiryTime) {
        // Auto-cancel expired match
        await this.cancelMatch(match.player1Id, dto.matchId);
        throw new BadRequestException('Match has expired');
      }

      // Get joining user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Join match on Solana
      await this.solanaService.joinMatch(match.escrowAddress!, user.wallet, match.wager);

      // Update match in database
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
    } catch (error) {
      this.logger.error(`Failed to join match: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit match result
   */
  async submitResult(userId: string, dto: SubmitResultDto): Promise<MatchResponse> {
    try {
      // Get match
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
        throw new NotFoundException('Match not found');
      }

      // Validate match status
      if (match.status !== 'in_progress') {
        throw new BadRequestException('Match is not in progress');
      }

      // Validate that user is a participant
      if (match.player1Id !== userId && match.player2Id !== userId) {
        throw new ForbiddenException('You are not a participant in this match');
      }

      // Validate winner
      if (dto.winnerId !== match.player1Id && dto.winnerId !== match.player2Id) {
        throw new BadRequestException('Invalid winner specified');
      }

      // Verify result with verifier service
      const isValidResult = await this.verifierService.verifyResult(
        dto.matchId,
        dto.winnerId,
        dto.gameData,
        dto.signature
      );

      if (!isValidResult) {
        throw new BadRequestException('Invalid game result or signature');
      }

      // Get winner details
      const winner = dto.winnerId === match.player1Id ? match.player1 : match.player2;
      const loser = dto.winnerId === match.player1Id ? match.player2 : match.player1;

      // Submit result to Solana and process payout
      await this.solanaService.submitMatchResult(
        match.escrowAddress!,
        winner!.wallet,
        dto.signature
      );

      // Update match in database
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

      // Update user statistics
      await this.updateUserStats(dto.winnerId, match.player1Id === dto.winnerId ? match.player2Id! : match.player1Id, match.wager);

      this.logger.log(`Match completed: ${match.id}, winner: ${winner!.wallet}`);

      return this.formatMatchResponse(updatedMatch);
    } catch (error) {
      this.logger.error(`Failed to submit result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a pending match
   */
  async cancelMatch(userId: string, matchId: string): Promise<void> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      if (match.player1Id !== userId) {
        throw new ForbiddenException('Only the match creator can cancel');
      }

      if (match.status !== 'pending') {
        throw new BadRequestException('Can only cancel pending matches');
      }

      // Refund on Solana if escrow was created
      if (match.escrowAddress) {
        await this.solanaService.refundMatch(match.escrowAddress);
      }

      // Update match status
      await this.prisma.match.update({
        where: { id: matchId },
        data: { status: 'cancelled' },
      });

      this.logger.log(`Match cancelled: ${matchId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel match: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get match by ID
   */
  async getMatch(matchId: string): Promise<MatchResponse> {
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
      throw new NotFoundException('Match not found');
    }

    return this.formatMatchResponse(match);
  }

  /**
   * Get available matches for joining
   */
  async getAvailableMatches(gameType?: string, limit = 20): Promise<MatchResponse[]> {
    const where: any = {
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

  /**
   * Get user's match history
   */
  async getUserMatches(userId: string, limit = 50): Promise<MatchResponse[]> {
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

  /**
   * Update user statistics after match completion
   */
  private async updateUserStats(winnerId: string, loserId: string, wager: number): Promise<void> {
    try {
      // Calculate earnings (winner gets wager * 2 - platform fee)
      const totalPot = wager * 2;
      const platformFee = totalPot * 0.065; // 6.5%
      const winnerEarnings = totalPot - platformFee;

      // Update winner stats
      await this.prisma.user.update({
        where: { id: winnerId },
        data: {
          totalMatches: { increment: 1 },
          wins: { increment: 1 },
          totalEarnings: { increment: winnerEarnings },
        },
      });

      // Update loser stats
      await this.prisma.user.update({
        where: { id: loserId },
        data: {
          totalMatches: { increment: 1 },
          losses: { increment: 1 },
        },
      });

      // Recalculate win rates
      await this.recalculateWinRate(winnerId);
      await this.recalculateWinRate(loserId);
    } catch (error) {
      this.logger.error(`Failed to update user stats: ${error.message}`);
    }
  }

  /**
   * Recalculate user win rate
   */
  private async recalculateWinRate(userId: string): Promise<void> {
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

  /**
   * Format match response
   */
  private formatMatchResponse(match: any): MatchResponse {
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
} 