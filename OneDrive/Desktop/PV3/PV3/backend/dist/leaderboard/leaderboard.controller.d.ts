import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getEarningsLeaderboard(): Promise<{
        leaderboard: any[];
    }>;
    getWinsLeaderboard(): Promise<{
        leaderboard: any[];
    }>;
    getWinrateLeaderboard(): Promise<{
        leaderboard: any[];
    }>;
}
