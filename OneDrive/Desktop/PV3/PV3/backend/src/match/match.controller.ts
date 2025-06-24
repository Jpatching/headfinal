import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MatchService, CreateMatchDto, JoinMatchDto, SubmitResultDto } from './match.service';
import { AuthService } from '../auth/auth.service';
import { IsString, IsNumber, IsOptional, IsNotEmpty, Min, Max, validateOrReject } from 'class-validator';

class CreateMatchRequestDto {
  @IsString()
  @IsNotEmpty()
  gameType: string;

  @IsNumber()
  @Min(0.01)
  @Max(10.0)
  wager: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  expiryMinutes?: number;
}

class JoinMatchRequestDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;
}

class SubmitResultRequestDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  winnerId: string;

  @IsNotEmpty()
  gameData: any;

  @IsString()
  @IsNotEmpty()
  signature: string;
}

@Controller('matches')
export class MatchController {
  private readonly logger = new Logger(MatchController.name);

  constructor(
    private matchService: MatchService,
    private authService: AuthService
  ) {}

  /**
   * Create a new match
   * POST /matches
   */
  @Post()
  async createMatch(
    @Body() dto: CreateMatchRequestDto,
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      await validateOrReject(Object.assign(new CreateMatchRequestDto(), dto));

      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const createMatchDto: CreateMatchDto = {
        gameType: dto.gameType,
        wager: dto.wager,
        expiryMinutes: dto.expiryMinutes,
      };

      const match = await this.matchService.createMatch(tokenData.userId, createMatchDto);

      this.logger.log(`Match created by user ${tokenData.userId}: ${match.id}`);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        match,
      });
    } catch (error) {
      this.logger.error(`Failed to create match: ${(error as Error).message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Join an existing match
   * POST /matches/:id/join
   */
  @Post(':id/join')
  async joinMatch(
    @Param('id') matchId: string,
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const joinMatchDto: JoinMatchDto = { matchId };
      const match = await this.matchService.joinMatch(tokenData.userId, joinMatchDto);

      this.logger.log(`Match joined by user ${tokenData.userId}: ${matchId}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        match,
      });
    } catch (error) {
      this.logger.error(`Failed to join match: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Submit match result
   * POST /matches/:id/result
   */
  @Post(':id/result')
  async submitResult(
    @Param('id') matchId: string,
    @Body() dto: Omit<SubmitResultRequestDto, 'matchId'>,
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const submitDto = Object.assign(new SubmitResultRequestDto(), { ...dto, matchId });
      await validateOrReject(submitDto);

      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const submitResultDto: SubmitResultDto = {
        matchId,
        winnerId: dto.winnerId,
        gameData: dto.gameData,
        signature: dto.signature,
      };

      const match = await this.matchService.submitResult(tokenData.userId, submitResultDto);

      this.logger.log(`Match result submitted by user ${tokenData.userId}: ${matchId}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        match,
      });
    } catch (error) {
      this.logger.error(`Failed to submit result: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Cancel a pending match
   * DELETE /matches/:id
   */
  @Delete(':id')
  async cancelMatch(
    @Param('id') matchId: string,
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      await this.matchService.cancelMatch(tokenData.userId, matchId);

      this.logger.log(`Match cancelled by user ${tokenData.userId}: ${matchId}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Match cancelled successfully',
      });
    } catch (error) {
      this.logger.error(`Failed to cancel match: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Get match by ID
   * GET /matches/:id
   */
  @Get(':id')
  async getMatch(
    @Param('id') matchId: string,
    @Res() res: Response
  ) {
    try {
      const match = await this.matchService.getMatch(matchId);

      return res.status(HttpStatus.OK).json({
        success: true,
        match,
      });
    } catch (error) {
      this.logger.error(`Failed to get match: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Get available matches for joining
   * GET /matches/available
   */
  @Get('available/list')
  async getAvailableMatches(
    @Res() res: Response,
    @Query('gameType') gameType?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      if (limitNum > 100) {
        throw new BadRequestException('Limit cannot exceed 100');
      }

      const matches = await this.matchService.getAvailableMatches(gameType, limitNum);

      return res.status(HttpStatus.OK).json({
        success: true,
        matches,
        count: matches.length,
      });
    } catch (error) {
      this.logger.error(`Failed to get available matches: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Get user's match history
   * GET /matches/history
   */
  @Get('history/list')
  async getUserMatches(
    @Headers('authorization') authorization: string,
    @Query('limit') limit: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const limitNum = limit ? parseInt(limit, 10) : 50;
      
      if (limitNum > 200) {
        throw new BadRequestException('Limit cannot exceed 200');
      }

      const matches = await this.matchService.getUserMatches(tokenData.userId, limitNum);

      return res.status(HttpStatus.OK).json({
        success: true,
        matches,
        count: matches.length,
      });
    } catch (error) {
      this.logger.error(`Failed to get user matches: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Get match statistics
   * GET /matches/stats
   */
  @Get('stats/summary')
  async getMatchStats(
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      const tokenData = await this.authService.validateToken(token);
      
      if (!tokenData) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Get user profile with stats
      const user = await this.authService.getUserProfile(token);

      const stats = {
        totalMatches: user.totalMatches,
        wins: user.wins,
        losses: user.losses,
        winRate: user.winRate,
        totalEarnings: user.totalEarnings,
        reputation: user.reputation,
      };

      return res.status(HttpStatus.OK).json({
        success: true,
        stats,
      });
    } catch (error) {
      this.logger.error(`Failed to get match stats: ${error.message}`);
      this.handleError(error, res);
    }
  }

  /**
   * Health check endpoint
   * GET /matches/health
   */
  @Get('health/check')
  async health(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      success: true,
      service: 'matches',
      timestamp: Date.now(),
    });
  }

  /**
   * Extract token from Authorization header or cookie
   */
  private extractToken(authorization: string, req: Request): string {
    // Try Authorization header first
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    // Try cookie
    if (req.cookies && req.cookies.pv3_token) {
      return req.cookies.pv3_token;
    }

    throw new UnauthorizedException('No authentication token provided');
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, res: Response) {
    if (Array.isArray(error)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error,
      });
    }

    if (error instanceof UnauthorizedException) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: error.message,
      });
    }

    if (error instanceof BadRequestException) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: error.message,
      });
    }

    // Generic error
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
    });
  }
} 
