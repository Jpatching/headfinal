"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const admin_dto_1 = require("./dto/admin.dto");
const security_service_1 = require("../security/security.service");
const solana_service_1 = require("../solana/solana.service");
let AdminService = class AdminService {
    constructor(securityService, solanaService) {
        this.securityService = securityService;
        this.solanaService = solanaService;
        this.adminWallets = new Set([
            'ADMIN_WALLET_1',
            'ADMIN_WALLET_2',
        ]);
        this.systemStatus = admin_dto_1.SystemStatus.ACTIVE;
        this.maintenanceMessage = '';
        this.platformFeePercentage = 5.5;
        this.referralFeePercentage = 1.0;
        this.userActions = [];
        this.systemAlerts = [];
        this.addSystemAlert('technical', 'low', 'System initialized successfully');
    }
    async getDashboard() {
        return {
            totalUsers: 1250,
            activeUsers24h: 89,
            totalMatches: 3420,
            totalVolume: 45.67,
            platformRevenue: 2.51,
            pendingReports: 3,
            systemStatus: this.systemStatus,
            lastUpdated: new Date(),
        };
    }
    async banPlayer(adminWallet, banPlayerDto) {
        this.validateAdmin(adminWallet);
        const result = await this.securityService.banPlayer(banPlayerDto.walletAddress, banPlayerDto.reason);
        this.logUserAction(adminWallet, banPlayerDto.walletAddress, 'ban', banPlayerDto.reason, false);
        this.addSystemAlert('security', 'medium', `Player banned: ${banPlayerDto.walletAddress}`);
        console.log(`🔨 Admin ${adminWallet} banned ${banPlayerDto.walletAddress} - Reason: ${banPlayerDto.reason}`);
        return result;
    }
    async unbanPlayer(adminWallet, walletAddress, reason) {
        this.validateAdmin(adminWallet);
        const result = await this.securityService.unbanPlayer(walletAddress);
        this.logUserAction(adminWallet, walletAddress, 'unban', reason, false);
        console.log(`✅ Admin ${adminWallet} unbanned ${walletAddress} - Reason: ${reason}`);
        return result;
    }
    async setSystemMaintenance(adminWallet, maintenanceDto) {
        this.validateAdmin(adminWallet);
        this.systemStatus = maintenanceDto.status;
        this.maintenanceMessage = maintenanceDto.message || '';
        this.logUserAction(adminWallet, 'SYSTEM', 'maintenance_mode', `Status: ${maintenanceDto.status}`, true);
        const severity = maintenanceDto.status === admin_dto_1.SystemStatus.EMERGENCY ? 'critical' : 'high';
        this.addSystemAlert('technical', severity, `System status changed to: ${maintenanceDto.status}`);
        console.log(`⚠️ Admin ${adminWallet} set system status to: ${maintenanceDto.status}`);
        return { success: true };
    }
    async updateFees(adminWallet, feeUpdateDto) {
        this.validateAdmin(adminWallet);
        const oldPlatformFee = this.platformFeePercentage;
        const oldReferralFee = this.referralFeePercentage;
        this.platformFeePercentage = feeUpdateDto.platformFeePercentage;
        this.referralFeePercentage = feeUpdateDto.referralFeePercentage;
        const reason = `Platform: ${oldPlatformFee}% → ${feeUpdateDto.platformFeePercentage}%, Referral: ${oldReferralFee}% → ${feeUpdateDto.referralFeePercentage}%`;
        this.logUserAction(adminWallet, 'SYSTEM', 'fee_update', reason, true);
        this.addSystemAlert('financial', 'high', `Fee structure updated: Platform ${feeUpdateDto.platformFeePercentage}%, Referral ${feeUpdateDto.referralFeePercentage}%`);
        console.log(`💰 Admin ${adminWallet} updated fees - ${reason}`);
        return { success: true };
    }
    async emergencyWithdraw(adminWallet, withdrawDto) {
        this.validateAdmin(adminWallet);
        this.logUserAction(adminWallet, withdrawDto.userWallet, 'emergency_withdraw', `To: ${withdrawDto.destinationWallet} - ${withdrawDto.reason}`, false);
        this.addSystemAlert('financial', 'critical', `Emergency withdrawal executed for ${withdrawDto.userWallet}`);
        console.log(`🚨 Admin ${adminWallet} executed emergency withdrawal for ${withdrawDto.userWallet}`);
        return { success: true, txHash: 'mock_tx_hash_' + Date.now() };
    }
    async getUserActions() {
        return this.userActions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
    }
    async getSystemAlerts() {
        return this.systemAlerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 20);
    }
    async acknowledgeAlert(adminWallet, alertId) {
        this.validateAdmin(adminWallet);
        const alert = this.systemAlerts.find(a => a.id === alertId);
        if (!alert) {
            throw new common_1.BadRequestException('Alert not found');
        }
        alert.acknowledged = true;
        alert.acknowledgedBy = adminWallet;
        console.log(`✅ Admin ${adminWallet} acknowledged alert: ${alert.message}`);
        return { success: true };
    }
    async getSystemStatus() {
        return {
            status: this.systemStatus,
            message: this.maintenanceMessage,
        };
    }
    async getFeeStructure() {
        return {
            platformFee: this.platformFeePercentage,
            referralFee: this.referralFeePercentage,
        };
    }
    async getSystemHealth() {
        return {
            database: 'healthy',
            solana: 'healthy',
            redis: 'not_configured',
            websocket: 'healthy',
            lastCheck: new Date(),
        };
    }
    validateAdmin(walletAddress) {
        if (!this.adminWallets.has(walletAddress)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
    }
    logUserAction(adminWallet, targetUser, action, reason, reversible) {
        const userAction = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            adminWallet,
            targetUser,
            action,
            reason,
            timestamp: new Date(),
            reversible,
        };
        this.userActions.push(userAction);
        if (this.userActions.length > 1000) {
            this.userActions = this.userActions.slice(-1000);
        }
    }
    addSystemAlert(type, severity, message) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type,
            severity,
            message,
            timestamp: new Date(),
            acknowledged: false,
        };
        this.systemAlerts.push(alert);
        if (this.systemAlerts.length > 100) {
            this.systemAlerts = this.systemAlerts.slice(-100);
        }
    }
    addAdminWallet(walletAddress) {
        this.adminWallets.add(walletAddress);
        console.log(`🔑 Added admin wallet: ${walletAddress}`);
    }
    isAdmin(walletAddress) {
        return this.adminWallets.has(walletAddress);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_service_1.SecurityService,
        solana_service_1.SolanaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map