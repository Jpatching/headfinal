import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly userService: UserService) {}

  async getEarningsLeaderboard(): Promise<any[]> {
    // TODO: Implement with actual database
    return [
      { walletAddress: 'user1', totalEarnings: 100.5, rank: 1 },
      { walletAddress: 'user2', totalEarnings: 85.2, rank: 2 },
      { walletAddress: 'user3', totalEarnings: 72.8, rank: 3 },
    ];
  }

  async getWinsLeaderboard(): Promise<any[]> {
    return [
      { walletAddress: 'user1', wins: 150, rank: 1 },
      { walletAddress: 'user2', wins: 128, rank: 2 },
      { walletAddress: 'user3', wins: 95, rank: 3 },
    ];
  }

  async getWinrateLeaderboard(): Promise<any[]> {
    return [
      { walletAddress: 'user1', winRate: 0.85, totalMatches: 200, rank: 1 },
      { walletAddress: 'user2', winRate: 0.82, totalMatches: 150, rank: 2 },
      { walletAddress: 'user3', winRate: 0.78, totalMatches: 180, rank: 3 },
    ];
  }
} 