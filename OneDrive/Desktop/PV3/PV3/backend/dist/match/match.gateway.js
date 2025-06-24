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
exports.MatchGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const match_service_1 = require("./match.service");
let MatchGateway = class MatchGateway {
    constructor(matchService) {
        this.matchService = matchService;
        this.connectedPlayers = new Map();
        this.matchRooms = new Map();
    }
    handleConnection(client) {
        console.log(`🔌 Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`🔌 Client disconnected: ${client.id}`);
        for (const [matchId, players] of this.matchRooms.entries()) {
            if (players.has(client.id)) {
                players.delete(client.id);
                this.server.to(matchId).emit('player_disconnected', {
                    playerId: client.id,
                    matchId,
                });
                if (players.size === 0) {
                    this.matchRooms.delete(matchId);
                }
            }
        }
        this.connectedPlayers.delete(client.id);
    }
    async handleJoinMatch(data, client) {
        const { matchId, playerId } = data;
        const match = await this.matchService.getMatch(matchId);
        if (!match) {
            client.emit('error', { message: 'Match not found' });
            return;
        }
        client.join(matchId);
        this.connectedPlayers.set(client.id, client);
        if (!this.matchRooms.has(matchId)) {
            this.matchRooms.set(matchId, new Set());
        }
        this.matchRooms.get(matchId).add(client.id);
        client.to(matchId).emit('player_joined', {
            playerId,
            matchId,
        });
        client.emit('match_state', {
            match,
            connectedPlayers: this.matchRooms.get(matchId).size,
        });
        console.log(`🎮 Player ${playerId} joined match ${matchId}`);
    }
    async handleGameMove(moveData, client) {
        const { matchId, playerId, moveData: move, timestamp } = moveData;
        const match = await this.matchService.getMatch(matchId);
        if (!match || match.status !== 'in_progress') {
            client.emit('error', { message: 'Match is not in progress' });
            return;
        }
        client.to(matchId).emit('game_move', {
            playerId,
            moveData: move,
            timestamp,
        });
        console.log(`🎯 Game move in match ${matchId} by ${playerId}`);
    }
    async handleGameStateUpdate(stateData, client) {
        const { matchId, state, timestamp } = stateData;
        client.to(matchId).emit('game_state_update', {
            state,
            timestamp,
        });
    }
    async handleMatchResult(resultData, client) {
        const { matchId, winner, gameData } = resultData;
        this.server.to(matchId).emit('match_completed', {
            matchId,
            winner,
            gameData,
            timestamp: Date.now(),
        });
        console.log(`🏆 Match ${matchId} completed, winner: ${winner}`);
    }
    async notifyMatchCreated(matchId) {
        this.server.emit('match_created', { matchId });
    }
    async notifyMatchJoined(matchId, joiner) {
        this.server.to(matchId).emit('match_joined', { matchId, joiner });
    }
    async notifyMatchCompleted(matchId, winner) {
        this.server.to(matchId).emit('match_result', { matchId, winner });
    }
};
exports.MatchGateway = MatchGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_match'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "handleJoinMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game_move'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "handleGameMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game_state_update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "handleGameStateUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('match_result'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "handleMatchResult", null);
exports.MatchGateway = MatchGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:3000',
                'https://pv3-frontend.vercel.app',
                'https://pv3-gaming-of16zi287-lowreyal70-gmailcoms-projects.vercel.app',
                /^https:\/\/pv3-gaming-.*\.vercel\.app$/
            ],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [match_service_1.MatchService])
], MatchGateway);
//# sourceMappingURL=match.gateway.js.map