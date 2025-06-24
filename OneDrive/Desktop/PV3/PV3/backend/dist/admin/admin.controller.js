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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./dto/admin.dto");
const auth_service_1 = require("../auth/auth.service");
let AdminController = class AdminController {
    constructor(adminService, authService) {
        this.adminService = adminService;
        this.authService = authService;
    }
    async getDashboard(auth) {
        await this.validateAdminSession(auth);
        const dashboard = await this.adminService.getDashboard();
        return { dashboard };
    }
    async banPlayer(auth, banPlayerDto) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.banPlayer(session.wallet, banPlayerDto);
    }
    async unbanPlayer(auth, body) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.unbanPlayer(session.wallet, body.walletAddress, body.reason);
    }
    async setSystemMaintenance(auth, maintenanceDto) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.setSystemMaintenance(session.wallet, maintenanceDto);
    }
    async updateFees(auth, feeUpdateDto) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.updateFees(session.wallet, feeUpdateDto);
    }
    async emergencyWithdraw(auth, withdrawDto) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.emergencyWithdraw(session.wallet, withdrawDto);
    }
    async getUserActions(auth) {
        await this.validateAdminSession(auth);
        const actions = await this.adminService.getUserActions();
        return { actions };
    }
    async getSystemAlerts(auth) {
        await this.validateAdminSession(auth);
        const alerts = await this.adminService.getSystemAlerts();
        return { alerts };
    }
    async acknowledgeAlert(auth, id) {
        const session = await this.validateAdminSession(auth);
        return this.adminService.acknowledgeAlert(session.wallet, id);
    }
    async getSystemStatus() {
        return this.adminService.getSystemStatus();
    }
    async getFeeStructure() {
        return this.adminService.getFeeStructure();
    }
    async getSystemHealth(auth) {
        await this.validateAdminSession(auth);
        const health = await this.adminService.getSystemHealth();
        return { health };
    }
    async validateAdminSession(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const sessionId = authHeader.substring(7);
        const session = await this.authService.validateSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        if (!this.adminService.isAdmin(session.wallet)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        return session;
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('ban-player'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.BanPlayerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banPlayer", null);
__decorate([
    (0, common_1.Post)('unban-player'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unbanPlayer", null);
__decorate([
    (0, common_1.Post)('system-maintenance'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.SystemMaintenanceDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setSystemMaintenance", null);
__decorate([
    (0, common_1.Post)('update-fees'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.FeeUpdateDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateFees", null);
__decorate([
    (0, common_1.Post)('emergency-withdraw'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.EmergencyWithdrawDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "emergencyWithdraw", null);
__decorate([
    (0, common_1.Get)('user-actions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserActions", null);
__decorate([
    (0, common_1.Get)('system-alerts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemAlerts", null);
__decorate([
    (0, common_1.Post)('acknowledge-alert/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, common_1.Get)('system-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemStatus", null);
__decorate([
    (0, common_1.Get)('fee-structure'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFeeStructure", null);
__decorate([
    (0, common_1.Get)('system-health'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        auth_service_1.AuthService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map