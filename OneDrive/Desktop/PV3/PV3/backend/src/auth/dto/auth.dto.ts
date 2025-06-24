import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ConnectWalletDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class VerifySignatureDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class CreateSessionVaultDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class DepositVaultDto {
  @IsString()
  @IsNotEmpty()
  amount: string; // SOL amount as string for precision

  @IsString()
  @IsOptional()
  transactionSignature?: string;
}

export class WithdrawVaultDto {
  @IsString()
  @IsNotEmpty()
  amount: string; // SOL amount as string

  @IsString()
  @IsNotEmpty()
  destinationAddress: string;
} 