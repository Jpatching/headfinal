import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SolanaModule } from '../solana/solana.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SolanaModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {} 