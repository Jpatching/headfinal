"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const security_dto_1 = require("./dto/security.dto");
let SecurityService = class SecurityService {
    constructor() {
        this.reports = new Map();
        this.disputes = new Map();
        this.bannedUsers = new Set();
    }
    async reportCheat(reporterId, reportCheatDto) {
        const reportId = this.generateReportId();
        const report = {
            id: reportId,
            reporterId,
            reportedUser: reportCheatDto.reportedUser,
            type: reportCheatDto.type,
            description: reportCheatDto.description,
            matchId: reportCheatDto.matchId,
            evidence: reportCheatDto.evidence || [],
            status: security_dto_1.ReportStatus.PENDING,
            createdAt: new Date(),
        };
        this.reports.set(reportId, report);
        console.log(`🚨 Cheat report filed: ${reporterId} reports ${reportCheatDto.reportedUser} for ${reportCheatDto.type}`);
        if (reportCheatDto.type === security_dto_1.ReportType.CHEATING || reportCheatDto.type === security_dto_1.ReportType.EXPLOIT) {
            report.status = security_dto_1.ReportStatus.INVESTIGATING;
        }
        return report;
    }
    async getPlayerReports(walletAddress) {
        return Array.from(this.reports.values())
            .filter(report => report.reportedUser === walletAddress)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async disputeResult(disputerId, disputeResultDto) {
        const disputeId = this.generateDisputeId();
        const dispute = {
            id: disputeId,
            matchId: disputeResultDto.matchId,
            disputerId,
            type: disputeResultDto.type,
            reason: disputeResultDto.reason,
            evidence: disputeResultDto.evidence || [],
            status: security_dto_1.ReportStatus.PENDING,
            createdAt: new Date(),
        };
        this.disputes.set(disputeId, dispute);
        console.log(`⚖️ Match dispute filed: ${disputerId} disputes match ${disputeResultDto.matchId}`);
        return dispute;
    }
    async getMatchAuditLog(matchId) {
        return [
            {
                timestamp: new Date(Date.now() - 300000),
                event: 'match_started',
                details: { matchId, players: ['player1', 'player2'] },
            },
            {
                timestamp: new Date(Date.now() - 120000),
                event: 'move_logged',
                details: { player: 'player1', action: 'game_action_1' },
            },
            {
                timestamp: new Date(Date.now() - 60000),
                event: 'match_completed',
                details: { winner: 'player1', duration: 240 },
            },
        ];
    }
    async getBannedPlayers() {
        return Array.from(this.bannedUsers);
    }
    async verifySignature(signature, message, publicKey) {
        console.log(`🔐 Verifying signature for: ${publicKey}`);
        return true;
    }
    async getSecurityStats() {
        const totalReports = this.reports.size;
        const pendingReports = Array.from(this.reports.values()).filter(r => r.status === security_dto_1.ReportStatus.PENDING).length;
        const totalDisputes = this.disputes.size;
        const bannedPlayersCount = this.bannedUsers.size;
        return {
            totalReports,
            pendingReports,
            totalDisputes,
            bannedPlayersCount,
            reportsByType: this.getReportsByType(),
        };
    }
    async banPlayer(walletAddress, reason) {
        this.bannedUsers.add(walletAddress);
        console.log(`🔨 Player banned: ${walletAddress} - Reason: ${reason}`);
        return { success: true };
    }
    async unbanPlayer(walletAddress) {
        const removed = this.bannedUsers.delete(walletAddress);
        console.log(`✅ Player unbanned: ${walletAddress}`);
        return { success: removed };
    }
    async resolveReport(reportId, resolution, adminWallet) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new common_1.BadRequestException('Report not found');
        }
        report.status = security_dto_1.ReportStatus.RESOLVED;
        report.resolvedAt = new Date();
        report.adminNotes = resolution;
        console.log(`✅ Report resolved: ${reportId} by ${adminWallet}`);
        return report;
    }
    async resolveDispute(disputeId, resolution, adminWallet) {
        const dispute = this.disputes.get(disputeId);
        if (!dispute) {
            throw new common_1.BadRequestException('Dispute not found');
        }
        dispute.status = security_dto_1.ReportStatus.RESOLVED;
        dispute.resolvedAt = new Date();
        dispute.resolution = resolution;
        console.log(`⚖️ Dispute resolved: ${disputeId} by ${adminWallet}`);
        return dispute;
    }
    getReportsByType() {
        const reportsByType = {};
        Array.from(this.reports.values()).forEach(report => {
            reportsByType[report.type] = (reportsByType[report.type] || 0) + 1;
        });
        return reportsByType;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    generateDisputeId() {
        return `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    isPlayerBanned(walletAddress) {
        return this.bannedUsers.has(walletAddress);
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)()
], SecurityService);
//# sourceMappingURL=security.service.js.map