import { TournamentService } from './tournament.service';
import { CreateTournamentDto } from './dto/tournament.dto';
import { AuthService } from '../auth/auth.service';
export declare class TournamentController {
    private readonly tournamentService;
    private readonly authService;
    constructor(tournamentService: TournamentService, authService: AuthService);
    getAllTournaments(): Promise<{
        tournaments: import("./dto/tournament.dto").TournamentInfo[];
    }>;
    createTournament(auth: string, createTournamentDto: CreateTournamentDto): Promise<{
        tournament: import("./dto/tournament.dto").TournamentInfo;
    }>;
    getTournament(id: string): Promise<{
        tournament: import("./dto/tournament.dto").TournamentInfo;
    }>;
    joinTournament(auth: string, id: string): Promise<{
        success: boolean;
        tournament: import("./dto/tournament.dto").TournamentInfo;
    }>;
    getUpcomingTournaments(): Promise<{
        tournaments: import("./dto/tournament.dto").TournamentInfo[];
    }>;
    getTournamentHistory(): Promise<{
        tournaments: import("./dto/tournament.dto").TournamentInfo[];
    }>;
    getTournamentBracket(id: string): Promise<{
        bracket: import("./dto/tournament.dto").TournamentBracket;
    }>;
    startTournament(auth: string, id: string): Promise<{
        success: boolean;
        bracket: import("./dto/tournament.dto").TournamentBracket;
    }>;
    private validateSession;
}
