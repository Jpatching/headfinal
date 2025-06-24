import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { BanPlayerDto, SystemMaintenanceDto, FeeUpdateDto, EmergencyWithdrawDto, AdminDashboard, UserAction, SystemAlert, SystemStatus } from './dto/admin.dto';
import { SecurityService } from '../security/security.service';
import { SolanaService } from '../solana/solana.service';

@Injectable()
export class AdminService {
  // Admin wallet addresses - in production, store these securely
  private readonly adminWallets = new Set([
    'ADMIN_WALLET_1', // Replace with actual admin wallets
    'ADMIN_WALLET_2',
  ]);

  // In-memory storage for development
  private systemStatus: SystemStatus = SystemStatus.ACTIVE;
  private maintenanceMessage: string = '';
  private platformFeePercentage: number = 5.5;
  private referralFeePercentage: number = 1.0;
  private userActions: UserAction[] = [];
  private systemAlerts: SystemAlert[] = [];

  constructor(
    private readonly securityService: SecurityService,
    private readonly solanaService: SolanaService,
  ) {
    // Initialize with some mock alerts
    this.addSystemAlert('technical', 'low', 'System initialized successfully');
  }

  async getDashboard(): Promise<AdminDashboard> {
    // Mock data - replace with actual database queries
    return {
      totalUsers: 1250,
      activeUsers24h: 89,
      totalMatches: 3420,
      totalVolume: 45.67, // SOL
      platformRevenue: 2.51, // SOL
      pendingReports: 3,
      systemStatus: this.systemStatus,
      lastUpdated: new Date(),
    };
  }

  async banPlayer(adminWallet: string, banPlayerDto: BanPlayerDto): Promise<{ success: boolean }> {
    this.validateAdmin(adminWallet);

    const result = await this.securityService.banPlayer(banPlayerDto.walletAddress, banPlayerDto.reason);
    
    // Log admin action
    this.logUserAction(adminWallet, banPlayerDto.walletAddress, 'ban', banPlayerDto.reason, false);
    
    // Create system alert
    this.addSystemAlert('security', 'medium', `Player banned: ${banPlayerDto.walletAddress}`);

    console.log(`🔨 Admin ${adminWallet} banned ${banPlayerDto.walletAddress} - Reason: ${banPlayerDto.reason}`);
    return result;
  }

  async unbanPlayer(adminWallet: string, walletAddress: string, reason: string): Promise<{ success: boolean }> {
    this.validateAdmin(adminWallet);

    const result = await this.securityService.unbanPlayer(walletAddress);
    
    // Log admin action
    this.logUserAction(adminWallet, walletAddress, 'unban', reason, false);

    console.log(`✅ Admin ${adminWallet} unbanned ${walletAddress} - Reason: ${reason}`);
    return result;
  }

  async setSystemMaintenance(adminWallet: string, maintenanceDto: SystemMaintenanceDto): Promise<{ success: boolean }> {
    this.validateAdmin(adminWallet);

    this.systemStatus = maintenanceDto.status;
    this.maintenanceMessage = maintenanceDto.message || '';

    // Log admin action
    this.logUserAction(adminWallet, 'SYSTEM', 'maintenance_mode', `Status: ${maintenanceDto.status}`, true);

    // Create system alert
    const severity = maintenanceDto.status === SystemStatus.EMERGENCY ? 'critical' : 'high';
    this.addSystemAlert('technical', severity, `System status changed to: ${maintenanceDto.status}`);

    console.log(`⚠️ Admin ${adminWallet} set system status to: ${maintenanceDto.status}`);
    return { success: true };
  }

