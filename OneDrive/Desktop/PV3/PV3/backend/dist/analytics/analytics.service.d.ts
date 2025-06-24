import { AnalyticsQueryDto, RevenueMetrics, UserActivityMetrics, GamePerformanceMetrics, ReferralMetrics, PlatformOverview } from './dto/analytics.dto';
export declare class AnalyticsService {
    private mockData;
    getRevenueMetrics(query: AnalyticsQueryDto): Promise<RevenueMetrics>;
    getUserActivityMetrics(query: AnalyticsQueryDto): Promise<UserActivityMetrics>;
    getGamePerformanceMetrics(query: AnalyticsQueryDto): Promise<GamePerformanceMetrics>;
    getReferralMetrics(query: AnalyticsQueryDto): Promise<ReferralMetrics>;
    getPlatformOverview(query: AnalyticsQueryDto): Promise<PlatformOverview>;
    getCustomMetrics(query: AnalyticsQueryDto): Promise<any>;
    private getBaseRevenueForTimeRange;
    private getTimeMultiplier;
    private getMockGameRevenue;
    private getMockHourlyRevenue;
    private getMockDailyActiveUsers;
    private getMockPopularGames;
    private getMockPeakHours;
    private getMockTopReferrers;
    trackEvent(eventType: string, data: any): void;
    trackUserAction(walletAddress: string, action: string, metadata?: any): void;
    trackTransaction(from: string, to: string, amount: number, type: string): void;
}
