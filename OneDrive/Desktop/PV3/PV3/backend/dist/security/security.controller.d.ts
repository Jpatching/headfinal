import { SecurityService } from './security.service';
import { ReportCheatDto, DisputeResultDto } from './dto/security.dto';
import { AuthService } from '../auth/auth.service';
export declare class SecurityController {
    private readonly securityService;
    private readonly authService;
    constructor(securityService: SecurityService, authService: AuthService);
    reportCheat(auth: string, reportCheatDto: ReportCheatDto): Promise<{
        report: import("./dto/security.dto").SecurityReport;
    }>;
    getPlayerReports(wallet: string): Promise<{
        reports: import("./dto/security.dto").SecurityReport[];
    }>;
    disputeResult(auth: string, disputeResultDto: DisputeResultDto): Promise<{
        dispute: import("./dto/security.dto").MatchDispute;
    }>;
    getMatchAuditLog(matchId: string): Promise<{
        auditLog: any[];
    }>;
    getBannedPlayers(): Promise<{
        bannedPlayers: string[];
    }>;
    verifySignature(body: {
        signature: string;
        message: string;
        publicKey: string;
    }): Promise<{
        valid: boolean;
    }>;
    getSecurityStats(): Promise<{
        stats: any;
    }>;
    private validateSession;
}
