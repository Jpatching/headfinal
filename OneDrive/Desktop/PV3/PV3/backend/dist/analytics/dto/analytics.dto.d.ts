export declare enum TimeRange {
    HOUR = "1h",
    DAY = "24h",
    WEEK = "7d",
    MONTH = "30d",
    QUARTER = "90d",
    YEAR = "1y"
}
export declare enum MetricType {
    REVENUE = "revenue",
    USER_ACTIVITY = "user_activity",
    GAME_PERFORMANCE = "game_performance",
    REFERRAL_PERFORMANCE = "referral_performance"
}
export declare class AnalyticsQueryDto {
    timeRange?: TimeRange;
    metricType?: MetricType;
    startDate?: string;
    endDate?: string;
    gameId?: string;
}
export interface RevenueMetrics {
    totalRevenue: number;
    platformFees: number;
    referralPayouts: number;
    netRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
    revenueByGame: GameRevenueBreakdown[];
    revenueByHour: HourlyRevenue[];
}
export interface GameRevenueBreakdown {
    gameId: string;
    gameName: string;
    totalVolume: number;
    matchCount: number;
    revenue: number;
    averageMatchValue: number;
}
export interface HourlyRevenue {
    hour: string;
    revenue: number;
    transactionCount: number;
}
export interface UserActivityMetrics {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    dailyActiveUsers: number[];
    userRetention: {
        day1: number;
        day7: number;
        day30: number;
    };
    avgSessionDuration: number;
    avgMatchesPerUser: number;
}
export interface GamePerformanceMetrics {
    totalMatches: number;
    averageMatchDuration: number;
    completionRate: number;
    disputeRate: number;
    popularGames: PopularGame[];
    peakHours: PeakHour[];
}
export interface PopularGame {
    gameId: string;
    gameName: string;
    matchCount: number;
    totalVolume: number;
    averageRating: number;
    uniquePlayers: number;
}
export interface PeakHour {
    hour: number;
    matchCount: number;
    activeUsers: number;
}
export interface ReferralMetrics {
    totalReferrals: number;
    activeReferrers: number;
    totalReferralRevenue: number;
    averageReferralValue: number;
    topReferrers: TopReferrer[];
    conversionRate: number;
}
export interface TopReferrer {
    walletAddress: string;
    referralCount: number;
    totalEarnings: number;
    conversionRate: number;
}
export interface PlatformOverview {
    totalUsers: number;
    totalMatches: number;
    totalVolume: number;
    totalRevenue: number;
    growthRate: {
        users: number;
        revenue: number;
        matches: number;
    };
    healthScore: number;
}
