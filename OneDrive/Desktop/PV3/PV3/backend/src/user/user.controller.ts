import { Controller, Get, Put, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get(':wallet')
  async getProfile(@Param('wallet') wallet: string) {
    const profile = await this.userService.getProfile(wallet);
    return { profile };
  }

  @Put('profile')
  async updateProfile(
    @Headers('authorization') auth: string,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const session = await this.validateSession(auth);
    const profile = await this.userService.updateProfile(session.wallet, updateProfileDto);
    return { profile };
  }

  @Get(':wallet/stats')
  async getUserStats(@Param('wallet') wallet: string) {
    const stats = await this.userService.getUserStats(wallet);
    return { stats };
  }

  @Get(':wallet/earnings')
  async getUserEarnings(@Param('wallet') wallet: string) {
    const earnings = await this.userService.getUserEarnings(wallet);
    return { earnings };
  }

  @Get(':wallet/achievements')
  async getUserAchievements(@Param('wallet') wallet: string) {
    const achievements = await this.userService.getUserAchievements(wallet);
    return { achievements };
  }

  @Get(':wallet/nft-avatar')
  async getNftAvatar(@Param('wallet') wallet: string) {
    const nftAvatar = await this.userService.getNftAvatar(wallet);
    return { nftAvatar };
  }

  @Put('preferences')
  async updatePreferences(
    @Headers('authorization') auth: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ) {
    const session = await this.validateSession(auth);
    const preferences = await this.userService.updatePreferences(session.wallet, updatePreferencesDto);
    return { preferences };
  }

  @Get('reputation')
  async getReputation(@Headers('authorization') auth: string) {
    const session = await this.validateSession(auth);
    const reputation = await this.userService.getReputation(session.wallet);
    return { reputation };
  }

  @Get('badges')
  async getBadges(@Headers('authorization') auth: string) {
    const session = await this.validateSession(auth);
    const badges = await this.userService.getBadges(session.wallet);
    return { badges };
  }

  @Get(':wallet/match-history')
  async getMatchHistory(@Param('wallet') wallet: string) {
    const history = await this.userService.getMatchHistory(wallet);
    return { history };
  }

  @Get('search')
  async searchUsers(@Body() query: { searchTerm: string }) {
    const users = await this.userService.searchUsers(query.searchTerm);
    return { users };
  }

  @Get(':wallet/activity')
  async getActivityFeed(@Param('wallet') wallet: string) {
    const activities = await this.userService.getActivityFeed(wallet);
    return { activities };
  }

  private async validateSession(authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const sessionId = authHeader.substring(7);
    const session = await this.authService.validateSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    return session;
  }
} 
