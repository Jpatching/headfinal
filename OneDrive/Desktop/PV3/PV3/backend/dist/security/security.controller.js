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
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const security_service_1 = require("./security.service");
const security_dto_1 = require("./dto/security.dto");
const auth_service_1 = require("../auth/auth.service");
let SecurityController = class SecurityController {
    constructor(securityService, authService) {
        this.securityService = securityService;
        this.authService = authService;
    }
    async reportCheat(auth, reportCheatDto) {
        const session = await this.validateSession(auth);
        const report = await this.securityService.reportCheat(session.wallet, reportCheatDto);
        return { report };
    }
    async getPlayerReports(wallet) {
        const reports = await this.securityService.getPlayerReports(wallet);
        return { reports };
    }
    async disputeResult(auth, disputeResultDto) {
        const session = await this.validateSession(auth);
        const dispute = await this.securityService.disputeResult(session.wallet, disputeResultDto);
        return { dispute };
    }
    async getMatchAuditLog(matchId) {
        const auditLog = await this.securityService.getMatchAuditLog(matchId);
        return { auditLog };
    }
    async getBannedPlayers() {
        const bannedPlayers = await this.securityService.getBannedPlayers();
        return { bannedPlayers };
    }
    async verifySignature(body) {
        const isValid = await this.securityService.verifySignature(body.signature, body.message, body.publicKey);
        return { valid: isValid };
    }
    async getSecurityStats() {
        const stats = await this.securityService.getSecurityStats();
        return { stats };
    }
    async validateSession(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const sessionId = authHeader.substring(7);
        const session = await this.authService.validateSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        return session;
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, common_1.Post)('report-cheat'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, security_dto_1.ReportCheatDto]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "reportCheat", null);
__decorate([
    (0, common_1.Get)('player-reports/:wallet'),
    __param(0, (0, common_1.Param)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getPlayerReports", null);
__decorate([
    (0, common_1.Post)('dispute-result'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, security_dto_1.DisputeResultDto]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "disputeResult", null);
__decorate([
    (0, common_1.Get)('match-audit/:matchId'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getMatchAuditLog", null);
__decorate([
    (0, common_1.Get)('banned-players'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getBannedPlayers", null);
__decorate([
    (0, common_1.Post)('verify-signature'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "verifySignature", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityStats", null);
exports.SecurityController = SecurityController = __decorate([
    (0, common_1.Controller)('security'),
    __metadata("design:paramtypes", [security_service_1.SecurityService,
        auth_service_1.AuthService])
], SecurityController);
//# sourceMappingURL=security.controller.js.map