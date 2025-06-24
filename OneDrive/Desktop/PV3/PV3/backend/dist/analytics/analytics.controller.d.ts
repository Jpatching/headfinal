import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';
import { AuthService } from '../auth/auth.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly authService;
    constructor(analyticsService: AnalyticsService, authService: AuthService);
    getRevenueMetrics(auth: string, query: AnalyticsQueryDto): Promise<{
        metrics: import("./dto/analytics.dto").RevenueMetrics;
    }>;
    getUserActivityMetrics(auth: string, query: AnalyticsQueryDto): Promise<{
        metrics: import("./dto/analytics.dto").UserActivityMetrics;
    }>;
    getGamePerformanceMetrics(auth: string, query: AnalyticsQueryDto): Promise<{
        metrics: import("./dto/analytics.dto").GamePerformanceMetrics;
    }>;
    getReferralMetrics(auth: string, query: AnalyticsQueryDto): Promise<{
        metrics: import("./dto/analytics.dto").ReferralMetrics;
    }>;
    getPlatformOverview(auth: string, query: AnalyticsQueryDto): Promise<{
        overview: import("./dto/analytics.dto").PlatformOverview;
    }>;
    getCustomMetrics(auth: string, query: AnalyticsQueryDto): Promise<{
        metrics: any;
    }>;
    getPublicStats(): Promise<{
        stats: {
            totalUsers: number;
            totalMatches: number;
            totalVolume: number;
            healthScore: number;
        };
    }>;
    private validateSession;
}
