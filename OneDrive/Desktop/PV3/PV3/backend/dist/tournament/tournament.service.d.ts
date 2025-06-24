import { SolanaService } from '../solana/solana.service';
import { CreateTournamentDto, JoinTournamentDto, TournamentInfo, TournamentBracket } from './dto/tournament.dto';
export declare class TournamentService {
    private readonly solanaService;
    private tournaments;
    constructor(solanaService: SolanaService);
    createTournament(createTournamentDto: CreateTournamentDto, creatorWallet: string): Promise<TournamentInfo>;
    getAllTournaments(): Promise<TournamentInfo[]>;
    getTournament(tournamentId: string): Promise<TournamentInfo>;
    joinTournament(walletAddress: string, joinTournamentDto: JoinTournamentDto): Promise<{
        success: boolean;
        tournament: TournamentInfo;
    }>;
    getTournamentBracket(tournamentId: string): Promise<TournamentBracket>;
    getUpcomingTournaments(): Promise<TournamentInfo[]>;
    getTournamentHistory(): Promise<TournamentInfo[]>;
    startTournament(tournamentId: string): Promise<{
        success: boolean;
        bracket: TournamentBracket;
    }>;
    private generateBracket;
    private shuffleArray;
    private generateTournamentId;
    processTournamentMatchResult(tournamentId: string, matchId: string, winnerWallet: string): Promise<void>;
    private checkAndAdvanceTournament;
    private generateNextRound;
    private distributeTournamentPrizes;
}