  async updateFees(adminWallet: string, feeUpdateDto: FeeUpdateDto): Promise<{ success: boolean }> {
    this.validateAdmin(adminWallet);

    const oldPlatformFee = this.platformFeePercentage;
    const oldReferralFee = this.referralFeePercentage;

    this.platformFeePercentage = feeUpdateDto.platformFeePercentage;
    this.referralFeePercentage = feeUpdateDto.referralFeePercentage;

    // Log admin action
    const reason = `Platform: ${oldPlatformFee}% → ${feeUpdateDto.platformFeePercentage}%, Referral: ${oldReferralFee}% → ${feeUpdateDto.referralFeePercentage}%`;
    this.logUserAction(adminWallet, 'SYSTEM', 'fee_update', reason, true);

    // Create system alert
    this.addSystemAlert('financial', 'high', `Fee structure updated: Platform ${feeUpdateDto.platformFeePercentage}%, Referral ${feeUpdateDto.referralFeePercentage}%`);

    console.log(`💰 Admin ${adminWallet} updated fees - ${reason}`);
    return { success: true };
  }

  async emergencyWithdraw(adminWallet: string, withdrawDto: EmergencyWithdrawDto): Promise<{ success: boolean; txHash?: string }> {
    this.validateAdmin(adminWallet);

    // TODO: Implement actual emergency withdrawal logic
    // const txHash = await this.solanaService.emergencyWithdraw(
    //   withdrawDto.userWallet,
    //   withdrawDto.destinationWallet
    // );

    // Log admin action
    this.logUserAction(
      adminWallet, 
      withdrawDto.userWallet, 
      'emergency_withdraw', 
      `To: ${withdrawDto.destinationWallet} - ${withdrawDto.reason}`, 
      false
    );

    // Create critical system alert
    this.addSystemAlert('financial', 'critical', `Emergency withdrawal executed for ${withdrawDto.userWallet}`);

    console.log(`🚨 Admin ${adminWallet} executed emergency withdrawal for ${withdrawDto.userWallet}`);
    return { success: true, txHash: 'mock_tx_hash_' + Date.now() };
  }

  async getUserActions(): Promise<UserAction[]> {
    return this.userActions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Last 50 actions
  }

  async getSystemAlerts(): Promise<SystemAlert[]> {
    return this.systemAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20); // Last 20 alerts
  }

  async acknowledgeAlert(adminWallet: string, alertId: string): Promise<{ success: boolean }> {
    this.validateAdmin(adminWallet);

    const alert = this.systemAlerts.find(a => a.id === alertId);
    if (!alert) {
      throw new BadRequestException('Alert not found');
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = adminWallet;

    console.log(`✅ Admin ${adminWallet} acknowledged alert: ${alert.message}`);
    return { success: true };
  }

  async getSystemStatus(): Promise<{ status: SystemStatus; message: string }> {
    return {
      status: this.systemStatus,
      message: this.maintenanceMessage,
    };
  }

  async getFeeStructure(): Promise<{ platformFee: number; referralFee: number }> {
    return {
      platformFee: this.platformFeePercentage,
      referralFee: this.referralFeePercentage,
    };
  }

  // Platform health checks
  async getSystemHealth(): Promise<any> {
    // TODO: Implement actual health checks
    return {
      database: 'healthy',
      solana: 'healthy',
      redis: 'not_configured',
      websocket: 'healthy',
      lastCheck: new Date(),
    };
  }

  private validateAdmin(walletAddress: string): void {
    if (!this.adminWallets.has(walletAddress)) {
      throw new UnauthorizedException('Admin access required');
    }
  }

  private logUserAction(adminWallet: string, targetUser: string, action: string, reason: string, reversible: boolean): void {
    const userAction: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      adminWallet,
      targetUser,
      action,
      reason,
      timestamp: new Date(),
      reversible,
    };

    this.userActions.push(userAction);

    // Keep only last 1000 actions
    if (this.userActions.length > 1000) {
      this.userActions = this.userActions.slice(-1000);
    }
  }

  private addSystemAlert(type: SystemAlert['type'], severity: SystemAlert['severity'], message: string): void {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.systemAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.systemAlerts.length > 100) {
      this.systemAlerts = this.systemAlerts.slice(-100);
    }
  }

  // Helper method to add admin wallet (for testing)
  addAdminWallet(walletAddress: string): void {
    this.adminWallets.add(walletAddress);
    console.log(`🔑 Added admin wallet: ${walletAddress}`);
  }

  // Helper method to check if user is admin
  isAdmin(walletAddress: string): boolean {
    return this.adminWallets.has(walletAddress);
  }
} 