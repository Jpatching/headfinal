import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, AuthRequest, AuthResponse } from './auth.service';
import { IsString, IsNumber, IsNotEmpty, validateOrReject } from 'class-validator';

class AuthenticateDto {
  @IsString()
  @IsNotEmpty()
  wallet: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  timestamp: number;
}

class GenerateMessageDto {
  @IsString()
  @IsNotEmpty()
  wallet: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Generate authentication message for wallet signing
   * POST /auth/generate-message
   */
  @Post('generate-message')
  async generateMessage(
    @Body() dto: GenerateMessageDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      await validateOrReject(Object.assign(new GenerateMessageDto(), dto));

      const message = this.authService.generateAuthMessage(dto.wallet);

      this.logger.log(`Generated auth message for wallet: ${dto.wallet}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        message,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Failed to generate message: ${(error as Error).message}`);
      
      if (Array.isArray(error)) {
        throw new BadRequestException('Invalid request data');
      }
      
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Authenticate user with wallet signature
   * POST /auth/authenticate
   */
  @Post('authenticate')
  async authenticate(
    @Body() dto: AuthenticateDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      await validateOrReject(Object.assign(new AuthenticateDto(), dto));

      const authRequest: AuthRequest = {
        wallet: dto.wallet,
        signature: dto.signature,
        message: dto.message,
        timestamp: dto.timestamp,
      };

      const authResponse: AuthResponse = await this.authService.authenticateWallet(authRequest);

      // Set secure HTTP-only cookie for token
      res.cookie('pv3_token', authResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      this.logger.log(`User authenticated successfully: ${dto.wallet}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        user: authResponse.user,
        expiresAt: authResponse.expiresAt,
      });
    } catch (error) {
      this.logger.error(`Authentication failed: ${(error as Error).message}`);
      
      if (Array.isArray(error)) {
        throw new BadRequestException('Invalid request data');
      }
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @Get('profile')
  async getProfile(
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      const user = await this.authService.getUserProfile(token);

      return res.status(HttpStatus.OK).json({
        success: true,
        user,
      });
    } catch (error) {
      this.logger.error(`Failed to get profile: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  @Post('logout')
  async logout(
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const token = this.extractToken(authorization, req);
      await this.authService.logout(token);

      // Clear cookie
      res.clearCookie('pv3_token');

      this.logger.log('User logged out successfully');

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      
      // Clear cookie anyway
      res.clearCookie('pv3_token');
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Logged out',
      });
    }
  }

  /**
   * Health check endpoint
   * GET /auth/health
   */
  @Get('health')
  async health(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      success: true,
      service: 'auth',
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
} 