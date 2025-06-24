import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  nftAvatar?: string; // NFT address for avatar
}

export class UpdatePreferencesDto {
  @IsOptional()
  gamePreferences?: {
    favoriteGames?: string[];
    preferredWagerRange?: {
      min: number;
      max: number;
    };
  };

  @IsOptional()
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