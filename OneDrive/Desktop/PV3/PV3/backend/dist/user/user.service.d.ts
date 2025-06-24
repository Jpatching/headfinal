import { UpdateProfileDto, UpdatePreferencesDto, UserStats, UserAchievement } from './dto/user.dto';
export interface UserProfile {
    walletAddress: string;
    username?: string;
    bio?: string;
    avatar?: string;
    nftAvatar?: string;
    createdAt: Date;
    lastActive: Date;
    reputation: number;
    level: number;
    stats: UserStats;
    preferences: any;
    badges: string[];
}
export declare class UserService {
    private users;
    getProfile(walletAddress: string): Promise<UserProfile>;
    updateProfile(walletAddress: string, updateProfileDto: UpdateProfileDto): Promise<UserProfile>;
    getUserStats(walletAddress: string): Promise<UserStats>;
    getUserEarnings(walletAddress: string): Promise<any[]>;
    getUserAchievements(walletAddress: string): Promise<UserAchievement[]>;
    getNftAvatar(walletAddress: string): Promise<{
        nftAddress: string;
        imageUrl: string;
    } | null>;
    updatePreferences(walletAddress: string, updatePreferencesDto: UpdatePreferencesDto): Promise<any>;
    getReputation(walletAddress: string): Promise<{
        score: number;
        rank: string;
        factors: any[];
    }>;
    getBadges(walletAddress: string): Promise<string[]>;
    updateMatchStats(walletAddress: string, matchResult: {
        won: boolean;
        wager: number;
        earnings: number;
    }): Promise<void>;
    private createDefaultProfile;
    private calculateReputationRank;
    private calculateReputation;
    private checkAndUnlockAchievements;
    getMatchHistory(walletAddress: string): Promise<any[]>;
    searchUsers(searchTerm: string): Promise<UserProfile[]>;
    getActivityFeed(walletAddress: string): Promise<any[]>;
}
