import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
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

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://pv3-frontend.vercel.app',
      'https://pv3-gaming-of16zi287-lowreyal70-gmailcoms-projects.vercel.app',
      /^https:\/\/pv3-gaming-.*\.vercel\.app$/
    ],
    credentials: true,
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedPlayers: Map<string, Socket> = new Map();
  private matchRooms: Map<string, Set<string>> = new Map();

  constructor(private readonly matchService: MatchService) {}

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
    
    // Remove from all match rooms
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

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @MessageBody() data: { matchId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, playerId } = data;
    
    // Verify match exists
    const match = await this.matchService.getMatch(matchId);
    if (!match) {
      client.emit('error', { message: 'Match not found' });
      return;
    }

    // Join the match room
    client.join(matchId);
    this.connectedPlayers.set(client.id, client);
    
    if (!this.matchRooms.has(matchId)) {
      this.matchRooms.set(matchId, new Set());
    }
    this.matchRooms.get(matchId)!.add(client.id);

    // Notify other players
    client.to(matchId).emit('player_joined', {
      playerId,
      matchId,
    });

    // Send current match state
    client.emit('match_state', {
      match,
      connectedPlayers: this.matchRooms.get(matchId)!.size,
    });

    console.log(`🎮 Player ${playerId} joined match ${matchId}`);
  }

  @SubscribeMessage('game_move')
  async handleGameMove(
    @MessageBody() moveData: GameMove,
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, playerId, moveData: move, timestamp } = moveData;
    
    // Verify match is in progress
    const match = await this.matchService.getMatch(matchId);
    if (!match || match.status !== 'in_progress') {
      client.emit('error', { message: 'Match is not in progress' });
      return;
    }

    // Broadcast move to other players in the match
    client.to(matchId).emit('game_move', {
      playerId,
      moveData: move,
      timestamp,
    });

    console.log(`🎯 Game move in match ${matchId} by ${playerId}`);
  }

  @SubscribeMessage('game_state_update')
  async handleGameStateUpdate(
    @MessageBody() stateData: GameState,
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, state, timestamp } = stateData;
    
    // Broadcast state update to all players in the match
    client.to(matchId).emit('game_state_update', {
      state,
      timestamp,
    });
  }

  @SubscribeMessage('match_result')
  async handleMatchResult(
    @MessageBody() resultData: { matchId: string; winner: string; gameData: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId, winner, gameData } = resultData;
    
    // Notify all players of the match result
    this.server.to(matchId).emit('match_completed', {
      matchId,
      winner,
      gameData,
      timestamp: Date.now(),
    });

    console.log(`🏆 Match ${matchId} completed, winner: ${winner}`);
  }

  // Admin/system methods
  async notifyMatchCreated(matchId: string) {
    this.server.emit('match_created', { matchId });
  }

  async notifyMatchJoined(matchId: string, joiner: string) {
    this.server.to(matchId).emit('match_joined', { matchId, joiner });
  }

  async notifyMatchCompleted(matchId: string, winner: string) {
    this.server.to(matchId).emit('match_result', { matchId, winner });
  }
} 