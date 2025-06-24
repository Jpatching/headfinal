export declare class UpdateProfileDto {
    username?: string;
    bio?: string;
    avatar?: string;
    nftAvatar?: string;
}
export declare class UpdatePreferencesDto {
    gamePreferences?: {
        favoriteGames?: string[];
        preferredWagerRange?: {
            min: number;
            max: number;
        };
    };
    notificationSettings?: {
        matchInvites: boolean;
        tournamentUpdates: boolean;
        earnings: boolean;
        marketing: boolean;
    };
}
export interface UserStats {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalEarnings: number;
    totalWagered: number;
    averageWager: number;
    longestWinStreak: number;
    currentWinStreak: number;
    rank: number;
    badges: string[];
}
export interface UserAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    progress?: {
        current: number;
        target: number;
    };
}
