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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const common_1 = require("@nestjs/common");
const solana_service_1 = require("../solana/solana.service");
const tournament_dto_1 = require("./dto/tournament.dto");
let TournamentService = class TournamentService {
    constructor(solanaService) {
        this.solanaService = solanaService;
        this.tournaments = new Map();
    }
    async createTournament(createTournamentDto, creatorWallet) {
        const tournamentId = this.generateTournamentId();
        const tournament = {
            id: tournamentId,
            ...createTournamentDto,
            startTime: new Date(createTournamentDto.startTime),
            currentParticipants: 0,
            status: tournament_dto_1.TournamentStatus.UPCOMING,
            prizePool: 0,
            participants: [],
            createdAt: new Date(),
        };
        this.tournaments.set(tournamentId, tournament);
        console.log(`🏆 Tournament created: ${tournament.name} by ${creatorWallet}`);
        return tournament;
    }
    async getAllTournaments() {
        return Array.from(this.tournaments.values())
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    async getTournament(tournamentId) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        return tournament;
    }
    async joinTournament(walletAddress, joinTournamentDto) {
        const tournament = await this.getTournament(joinTournamentDto.tournamentId);
        if (tournament.status !== tournament_dto_1.TournamentStatus.REGISTRATION && tournament.status !== tournament_dto_1.TournamentStatus.UPCOMING) {
            throw new common_1.BadRequestException('Tournament registration is closed');
        }
        if (tournament.currentParticipants >= tournament.maxParticipants) {
            throw new common_1.BadRequestException('Tournament is full');
        }
        if (tournament.participants.some(p => p.walletAddress === walletAddress)) {
            throw new common_1.BadRequestException('Already registered for this tournament');
        }
        const participant = {
            walletAddress,
            joinedAt: new Date(),
            seed: tournament.currentParticipants + 1,
            eliminated: false,
        };
        tournament.participants.push(participant);
        tournament.currentParticipants++;
        tournament.prizePool += tournament.entryFee;
        if (tournament.currentParticipants >= tournament.maxParticipants) {
            tournament.status = tournament_dto_1.TournamentStatus.REGISTRATION;
        }
        console.log(`🎮 ${walletAddress} joined tournament: ${tournament.name}`);
        return { success: true, tournament };
    }
    async getTournamentBracket(tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament.bracket) {
            if (tournament.status === tournament_dto_1.TournamentStatus.ACTIVE || tournament.currentParticipants >= 4) {
                tournament.bracket = this.generateBracket(tournament);
            }
            else {
                throw new common_1.BadRequestException('Tournament bracket not yet available');
            }
        }
        return tournament.bracket;
    }
    async getUpcomingTournaments() {
        const now = new Date();
        return Array.from(this.tournaments.values())
            .filter(t => t.startTime > now)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .slice(0, 10);
    }
    async getTournamentHistory() {
        return Array.from(this.tournaments.values())
            .filter(t => t.status === tournament_dto_1.TournamentStatus.COMPLETED)
            .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
            .slice(0, 20);
    }
    async startTournament(tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        if (tournament.status !== tournament_dto_1.TournamentStatus.REGISTRATION) {
            throw new common_1.BadRequestException('Tournament cannot be started');
        }
        if (tournament.currentParticipants < 4) {
            throw new common_1.BadRequestException('Need at least 4 participants to start tournament');
        }
        tournament.bracket = this.generateBracket(tournament);
        tournament.status = tournament_dto_1.TournamentStatus.ACTIVE;
        console.log(`🚀 Tournament started: ${tournament.name} with ${tournament.currentParticipants} participants`);
        return { success: true, bracket: tournament.bracket };
    }
    generateBracket(tournament) {
        const participants = [...tournament.participants];
        this.shuffleArray(participants);
        participants.forEach((participant, index) => {
            participant.seed = index + 1;
        });
        const bracket = {
            rounds: [],
            winners: [],
        };
        const firstRoundMatches = [];
        for (let i = 0; i < participants.length; i += 2) {
            if (i + 1 < participants.length) {
                firstRoundMatches.push({
                    id: `match_${tournament.id}_r1_${Math.floor(i / 2)}`,
                    tournamentId: tournament.id,
                    roundNumber: 1,
                    playerA: participants[i],
                    playerB: participants[i + 1],
                    status: 'pending',
                });
            }
        }
        bracket.rounds.push({
            roundNumber: 1,
            matches: firstRoundMatches,
            isComplete: false,
        });
        let currentMatches = firstRoundMatches.length;
        let roundNumber = 2;
        while (currentMatches > 1) {
            const nextRoundMatches = Math.ceil(currentMatches / 2);
            bracket.rounds.push({
                roundNumber,
                matches: [],
                isComplete: false,
            });
            currentMatches = nextRoundMatches;
            roundNumber++;
        }
        return bracket;
    }
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    generateTournamentId() {
        return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    async processTournamentMatchResult(tournamentId, matchId, winnerWallet) {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament.bracket) {
            throw new common_1.BadRequestException('Tournament bracket not found');
        }
        for (const round of tournament.bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                const winner = match.playerA.walletAddress === winnerWallet ? match.playerA : match.playerB;
                const loser = match.playerA.walletAddress === winnerWallet ? match.playerB : match.playerA;
                match.winner = winner;
                match.status = 'completed';
                match.completedAt = new Date();
                loser.eliminated = true;
                console.log(`🏆 Tournament match completed: ${winner.walletAddress} beats ${loser.walletAddress}`);
                this.checkAndAdvanceTournament(tournament);
                break;
            }
        }
    }
    checkAndAdvanceTournament(tournament) {
        if (!tournament.bracket)
            return;
        const currentRound = tournament.bracket.rounds.find(r => !r.isComplete);
        if (!currentRound)
            return;
        const allMatchesComplete = currentRound.matches.every(m => m.status === 'completed');
        if (allMatchesComplete) {
            currentRound.isComplete = true;
            if (currentRound.roundNumber === tournament.bracket.rounds.length) {
                tournament.status = tournament_dto_1.TournamentStatus.COMPLETED;
                tournament.endTime = new Date();
                this.distributeTournamentPrizes(tournament);
            }
            else {
                this.generateNextRound(tournament, currentRound);
            }
        }
    }
    generateNextRound(tournament, completedRound) {
        const winners = completedRound.matches.map((match) => match.winner);
        const nextRoundNumber = completedRound.roundNumber + 1;
        const nextRound = tournament.bracket.rounds.find(r => r.roundNumber === nextRoundNumber);
        if (!nextRound)
            return;
        const nextMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextMatches.push({
                    id: `match_${tournament.id}_r${nextRoundNumber}_${Math.floor(i / 2)}`,
                    tournamentId: tournament.id,
                    roundNumber: nextRoundNumber,
                    playerA: winners[i],
                    playerB: winners[i + 1],
                    status: 'pending',
                });
            }
        }
        nextRound.matches = nextMatches;
    }
    distributeTournamentPrizes(tournament) {
        if (!tournament.bracket)
            return;
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        const finalMatch = finalRound.matches[0];
        if (finalMatch?.winner) {
            const winner = finalMatch.winner;
            const runnerUp = finalMatch.playerA.walletAddress === winner.walletAddress ? finalMatch.playerB : finalMatch.playerA;
            const firstPlace = tournament.prizePool * (tournament.prizePercentages[0] / 100);
            const secondPlace = tournament.prizePool * (tournament.prizePercentages[1] / 100);
            winner.placement = 1;
            winner.earnings = firstPlace;
            runnerUp.placement = 2;
            runnerUp.earnings = secondPlace;
            tournament.bracket.winners = [winner, runnerUp];
            console.log(`🎉 Tournament completed: ${tournament.name}`);
            console.log(`🥇 Winner: ${winner.walletAddress} - ${firstPlace} SOL`);
            console.log(`🥈 Runner-up: ${runnerUp.walletAddress} - ${secondPlace} SOL`);
        }
    }
};
exports.TournamentService = TournamentService;
exports.TournamentService = TournamentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [solana_service_1.SolanaService])
], TournamentService);
//# sourceMappingURL=tournament.service.js.map