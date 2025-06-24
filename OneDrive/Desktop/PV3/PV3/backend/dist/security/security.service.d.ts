import { ReportCheatDto, DisputeResultDto, SecurityReport, MatchDispute } from './dto/security.dto';
export declare class SecurityService {
    private reports;
    private disputes;
    private bannedUsers;
    reportCheat(reporterId: string, reportCheatDto: ReportCheatDto): Promise<SecurityReport>;
    getPlayerReports(walletAddress: string): Promise<SecurityReport[]>;
    disputeResult(disputerId: string, disputeResultDto: DisputeResultDto): Promise<MatchDispute>;
    getMatchAuditLog(matchId: string): Promise<any[]>;
    getBannedPlayers(): Promise<string[]>;
    verifySignature(signature: string, message: string, publicKey: string): Promise<boolean>;
    getSecurityStats(): Promise<any>;
    banPlayer(walletAddress: string, reason: string): Promise<{
        success: boolean;
    }>;
    unbanPlayer(walletAddress: string): Promise<{
        success: boolean;
    }>;
    resolveReport(reportId: string, resolution: string, adminWallet: string): Promise<SecurityReport>;
    resolveDispute(disputeId: string, resolution: string, adminWallet: string): Promise<MatchDispute>;
    private getReportsByType;
    private generateReportId;
    private generateDisputeId;
    isPlayerBanned(walletAddress: string): boolean;
}
