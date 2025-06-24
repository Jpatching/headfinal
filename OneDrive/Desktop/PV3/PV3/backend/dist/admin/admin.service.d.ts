import { BanPlayerDto, SystemMaintenanceDto, FeeUpdateDto, EmergencyWithdrawDto, AdminDashboard, UserAction, SystemAlert, SystemStatus } from './dto/admin.dto';
import { SecurityService } from '../security/security.service';
import { SolanaService } from '../solana/solana.service';
export declare class AdminService {
    private readonly securityService;
    private readonly solanaService;
    private readonly adminWallets;
    private systemStatus;
    private maintenanceMessage;
    private platformFeePercentage;
    private referralFeePercentage;
    private userActions;
    private systemAlerts;
    constructor(securityService: SecurityService, solanaService: SolanaService);
    getDashboard(): Promise<AdminDashboard>;
    banPlayer(adminWallet: string, banPlayerDto: BanPlayerDto): Promise<{
        success: boolean;
    }>;
    unbanPlayer(adminWallet: string, walletAddress: string, reason: string): Promise<{
        success: boolean;
    }>;
    setSystemMaintenance(adminWallet: string, maintenanceDto: SystemMaintenanceDto): Promise<{
        success: boolean;
    }>;
    updateFees(adminWallet: string, feeUpdateDto: FeeUpdateDto): Promise<{
        success: boolean;
    }>;
    emergencyWithdraw(adminWallet: string, withdrawDto: EmergencyWithdrawDto): Promise<{
        success: boolean;
        txHash?: string;
    }>;
    getUserActions(): Promise<UserAction[]>;
    getSystemAlerts(): Promise<SystemAlert[]>;
    acknowledgeAlert(adminWallet: string, alertId: string): Promise<{
        success: boolean;
    }>;
    getSystemStatus(): Promise<{
        status: SystemStatus;
        message: string;
    }>;
    getFeeStructure(): Promise<{
        platformFee: number;
        referralFee: number;
    }>;
    getSystemHealth(): Promise<any>;
    private validateAdmin;
    private logUserAction;
    private addSystemAlert;
    addAdminWallet(walletAddress: string): void;
    isAdmin(walletAddress: string): boolean;
}
