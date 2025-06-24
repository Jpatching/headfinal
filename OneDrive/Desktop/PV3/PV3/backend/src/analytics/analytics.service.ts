import { Injectable } from '@nestjs/common';
import { 
  AnalyticsQueryDto, 
  RevenueMetrics, 
  UserActivityMetrics, 
  GamePerformanceMetrics, 
  ReferralMetrics, 
  PlatformOverview,
  TimeRange 
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  // Mock data storage - replace with actual database queries
  private mockData = {
    totalUsers: 15420,
    totalMatches: 42180,
    totalVolume: 1247.89, // SOL
    totalRevenue: 81.11, // SOL (6.5% of volume)
    monthlyGrowth: {
      users: 23.4,
      revenue: 31.2,
      matches: 28.7,
    }
  };

  async getRevenueMetrics(query: AnalyticsQueryDto): Promise<RevenueMetrics> {
    // Mock revenue data based on 6.5% platform fee structure
    const baseRevenue = this.getBaseRevenueForTimeRange(query.timeRange || TimeRange.DAY);
    
    return {
      totalRevenue: baseRevenue,
      platformFees: baseRevenue * 0.846, // 5.5% of total volume
      referralPayouts: baseRevenue * 0.154, // 1% of total volume
      netRevenue: baseRevenue * 0.846,
      transactionCount: Math.floor(baseRevenue * 15.6), // Avg 0.064 SOL per transaction
      averageTransactionValue: 0.064,
      revenueByGame: this.getMockGameRevenue(),
      revenueByHour: this.getMockHourlyRevenue(),
    };
  }

  async getUserActivityMetrics(query: AnalyticsQueryDto): Promise<UserActivityMetrics> {
    const timeMultiplier = this.getTimeMultiplier(query.timeRange || TimeRange.DAY);
    
    return {
      totalUsers: Math.floor(this.mockData.totalUsers * timeMultiplier),
      activeUsers: Math.floor(this.mockData.totalUsers * 0.12 * timeMultiplier), // 12% daily active
      newUsers: Math.floor(this.mockData.totalUsers * 0.03 * timeMultiplier), // 3% new daily
      returningUsers: Math.floor(this.mockData.totalUsers * 0.09 * timeMultiplier), // 9% returning
      dailyActiveUsers: this.getMockDailyActiveUsers(),
      userRetention: {
        day1: 0.67, // 67%
        day7: 0.34, // 34%
        day30: 0.18, // 18%
      },
      avgSessionDuration: 847, // seconds
      avgMatchesPerUser: 2.7,
    };
  }

  async getGamePerformanceMetrics(query: AnalyticsQueryDto): Promise<GamePerformanceMetrics> {
    const timeMultiplier = this.getTimeMultiplier(query.timeRange || TimeRange.DAY);
    
    return {
      totalMatches: Math.floor(this.mockData.totalMatches * timeMultiplier),
      averageMatchDuration: 312, // seconds
      completionRate: 0.934, // 93.4%
      disputeRate: 0.023, // 2.3%
      popularGames: this.getMockPopularGames(),
      peakHours: this.getMockPeakHours(),
    };
  }

  async getReferralMetrics(query: AnalyticsQueryDto): Promise<ReferralMetrics> {
    const timeMultiplier = this.getTimeMultiplier(query.timeRange || TimeRange.DAY);
    
    return {
      totalReferrals: Math.floor(234 * timeMultiplier),
      activeReferrers: Math.floor(89 * timeMultiplier),
      totalReferralRevenue: 12.47 * timeMultiplier, // SOL
      averageReferralValue: 0.053, // SOL
      topReferrers: this.getMockTopReferrers(),
      conversionRate: 0.78, // 78%
    };
  }

  async getPlatformOverview(query: AnalyticsQueryDto): Promise<PlatformOverview> {
    return {
      totalUsers: this.mockData.totalUsers,
      totalMatches: this.mockData.totalMatches,
      totalVolume: this.mockData.totalVolume,
      totalRevenue: this.mockData.totalRevenue,
      growthRate: this.mockData.monthlyGrowth,
      healthScore: 0.87, // 87% platform health score
    };
  }

  async getCustomMetrics(query: AnalyticsQueryDto): Promise<any> {
    // Flexible endpoint for custom analytics queries
    const timeRange = query.timeRange || TimeRange.DAY;
    
    return {
      query,
      timeRange,
      customData: {
        peakConcurrentUsers: 423,
        averageWaitTime: 4.2, // seconds
        serverUptime: 0.9987,
        errorRate: 0.0008,
        avgResponseTime: 67, // ms
      },
      generated: new Date(),
    };
  }

  // Helper methods for mock data generation
  private getBaseRevenueForTimeRange(timeRange: TimeRange): number {
    const baseDaily = 2.84; // SOL per day
    
    switch (timeRange) {
      case TimeRange.HOUR:
        return baseDaily / 24;
      case TimeRange.DAY:
        return baseDaily;
      case TimeRange.WEEK:
        return baseDaily * 7;
      case TimeRange.MONTH:
        return baseDaily * 30;
      case TimeRange.QUARTER:
        return baseDaily * 90;
      case TimeRange.YEAR:
        return baseDaily * 365;
      default:
        return baseDaily;
    }
  }

  private getTimeMultiplier(timeRange: TimeRange): number {
    switch (timeRange) {
      case TimeRange.HOUR:
        return 1/24;
      case TimeRange.DAY:
        return 1;
      case TimeRange.WEEK:
        return 7;
      case TimeRange.MONTH:
        return 30;
      case TimeRange.QUARTER:
        return 90;
      case TimeRange.YEAR:
        return 365;
      default:
        return 1;
    }
  }

  private getMockGameRevenue() {
    return [
      {
        gameId: 'game_rps',
        gameName: 'Rock Paper Scissors',
        totalVolume: 89.34,
        matchCount: 1247,
        revenue: 5.81,
        averageMatchValue: 0.072,
      },
      {
        gameId: 'game_ttt',
        gameName: 'Tic Tac Toe',
        totalVolume: 56.78,
        matchCount: 892,
        revenue: 3.69,
        averageMatchValue: 0.064,
      },
      {
        gameId: 'game_coinflip',
        gameName: 'Coin Flip',
        totalVolume: 123.45,
        matchCount: 2891,
        revenue: 8.02,
        averageMatchValue: 0.043,
      },
    ];
  }

  private getMockHourlyRevenue() {
    const hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      hours.push({
        hour: hour.toISOString(),
        revenue: Math.random() * 0.5 + 0.05, // 0.05-0.55 SOL per hour
        transactionCount: Math.floor(Math.random() * 50 + 5), // 5-55 transactions
      });
    }
    
    return hours;
  }

  private getMockDailyActiveUsers() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      days.push(Math.floor(Math.random() * 200 + 800)); // 800-1000 DAU
    }
    return days;
  }

  private getMockPopularGames() {
    return [
      {
        gameId: 'game_coinflip',
        gameName: 'Coin Flip',
        matchCount: 2891,
        totalVolume: 123.45,
        averageRating: 4.2,
        uniquePlayers: 1247,
      },
      {
        gameId: 'game_rps',
        gameName: 'Rock Paper Scissors',
        matchCount: 1247,
        totalVolume: 89.34,
        averageRating: 4.5,
        uniquePlayers: 892,
      },
      {
        gameId: 'game_ttt',
        gameName: 'Tic Tac Toe',
        matchCount: 892,
        totalVolume: 56.78,
        averageRating: 4.1,
        uniquePlayers: 634,
      },
    ];
  }

  private getMockPeakHours() {
    return [
      { hour: 20, matchCount: 145, activeUsers: 423 }, // 8 PM
      { hour: 21, matchCount: 132, activeUsers: 398 }, // 9 PM
      { hour: 19, matchCount: 128, activeUsers: 387 }, // 7 PM
      { hour: 22, matchCount: 98, activeUsers: 312 },  // 10 PM
      { hour: 18, matchCount: 87, activeUsers: 289 },  // 6 PM
    ];
  }

  private getMockTopReferrers() {
    return [
      {
        walletAddress: 'Ref1...xyz',
        referralCount: 34,
        totalEarnings: 2.14,
        conversionRate: 0.89,
      },
      {
        walletAddress: 'Ref2...abc',
        referralCount: 28,
        totalEarnings: 1.67,
        conversionRate: 0.82,
      },
      {
        walletAddress: 'Ref3...def',
        referralCount: 23,
        totalEarnings: 1.45,
        conversionRate: 0.76,
      },
    ];
  }

  // Method to track real-time events (called by other services)
  trackEvent(eventType: string, data: any): void {
    console.log(`📊 Analytics Event: ${eventType}`, data);
    // TODO: Store event in time-series database for analytics
  }

  // Method to track user action
  trackUserAction(walletAddress: string, action: string, metadata?: any): void {
    this.trackEvent('user_action', {
      walletAddress,
      action,
      metadata,
      timestamp: new Date(),
    });
  }

  // Method to track financial transaction
  trackTransaction(from: string, to: string, amount: number, type: string): void {
    this.trackEvent('transaction', {
      from,
      to,
      amount,
      type,
      timestamp: new Date(),
    });
  }
} 