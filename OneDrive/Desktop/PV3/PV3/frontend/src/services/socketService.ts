'use client';

import { io, Socket } from 'socket.io-client';

interface ChessMove {
  from: { row: number; col: number };
  to: { row: number; col: number };
  piece: string;
  timestamp: number;
}

interface GameState {
  matchId: string;
  state: Record<string, unknown>;
  timestamp: number;
}

interface MatchData {
  match: Record<string, unknown>;
  connectedPlayers: number;
}

interface PlayerData {
  playerId: string;
  matchId: string;
}

interface GameMoveData {
  playerId: string;
  moveData: ChessMove;
  timestamp: number;
}

interface MatchResultData {
  matchId: string;
  winner: string;
  gameData: Record<string, unknown>;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      // Use the same API base URL but for websocket connection
      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to game server');
        this.isConnected = true;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from game server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Game-specific event handlers
      this.setupGameEventHandlers();
    });
  }

  private setupGameEventHandlers() {
    if (!this.socket) return;

    this.socket.on('player_joined', (data: PlayerData) => {
      console.log('👥 Player joined match:', data);
    });

    this.socket.on('player_disconnected', (data: PlayerData) => {
      console.log('👥 Player disconnected:', data);
    });

    this.socket.on('match_state', (data: MatchData) => {
      console.log('🎮 Match state:', data);
    });

    this.socket.on('game_move', (data: GameMoveData) => {
      console.log('🎯 Game move received:', data);
    });

    this.socket.on('game_state_update', (data: GameState) => {
      console.log('🔄 Game state update:', data);
    });

    this.socket.on('match_completed', (data: MatchResultData) => {
      console.log('🏆 Match completed:', data);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('🚨 Game error:', error);
    });
  }

  // Match management
  joinMatch(matchId: string, playerId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to game server');
    }
    this.socket.emit('join_match', { matchId, playerId });
  }

  // Chess-specific move handling
  sendChessMove(matchId: string, playerId: string, move: ChessMove) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to game server');
    }
    
    this.socket.emit('game_move', {
      matchId,
      playerId,
      moveData: move,
      timestamp: Date.now(),
    });
  }

  // Game state updates
  sendGameState(matchId: string, state: Record<string, unknown>) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to game server');
    }
    
    this.socket.emit('game_state_update', {
      matchId,
      state,
      timestamp: Date.now(),
    });
  }

  // Submit match result
  submitMatchResult(matchId: string, winner: string, gameData: Record<string, unknown>) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to game server');
    }
    
    this.socket.emit('match_result', {
      matchId,
      winner,
      gameData,
    });
  }

  // Event listeners for React components
  on(event: string, callback: (data: unknown) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService; 