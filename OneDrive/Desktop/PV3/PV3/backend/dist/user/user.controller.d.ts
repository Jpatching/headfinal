import { UserService } from './user.service';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';
export declare class UserController {
    private readonly userService;
    private readonly authService;
    constructor(userService: UserService, authService: AuthService);
    getProfile(wallet: string): Promise<{
        profile: import("./user.service").UserProfile;
    }>;
    updateProfile(auth: string, updateProfileDto: UpdateProfileDto): Promise<{
        profile: import("./user.service").UserProfile;
    }>;
    getUserStats(wallet: string): Promise<{
        stats: import("./dto/user.dto").UserStats;
    }>;
    getUserEarnings(wallet: string): Promise<{
        earnings: any[];
    }>;
    getUserAchievements(wallet: string): Promise<{
        achievements: import("./dto/user.dto").UserAchievement[];
    }>;
    getNftAvatar(wallet: string): Promise<{
        nftAvatar: {
            nftAddress: string;
            imageUrl: string;
        };
    }>;
    updatePreferences(auth: string, updatePreferencesDto: UpdatePreferencesDto): Promise<{
        preferences: any;
    }>;
    getReputation(auth: string): Promise<{
        reputation: {
            score: number;
            rank: string;
            factors: any[];
        };
    }>;
    getBadges(auth: string): Promise<{
        badges: string[];
    }>;
    getMatchHistory(wallet: string): Promise<{
        history: any[];
    }>;
    searchUsers(query: {
        searchTerm: string;
    }): Promise<{
        users: import("./user.service").UserProfile[];
    }>;
    getActivityFeed(wallet: string): Promise<{
        activities: any[];
    }>;
    private validateSession;
}
