import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
interface GameMove {
    matchId: string;
    playerId: string;
    moveData: any;
    timestamp: number;
}
interface GameState {
    matchId: string;
    state: any;
    timestamp: number;
}
export declare class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly matchService;
    server: Server;
    private connectedPlayers;
    private matchRooms;
    constructor(matchService: MatchService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinMatch(data: {
        matchId: string;
        playerId: string;
    }, client: Socket): Promise<void>;
    handleGameMove(moveData: GameMove, client: Socket): Promise<void>;
    handleGameStateUpdate(stateData: GameState, client: Socket): Promise<void>;
    handleMatchResult(resultData: {
        matchId: string;
        winner: string;
        gameData: any;
    }, client: Socket): Promise<void>;
    notifyMatchCreated(matchId: string): Promise<void>;
    notifyMatchJoined(matchId: string, joiner: string): Promise<void>;
    notifyMatchCompleted(matchId: string, winner: string): Promise<void>;
}
export {};
