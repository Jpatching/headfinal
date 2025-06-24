import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export enum SystemStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
}

export class BanPlayerDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsNumber()
  @IsOptional()
  durationHours?: number; // undefined = permanent ban
}

export class SystemMaintenanceDto {
  @IsEnum(SystemStatus)
  status: SystemStatus;

  @IsString()
  @IsOptional()
  message?: string;

  @IsNumber()
  @IsOptional()
  estimatedDurationMinutes?: number;
}

export class FeeUpdateDto {
  @IsNumber()
  @Min(0)
  @Max(20)
  platformFeePercentage: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  referralFeePercentage: number;
}

export class EmergencyWithdrawDto {
  @IsString()
  @IsNotEmpty()
  userWallet: string;

  @IsString()
  @IsNotEmpty()
  destinationWallet: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers24h: number;
  totalMatches: number;
  totalVolume: number;
  platformRevenue: number;
  pendingReports: number;
  systemStatus: SystemStatus;
  lastUpdated: Date;
}

export interface UserAction {
  id: string;
  adminWallet: string;
  targetUser: string;
  action: string;
  reason: string;
  timestamp: Date;
  reversible: boolean;
}

export interface SystemAlert {
  id: string;
  type: 'security' | 'financial' | 'technical' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
} 