export declare enum TournamentType {
    SINGLE_ELIMINATION = "single_elimination",
    DOUBLE_ELIMINATION = "double_elimination",
    ROUND_ROBIN = "round_robin"
}
export declare enum TournamentStatus {
    UPCOMING = "upcoming",
    REGISTRATION = "registration",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class CreateTournamentDto {
    name: string;
    description?: string;
    gameId: string;
    entryFee: number;
    maxParticipants: number;
    type: TournamentType;
    startTime: string;
    prizePercentages: number[];
}
export declare class JoinTournamentDto {
    tournamentId: string;
}
export interface TournamentInfo {
    id: string;
    name: string;
    description?: string;
    gameId: string;
    entryFee: number;
    maxParticipants: number;
    currentParticipants: number;
    type: TournamentType;
    status: TournamentStatus;
    startTime: Date;
    endTime?: Date;
    prizePool: number;
    prizePercentages: number[];
    participants: TournamentParticipant[];
    bracket?: TournamentBracket;
    createdAt: Date;
}
export interface TournamentParticipant {
    walletAddress: string;
    username?: string;
    joinedAt: Date;
    seed: number;
    eliminated: boolean;
    placement?: number;
    earnings?: number;
}
export interface TournamentBracket {
    rounds: TournamentRound[];
    winners: TournamentParticipant[];
}
export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
    isComplete: boolean;
}
export interface TournamentMatch {
    id: string;
    tournamentId: string;
    roundNumber: number;
    playerA: TournamentParticipant;
    playerB: TournamentParticipant;
    winner?: TournamentParticipant;
    status: 'pending' | 'active' | 'completed';
    scheduledAt?: Date;
    completedAt?: Date;
}
