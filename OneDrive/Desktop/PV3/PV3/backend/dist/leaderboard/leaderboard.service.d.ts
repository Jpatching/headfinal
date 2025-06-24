import { UserService } from '../user/user.service';
export declare class LeaderboardService {
    private readonly userService;
    constructor(userService: UserService);
    getEarningsLeaderboard(): Promise<any[]>;
    getWinsLeaderboard(): Promise<any[]>;
    getWinrateLeaderboard(): Promise<any[]>;
}
