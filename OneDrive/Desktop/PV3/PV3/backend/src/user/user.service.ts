import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProfileDto, UpdatePreferencesDto, UserStats, UserAchievement } from './dto/user.dto';

export interface UserProfile {
  walletAddress: string;
  username?: string;
  bio?: string;
  avatar?: string;
  nftAvatar?: string;
  createdAt: Date;
  lastActive: Date;
  reputation: number;
  level: number;
  stats: UserStats;
  preferences: any;
  badges: string[];
}

@Injectable()
export class UserService {
  // In-memory storage for development - replace with actual database
  private users = new Map<string, UserProfile>();

  async getProfile(walletAddress: string): Promise<UserProfile> {
    const user = this.users.get(walletAddress);
    if (!user) {
      return this.createDefaultProfile(walletAddress);
    }
    return user;
  }

  async updateProfile(walletAddress: string, updateProfileDto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.getProfile(walletAddress);
    
    // Validate username uniqueness if being updated
    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = Array.from(this.users.values()).find(
        u => u.username === updateProfileDto.username && u.walletAddress !== walletAddress
      );
      if (existingUser) {
        throw new BadRequestException('Username already taken');
      }
    }

    const updatedUser = {
      ...user,
      ...updateProfileDto,
      lastActive: new Date(),
    };

