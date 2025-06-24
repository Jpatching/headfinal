"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentController = void 0;
const common_1 = require("@nestjs/common");
const tournament_service_1 = require("./tournament.service");
const tournament_dto_1 = require("./dto/tournament.dto");
const auth_service_1 = require("../auth/auth.service");
let TournamentController = class TournamentController {
    constructor(tournamentService, authService) {
        this.tournamentService = tournamentService;
        this.authService = authService;
    }
    async getAllTournaments() {
        const tournaments = await this.tournamentService.getAllTournaments();
        return { tournaments };
    }
    async createTournament(auth, createTournamentDto) {
        const session = await this.validateSession(auth);
        const tournament = await this.tournamentService.createTournament(createTournamentDto, session.wallet);
        return { tournament };
    }
    async getTournament(id) {
        const tournament = await this.tournamentService.getTournament(id);
        return { tournament };
    }
    async joinTournament(auth, id) {
        const session = await this.validateSession(auth);
        return this.tournamentService.joinTournament(session.wallet, { tournamentId: id });
    }
    async getUpcomingTournaments() {
        const tournaments = await this.tournamentService.getUpcomingTournaments();
        return { tournaments };
    }
    async getTournamentHistory() {
        const tournaments = await this.tournamentService.getTournamentHistory();
        return { tournaments };
    }
    async getTournamentBracket(id) {
        const bracket = await this.tournamentService.getTournamentBracket(id);
        return { bracket };
    }
    async startTournament(auth, id) {
        const session = await this.validateSession(auth);
        return this.tournamentService.startTournament(id);
    }
    async validateSession(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Invalid authorization header');
        }
        const sessionId = authHeader.substring(7);
        const session = await this.authService.validateSession(sessionId);
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid session');
        }
        return session;
    }
};
exports.TournamentController = TournamentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getAllTournaments", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tournament_dto_1.CreateTournamentDto]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "createTournament", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getTournament", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "joinTournament", null);
__decorate([
    (0, common_1.Get)('schedule'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getUpcomingTournaments", null);
__decorate([
    (0, common_1.Get)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getTournamentHistory", null);
__decorate([
    (0, common_1.Get)(':id/bracket'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getTournamentBracket", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "startTournament", null);
exports.TournamentController = TournamentController = __decorate([
    (0, common_1.Controller)('tournaments'),
    __metadata("design:paramtypes", [tournament_service_1.TournamentService,
        auth_service_1.AuthService])
], TournamentController);
//# sourceMappingURL=tournament.controller.js.map