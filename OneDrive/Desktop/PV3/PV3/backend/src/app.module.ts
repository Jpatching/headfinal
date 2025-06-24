import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MatchModule } from './match/match.module';
import { GameModule } from './game/game.module';
import { SolanaModule } from './solana/solana.module';
import { VerifierModule } from './verifier/verifier.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReferralModule } from './referral/referral.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { TournamentModule } from './tournament/tournament.module';
import { SecurityModule } from './security/security.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    SolanaModule,
    AuthModule,
    UserModule,
    ReferralModule,
    LeaderboardModule,
    TournamentModule,
    SecurityModule,
    AdminModule,
    AnalyticsModule,
    MatchModule,
    GameModule,
    VerifierModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {} 