    this.users.set(walletAddress, updatedUser);
    return updatedUser;
  }

  async getUserStats(walletAddress: string): Promise<UserStats> {
    const user = await this.getProfile(walletAddress);
    return user.stats;
  }

  async getUserEarnings(walletAddress: string): Promise<any[]> {
    // TODO: Implement actual earnings history from database
    // Mock earnings data for development
    return [
      {
        id: 'earning_1',
        type: 'match_win',
        amount: 1.5,
        matchId: 'match_123',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: 'earning_2',
        type: 'referral_bonus',
        amount: 0.1,
        referredUser: 'user_456',
        timestamp: new Date(Date.now() - 172800000),
      },
    ];
  }

  async getUserAchievements(walletAddress: string): Promise<UserAchievement[]> {
    // TODO: Implement actual achievements system
    // Mock achievements for development
    return [
      {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first match',
        icon: '🏆',
        unlockedAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'streak_5',
        name: 'On Fire',
        description: 'Win 5 matches in a row',
        icon: '🔥',
        unlockedAt: new Date(Date.now() - 43200000),
        progress: {
          current: 5,
          target: 5,
        },
      },
    ];
  }

  async getNftAvatar(walletAddress: string): Promise<{ nftAddress: string; imageUrl: string } | null> {
    const user = await this.getProfile(walletAddress);
    if (!user.nftAvatar) {
      return null;
    }

    // TODO: Implement actual NFT metadata fetching
    return {
      nftAddress: user.nftAvatar,
      imageUrl: 'https://example.com/nft-image.png',
    };
  }

  async updatePreferences(walletAddress: string, updatePreferencesDto: UpdatePreferencesDto): Promise<any> {
    const user = await this.getProfile(walletAddress);
    
    const updatedPreferences = {
      ...user.preferences,
      ...updatePreferencesDto,
    };

    const updatedUser = {
      ...user,
      preferences: updatedPreferences,
      lastActive: new Date(),
    };

    this.users.set(walletAddress, updatedUser);
    return updatedPreferences;
  }

  async getReputation(walletAddress: string): Promise<{ score: number; rank: string; factors: any[] }> {
    const user = await this.getProfile(walletAddress);
    
    return {
      score: user.reputation,
      rank: this.calculateReputationRank(user.reputation),
      factors: [
        { name: 'Win Rate', value: user.stats.winRate, weight: 30 },
        { name: 'Match Volume', value: user.stats.totalMatches, weight: 20 },
        { name: 'Fair Play', value: 100, weight: 25 }, // No reports
        { name: 'Community', value: 85, weight: 25 }, // Positive interactions
      ],
    };
  }

  async getBadges(walletAddress: string): Promise<string[]> {
    const user = await this.getProfile(walletAddress);
    return user.badges;
  }

  // Update user stats after match completion
  async updateMatchStats(walletAddress: string, matchResult: { won: boolean; wager: number; earnings: number }): Promise<void> {
    const user = await this.getProfile(walletAddress);
    
    const updatedStats: UserStats = {
      ...user.stats,
      totalMatches: user.stats.totalMatches + 1,
      wins: matchResult.won ? user.stats.wins + 1 : user.stats.wins,
      losses: matchResult.won ? user.stats.losses : user.stats.losses + 1,
      totalEarnings: user.stats.totalEarnings + matchResult.earnings,
      totalWagered: user.stats.totalWagered + matchResult.wager,
    };

    // Recalculate derived stats
    updatedStats.winRate = updatedStats.wins / updatedStats.totalMatches;
    updatedStats.averageWager = updatedStats.totalWagered / updatedStats.totalMatches;
    
    // Update win streak
    if (matchResult.won) {
      updatedStats.currentWinStreak = user.stats.currentWinStreak + 1;
      updatedStats.longestWinStreak = Math.max(updatedStats.longestWinStreak, updatedStats.currentWinStreak);
    } else {
      updatedStats.currentWinStreak = 0;
    }

    const updatedUser = {
      ...user,
      stats: updatedStats,
      reputation: this.calculateReputation(updatedStats),
      lastActive: new Date(),
    };

    this.users.set(walletAddress, updatedUser);

    // Check for new achievements
    await this.checkAndUnlockAchievements(walletAddress, updatedStats);
  }

  private createDefaultProfile(walletAddress: string): UserProfile {
    const defaultProfile: UserProfile = {
      walletAddress,
      createdAt: new Date(),
      lastActive: new Date(),
      reputation: 50, // Starting reputation
      level: 1,
      stats: {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalEarnings: 0,
        totalWagered: 0,
        averageWager: 0,
        longestWinStreak: 0,
        currentWinStreak: 0,
        rank: 0,
        badges: [],
      },
      preferences: {
        gamePreferences: {
          favoriteGames: [],
          preferredWagerRange: { min: 0.1, max: 10 },
        },
        notificationSettings: {
          matchInvites: true,
          tournamentUpdates: true,
          earnings: true,
          marketing: false,
        },
      },
      badges: [],
    };

    this.users.set(walletAddress, defaultProfile);
    return defaultProfile;
  }

  private calculateReputationRank(reputation: number): string {
    if (reputation >= 90) return 'Legendary';
    if (reputation >= 80) return 'Expert';
    if (reputation >= 70) return 'Veteran';
    if (reputation >= 60) return 'Skilled';
    if (reputation >= 50) return 'Novice';
    return 'Rookie';
  }

  private calculateReputation(stats: UserStats): number {
    let reputation = 50; // Base score

    // Win rate factor (max +25 points)
    reputation += stats.winRate * 25;

    // Volume factor (max +15 points)
    reputation += Math.min(stats.totalMatches / 100, 1) * 15;

    // Consistency factor (max +10 points)
    if (stats.totalMatches > 10) {
      const consistency = 1 - Math.abs(0.5 - stats.winRate);
      reputation += consistency * 10;
    }

    return Math.min(Math.max(reputation, 0), 100);
  }

  private async checkAndUnlockAchievements(walletAddress: string, stats: UserStats): Promise<void> {
    const user = this.users.get(walletAddress);
    if (!user) return;

    const newBadges: string[] = [];

    // First win achievement
    if (stats.wins === 1 && !user.badges.includes('first_win')) {
      newBadges.push('first_win');
    }

    // Win streak achievements
    if (stats.currentWinStreak >= 5 && !user.badges.includes('streak_5')) {
      newBadges.push('streak_5');
    }

    if (stats.currentWinStreak >= 10 && !user.badges.includes('streak_10')) {
      newBadges.push('streak_10');
    }

    // Volume achievements
    if (stats.totalMatches >= 100 && !user.badges.includes('volume_100')) {
      newBadges.push('volume_100');
    }

    // Earnings achievements
    if (stats.totalEarnings >= 10 && !user.badges.includes('earnings_10')) {
      newBadges.push('earnings_10');
    }

    if (newBadges.length > 0) {
      user.badges.push(...newBadges);
      this.users.set(walletAddress, user);
    }
  }

  async getMatchHistory(walletAddress: string): Promise<any[]> {
    // TODO: Implement actual match history retrieval from matches
    // Mock data for development
    return [
      {
        matchId: 'match_123',
        gameId: 'rps',
        opponent: 'Opponent1...xyz',
        result: 'won',
        wager: 0.5,
        earnings: 0.97,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        matchId: 'match_124',
        gameId: 'coinflip',
        opponent: 'Opponent2...abc',
        result: 'lost',
        wager: 0.3,
        earnings: 0,
        timestamp: new Date(Date.now() - 7200000),
      },
    ];
  }

  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const searchLower = searchTerm.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.walletAddress.toLowerCase().includes(searchLower)
      )
      .slice(0, 10); // Limit results
  }

  async getActivityFeed(walletAddress: string): Promise<any[]> {
    // TODO: Implement actual activity feed
    // Mock data for development
    return [
      {
        type: 'match_completed',
        description: 'Won match against Opponent1...xyz',
        timestamp: new Date(Date.now() - 1800000),
        details: { earnings: 0.97 },
      },
      {
        type: 'achievement_unlocked',
        description: 'Unlocked "5 Win Streak" badge',
        timestamp: new Date(Date.now() - 3600000),
        details: { badge: 'streak_5' },
      },
    ];
  }
} 