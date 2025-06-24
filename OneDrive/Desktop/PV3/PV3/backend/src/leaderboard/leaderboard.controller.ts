import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('earnings')
  async getEarningsLeaderboard() {
    const leaderboard = await this.leaderboardService.getEarningsLeaderboard();
    return { leaderboard };
  }

  @Get('wins')
  async getWinsLeaderboard() {
    const leaderboard = await this.leaderboardService.getWinsLeaderboard();
    return { leaderboard };
  }

  @Get('winrate')
  async getWinrateLeaderboard() {
    const leaderboard = await this.leaderboardService.getWinrateLeaderboard();
    return { leaderboard };
  }
} 