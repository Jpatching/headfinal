export declare enum ReportType {
    CHEATING = "cheating",
    EXPLOIT = "exploit",
    HARASSMENT = "harassment",
    FRAUD = "fraud",
    OTHER = "other"
}
export declare enum ReportStatus {
    PENDING = "pending",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare enum DisputeType {
    MATCH_RESULT = "match_result",
    TECHNICAL_ISSUE = "technical_issue",
    UNFAIR_PLAY = "unfair_play"
}
export declare class ReportCheatDto {
    reportedUser: string;
    type: ReportType;
    description: string;
    matchId?: string;
    evidence?: string[];
}
export declare class DisputeResultDto {
    matchId: string;
    type: DisputeType;
    reason: string;
    evidence?: string[];
}
export interface SecurityReport {
    id: string;
    reporterId: string;
    reportedUser: string;
    type: ReportType;
    description: string;
    matchId?: string;
    evidence: string[];
    status: ReportStatus;
    createdAt: Date;
    resolvedAt?: Date;
    adminNotes?: string;
}
export interface MatchDispute {
    id: string;
    matchId: string;
    disputerId: string;
    type: DisputeType;
    reason: string;
    evidence: string[];
    status: ReportStatus;
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
}
