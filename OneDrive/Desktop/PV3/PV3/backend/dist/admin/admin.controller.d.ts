import { AdminService } from './admin.service';
import { BanPlayerDto, SystemMaintenanceDto, FeeUpdateDto, EmergencyWithdrawDto } from './dto/admin.dto';
import { AuthService } from '../auth/auth.service';
export declare class AdminController {
    private readonly adminService;
    private readonly authService;
    constructor(adminService: AdminService, authService: AuthService);
    getDashboard(auth: string): Promise<{
        dashboard: import("./dto/admin.dto").AdminDashboard;
    }>;
    banPlayer(auth: string, banPlayerDto: BanPlayerDto): Promise<{
        success: boolean;
    }>;
    unbanPlayer(auth: string, body: {
        walletAddress: string;
        reason: string;
    }): Promise<{
        success: boolean;
    }>;
    setSystemMaintenance(auth: string, maintenanceDto: SystemMaintenanceDto): Promise<{
        success: boolean;
    }>;
    updateFees(auth: string, feeUpdateDto: FeeUpdateDto): Promise<{
        success: boolean;
    }>;
    emergencyWithdraw(auth: string, withdrawDto: EmergencyWithdrawDto): Promise<{
        success: boolean;
        txHash?: string;
    }>;
    getUserActions(auth: string): Promise<{
        actions: import("./dto/admin.dto").UserAction[];
    }>;
    getSystemAlerts(auth: string): Promise<{
        alerts: import("./dto/admin.dto").SystemAlert[];
    }>;
    acknowledgeAlert(auth: string, id: string): Promise<{
        success: boolean;
    }>;
    getSystemStatus(): Promise<{
        status: import("./dto/admin.dto").SystemStatus;
        message: string;
    }>;
    getFeeStructure(): Promise<{
        platformFee: number;
        referralFee: number;
    }>;
    getSystemHealth(auth: string): Promise<{
        health: any;
    }>;
    private validateAdminSession;
}
