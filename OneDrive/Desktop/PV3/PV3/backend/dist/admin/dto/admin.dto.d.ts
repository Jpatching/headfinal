export declare enum SystemStatus {
    ACTIVE = "active",
    MAINTENANCE = "maintenance",
    EMERGENCY = "emergency"
}
export declare class BanPlayerDto {
    walletAddress: string;
    reason: string;
    durationHours?: number;
}
export declare class SystemMaintenanceDto {
    status: SystemStatus;
    message?: string;
    estimatedDurationMinutes?: number;
}
export declare class FeeUpdateDto {
    platformFeePercentage: number;
    referralFeePercentage: number;
}
export declare class EmergencyWithdrawDto {
    userWallet: string;
    destinationWallet: string;
    reason: string;
}
export interface AdminDashboard {
    totalUsers: number;
    activeUsers24h: number;
    totalMatches: number;
    totalVolume: number;
    platformRevenue: number;
    pendingReports: number;
    systemStatus: SystemStatus;
    lastUpdated: Date;
}
export interface UserAction {
    id: string;
    adminWallet: string;
    targetUser: string;
    action: string;
    reason: string;
    timestamp: Date;
    reversible: boolean;
}
export interface SystemAlert {
    id: string;
    type: 'security' | 'financial' | 'technical' | 'user';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
}
