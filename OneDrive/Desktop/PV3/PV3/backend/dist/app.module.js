"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const match_module_1 = require("./match/match.module");
const game_module_1 = require("./game/game.module");
const solana_module_1 = require("./solana/solana.module");
const verifier_module_1 = require("./verifier/verifier.module");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const referral_module_1 = require("./referral/referral.module");
const leaderboard_module_1 = require("./leaderboard/leaderboard.module");
const tournament_module_1 = require("./tournament/tournament.module");
const security_module_1 = require("./security/security.module");
const admin_module_1 = require("./admin/admin.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            solana_module_1.SolanaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            referral_module_1.ReferralModule,
            leaderboard_module_1.LeaderboardModule,
            tournament_module_1.TournamentModule,
            security_module_1.SecurityModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
            match_module_1.MatchModule,
            game_module_1.GameModule,
            verifier_module_1.VerifierModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map