import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { SolanaModule } from '../solana/solana.module';
import { DatabaseModule } from '../database/database.module';
import { VerifierModule } from '../verifier/verifier.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SolanaModule, DatabaseModule, VerifierModule, AuthModule],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
  exports: [MatchService],
})
export class MatchModule {} 