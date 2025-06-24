'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePV3 } from '@/hooks/usePV3';
import { ChessEngine, Position, PieceColor } from '@/lib/games/chess/chess-engine';
import ChessBoard from '@/components/games/chess/ChessBoard';
import ChessTimer from '@/components/games/chess/ChessTimer';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import socketService from '@/services/socketService';
import matchService, { Match } from '@/services/matchService';

type GamePhase = 'lobby' | 'creating' | 'waiting' | 'joining' | 'playing' | 'finished';

export default function ChessPage() {
  const router = useRouter();
  const { connected, publicKey, formatSOL, vaultBalance, loading } = usePV3();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [engine, setEngine] = useState<ChessEngine>(new ChessEngine());
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [gameResult, setGameResult] = useState<{ winner: PieceColor | 'draw' | null; reason: string } | null>(null);
  const [opponent, setOpponent] = useState<{ id: string; wallet: string; username?: string } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState({ white: 300000, black: 300000 });

  // End game function
  const endGame = useCallback(async (winner: PieceColor | 'draw', reason: string) => {
    setGameResult({ winner, reason });
    setGamePhase('finished');

    if (!currentMatch) return;

    try {
      // Determine winner ID for backend
      let winnerId = '';
      if (winner === 'white') {
        winnerId = currentMatch.player1.id;
      } else if (winner === 'black') {
        winnerId = currentMatch.player2?.id || '';
      }

      // Submit result to backend
      await matchService.submitMatchResult(currentMatch.id, winnerId, {
        moves: engine.moveHistory,
        finalPosition: engine.board,
        gameState: engine.gameState,
        timeRemaining: engine.getTimeRemaining(),
        reason,
      });

      // Notify other players via websocket
      socketService.submitMatchResult(currentMatch.id, winnerId, {
        reason,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to submit match result:', error);
    }
  }, [currentMatch, engine]);

  // Load available matches
  const loadAvailableMatches = useCallback(async () => {
    try {
      const matches = await matchService.getAvailableChessMatches();
      setAvailableMatches(matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  }, []);

  // Websocket event handlers
  const handleMatchState = useCallback((data: { match: Match; connectedPlayers: number }) => {
    console.log('Match state received:', data);
    setCurrentMatch(data.match);
    
    if (data.match.status === 'in_progress' && data.connectedPlayers === 2) {
      // Determine player color based on match participants
      const isPlayer1 = data.match.player1.wallet === publicKey?.toString();
      setPlayerColor(isPlayer1 ? 'white' : 'black');
      setOpponent(isPlayer1 ? data.match.player2! : data.match.player1);
      setGamePhase('playing');
      setEngine(new ChessEngine());
    }
  }, [publicKey]);

  const handlePlayerJoined = useCallback((data: { playerId: string; matchId: string }) => {
    console.log('Player joined:', data);
    if (currentMatch?.id === data.matchId) {
      loadAvailableMatches(); // Refresh match list
    }
  }, [currentMatch?.id, loadAvailableMatches]);

  const handleOpponentMove = useCallback((data: { playerId: string; moveData: { from: Position; to: Position; piece: string; timestamp: number } }) => {
    console.log('Opponent move received:', data);
    
    // Apply opponent's move to our engine
    const success = engine.makeMove(data.moveData.from, data.moveData.to);
    if (success) {
      // Check for game end
      const winner = engine.getWinner();
      if (winner !== null) {
        const reason = winner === 'draw' ? 'Draw' : 
                      winner === 'white' ? 'White wins by checkmate' : 
                      winner === 'black' ? 'Black wins by checkmate' : 'Draw';
        endGame(winner, reason);
      }

      // Force re-render
      const newEngine = new ChessEngine();
      newEngine.board = [...engine.board.map(row => [...row])];
      newEngine.currentPlayer = engine.currentPlayer;
      newEngine.gameState = engine.gameState;
      newEngine.moveHistory = [...engine.moveHistory];
      newEngine.whiteTime = engine.whiteTime;
      newEngine.blackTime = engine.blackTime;
      newEngine.lastMoveTime = engine.lastMoveTime;
      setEngine(newEngine);
    }
  }, [engine, endGame]);

  const handleMatchCompleted = useCallback((data: { matchId: string; winner: string; gameData: Record<string, unknown> }) => {
    console.log('Match completed:', data);
    if (currentMatch?.id === data.matchId) {
      // Match completed remotely
      setGamePhase('finished');
    }
  }, [currentMatch?.id]);

  const handlePlayerDisconnected = useCallback((data: { playerId: string; matchId: string }) => {
    console.log('Player disconnected:', data);
    if (currentMatch?.id === data.matchId) {
      // Opponent disconnected - player wins
      endGame(playerColor, 'Opponent disconnected');
    }
  }, [currentMatch?.id, playerColor, endGame]);

  // Initialize websocket connection
  useEffect(() => {
    if (!connected || !publicKey) return;

    const initSocket = async () => {
      try {
        await socketService.connect();
        setSocketConnected(true);

        // Set up game event listeners with proper type casting
        socketService.on('match_state', (data: unknown) => handleMatchState(data as { match: Match; connectedPlayers: number }));
        socketService.on('player_joined', (data: unknown) => handlePlayerJoined(data as { playerId: string; matchId: string }));
        socketService.on('game_move', (data: unknown) => handleOpponentMove(data as { playerId: string; moveData: { from: Position; to: Position; piece: string; timestamp: number } }));
        socketService.on('match_completed', (data: unknown) => handleMatchCompleted(data as { matchId: string; winner: string; gameData: Record<string, unknown> }));
        socketService.on('player_disconnected', (data: unknown) => handlePlayerDisconnected(data as { playerId: string; matchId: string }));
      } catch (error) {
        console.error('Failed to connect to game server:', error);
      }
    };

    initSocket();

    return () => {
      socketService.off('match_state');
      socketService.off('player_joined');
      socketService.off('game_move');
      socketService.off('match_completed');
      socketService.off('player_disconnected');
    };
  }, [connected, publicKey, handleMatchState, handlePlayerJoined, handleOpponentMove, handleMatchCompleted, handlePlayerDisconnected]);

  // Load available matches
  useEffect(() => {
    if (gamePhase === 'lobby' && socketConnected) {
      loadAvailableMatches();
    }
  }, [gamePhase, socketConnected, loadAvailableMatches]);

  // Timer updates during game
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const interval = setInterval(() => {
      const newTime = engine.getTimeRemaining();
      setTimeRemaining(newTime);

      // Check for timeout
      if (newTime.white <= 0 || newTime.black <= 0) {
        const winner = newTime.white <= 0 ? 'black' : 'white';
        endGame(winner, `${winner === 'white' ? 'White' : 'Black'} wins on time`);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gamePhase, engine, endGame]);

  // Create a new chess match
  const createMatch = useCallback(async () => {
    if (!connected || vaultBalance < wagerAmount * 1000000000) {
      alert('Insufficient vault balance');
      return;
    }

    setGamePhase('creating');
    try {
      const match = await matchService.createChessMatch(wagerAmount);
      setCurrentMatch(match);
      setGamePhase('waiting');
      
      // Join the match room via websocket
      socketService.joinMatch(match.id, publicKey!.toString());
    } catch (error) {
      console.error('Failed to create match:', error);
      alert('Failed to create match. Please try again.');
      setGamePhase('lobby');
    }
  }, [connected, vaultBalance, wagerAmount, publicKey]);

  // Join an existing match
  const joinMatch = useCallback(async (matchId: string) => {
    if (!connected) return;

    setGamePhase('joining');
    try {
      const match = await matchService.joinMatch(matchId);
      setCurrentMatch(match);
      
      // Join the match room via websocket
      socketService.joinMatch(match.id, publicKey!.toString());
      
      // Game should start automatically when both players are connected
    } catch (error) {
      console.error('Failed to join match:', error);
      alert('Failed to join match. Please try again.');
      setGamePhase('lobby');
    }
  }, [connected, publicKey]);

  // Handle chess moves
  const handleMove = useCallback((from: Position, to: Position) => {
    if (engine.currentPlayer !== playerColor || !currentMatch) return;

    const success = engine.makeMove(from, to);
    if (success) {
      // Send move to opponent via websocket
      socketService.sendChessMove(currentMatch.id, publicKey!.toString(), {
        from,
        to,
        piece: engine.getPiece(to).piece!,
        timestamp: Date.now(),
      });

      // Check for game end
      const winner = engine.getWinner();
      if (winner !== null) {
        const reason = winner === 'draw' ? 'Draw' : 
                      winner === 'white' ? 'White wins by checkmate' : 
                      winner === 'black' ? 'Black wins by checkmate' : 'Draw';
        endGame(winner, reason);
      }

      // Force re-render
      const newEngine = new ChessEngine();
      newEngine.board = [...engine.board.map(row => [...row])];
      newEngine.currentPlayer = engine.currentPlayer;
      newEngine.gameState = engine.gameState;
      newEngine.moveHistory = [...engine.moveHistory];
      newEngine.whiteTime = engine.whiteTime;
      newEngine.blackTime = engine.blackTime;
      newEngine.lastMoveTime = engine.lastMoveTime;
      setEngine(newEngine);
    }
  }, [engine, playerColor, currentMatch, publicKey, endGame]);

  // Resign game
  const resignGame = useCallback(() => {
    const winner = playerColor === 'white' ? 'black' : 'white';
    endGame(winner, `${playerColor} resigned`);
  }, [playerColor, endGame]);

  // Offer draw
  const offerDraw = useCallback(() => {
    // TODO: Implement draw offer system via websocket
    endGame('draw', 'Draw by agreement');
  }, [endGame]);

  // Return to lobby
  const returnToLobby = useCallback(() => {
    setGamePhase('lobby');
    setEngine(new ChessEngine());
    setGameResult(null);
    setCurrentMatch(null);
    setOpponent(null);
    setTimeRemaining({ white: 300000, black: 300000 });
    loadAvailableMatches();
  }, [loadAvailableMatches]);

  // Cancel waiting for opponent
  const cancelMatch = useCallback(async () => {
    if (!currentMatch) return;

    try {
      await matchService.cancelMatch(currentMatch.id);
      returnToLobby();
    } catch (error) {
      console.error('Failed to cancel match:', error);
      returnToLobby(); // Return to lobby anyway
    }
  }, [currentMatch, returnToLobby]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-main text-text-primary">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 min-h-screen">
          <PageHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-6">
            <div className="max-w-4xl mx-auto text-center py-20">
              <div className="text-8xl mb-8">♟️</div>
              <h1 className="text-4xl font-bold text-text-primary mb-4 font-audiowide uppercase">Chess Blitz</h1>
              <p className="text-lg text-text-secondary mb-8 font-inter">
                Connect your wallet to play 5-minute blitz chess
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen">
        <PageHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-text-primary mb-2 font-audiowide uppercase">♟️ Chess Blitz</h1>
              <p className="text-lg text-text-secondary font-inter">5+0 • Real multiplayer • Winner takes all</p>
              {!socketConnected && (
                <p className="text-sm text-red-400 mt-2">⚠️ Connecting to game server...</p>
              )}
            </div>

            {/* Lobby Phase */}
            {gamePhase === 'lobby' && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Create Match */}
                  <div className="glass-card p-8 text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-6 font-audiowide">Create Match</h2>
                    
                    <div className="mb-6">
                      <label className="block text-text-secondary mb-2 font-inter">Wager Amount</label>
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setWagerAmount(0.05)}
                          className={`px-4 py-2 rounded-lg font-audiowide ${wagerAmount === 0.05 ? 'bg-accent-primary text-black' : 'bg-bg-card text-text-primary'}`}
                        >
                          0.05 SOL
                        </button>
                        <button
                          onClick={() => setWagerAmount(0.1)}
                          className={`px-4 py-2 rounded-lg font-audiowide ${wagerAmount === 0.1 ? 'bg-accent-primary text-black' : 'bg-bg-card text-text-primary'}`}
                        >
                          0.1 SOL
                        </button>
                        <button
                          onClick={() => setWagerAmount(0.25)}
                          className={`px-4 py-2 rounded-lg font-audiowide ${wagerAmount === 0.25 ? 'bg-accent-primary text-black' : 'bg-bg-card text-text-primary'}`}
                        >
                          0.25 SOL
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-sm text-text-secondary font-inter">
                        Vault Balance: {formatSOL(vaultBalance)}
                      </div>
                    </div>

                    <button
                      onClick={createMatch}
                      disabled={loading || !socketConnected || vaultBalance < wagerAmount * 1000000000}
                      className="primary-button font-audiowide disabled:opacity-50"
                    >
                      Create Match ({wagerAmount} SOL)
                    </button>
                  </div>

                  {/* Join Match */}
                  <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold text-text-primary mb-6 font-audiowide text-center">Available Matches</h2>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableMatches.length === 0 ? (
                        <div className="text-center text-text-secondary py-8">
                          <div className="text-4xl mb-4">🎯</div>
                          <p className="font-inter">No matches available</p>
                          <p className="text-sm font-inter">Create a match to get started!</p>
                        </div>
                      ) : (
                        availableMatches.map((match) => (
                          <div key={match.id} className="bg-bg-card rounded-lg p-4 flex items-center justify-between">
                            <div className="text-left">
                              <div className="font-audiowide text-text-primary">{match.wager} SOL</div>
                              <div className="text-sm text-text-secondary font-inter">
                                vs {match.player1.username || match.player1.wallet.slice(0, 8)}...
                              </div>
                            </div>
                            <button
                              onClick={() => joinMatch(match.id)}
                              disabled={!socketConnected}
                              className="px-4 py-2 bg-accent-primary text-black rounded-lg font-audiowide hover:bg-accent-secondary disabled:opacity-50"
                            >
                              Join
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={loadAvailableMatches}
                        disabled={!socketConnected}
                        className="secondary-button font-audiowide"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Creating/Joining Phase */}
            {(gamePhase === 'creating' || gamePhase === 'joining') && (
              <div className="max-w-2xl mx-auto text-center">
                <div className="glass-card p-8">
                  <div className="text-6xl mb-4">⏳</div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">
                    {gamePhase === 'creating' ? 'Creating Match...' : 'Joining Match...'}
                  </h2>
                  <p className="text-text-secondary font-inter">Please wait...</p>
                </div>
              </div>
            )}

            {/* Waiting for Opponent */}
            {gamePhase === 'waiting' && (
              <div className="max-w-2xl mx-auto text-center">
                <div className="glass-card p-8">
                  <div className="text-6xl mb-4">👥</div>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 font-audiowide">Waiting for Opponent...</h2>
                  <p className="text-text-secondary font-inter mb-4">
                    Match created with {wagerAmount} SOL wager
                  </p>
                  <p className="text-sm text-text-muted font-inter mb-6">
                    Share your match or wait for someone to join
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <button onClick={cancelMatch} className="secondary-button font-audiowide">
                      Cancel Match
                    </button>
                    <button onClick={loadAvailableMatches} className="primary-button font-audiowide">
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Playing Phase */}
            {gamePhase === 'playing' && (
              <div className="flex justify-center items-start space-x-8">
                {/* Timer */}
                <ChessTimer
                  whiteTime={timeRemaining.white}
                  blackTime={timeRemaining.black}
                  currentPlayer={engine.currentPlayer}
                  gameState={engine.gameState}
                />

                {/* Chess Board */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-center">
                    <div className="text-sm text-text-secondary font-inter">
                      You are playing as <span className="font-bold text-accent-primary">{playerColor}</span>
                    </div>
                    <div className="text-sm text-text-secondary font-inter">
                      vs {opponent?.username || opponent?.wallet.slice(0, 8)}... • {currentMatch?.wager} SOL
                    </div>
                  </div>

                  <ChessBoard
                    engine={engine}
                    onMove={handleMove}
                    playerColor={playerColor}
                    disabled={engine.currentPlayer !== playerColor}
                  />

                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={resignGame}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-audiowide hover:bg-red-700"
                    >
                      Resign
                    </button>
                    <button
                      onClick={offerDraw}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg font-audiowide hover:bg-gray-700"
                    >
                      Offer Draw
                    </button>
                  </div>
                </div>

                {/* Game Info */}
                <div className="w-64">
                  <div className="glass-card p-4">
                    <h3 className="font-audiowide text-text-primary mb-4">Game Info</h3>
                    <div className="space-y-2 text-sm font-inter">
                      <div>Wager: {currentMatch?.wager} SOL</div>
                      <div>Time Control: 5+0</div>
                      <div>Current Turn: {engine.currentPlayer}</div>
                      <div>Moves: {engine.moveHistory.length}</div>
                      <div>Status: {engine.gameState}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game Finished */}
            {gamePhase === 'finished' && gameResult && (
              <div className="max-w-2xl mx-auto text-center">
                <div className="glass-card p-8">
                  <div className="text-6xl mb-4">
                    {gameResult.winner === playerColor ? '🎉' : gameResult.winner === 'draw' ? '🤝' : '😞'}
                  </div>
                  <h2 className="text-3xl font-bold text-text-primary mb-4 font-audiowide">
                    {gameResult.winner === playerColor ? 'You Win!' : 
                     gameResult.winner === 'draw' ? 'Draw!' : 'You Lose!'}
                  </h2>
                  <p className="text-lg text-text-secondary mb-6 font-inter">{gameResult.reason}</p>
                  
                  <div className="mb-6">
                    <div className="text-2xl font-bold text-accent-primary font-audiowide">
                      {gameResult.winner === playerColor ? `+${(currentMatch?.wager || 0) * 1.85} SOL` :
                       gameResult.winner === 'draw' ? `+${(currentMatch?.wager || 0) * 0.925} SOL` : 
                       `-${currentMatch?.wager || 0} SOL`}
                    </div>
                    <div className="text-sm text-text-secondary font-inter">
                      {gameResult.winner === 'draw' ? 'Wagers returned (minus 7.5% fee)' : 
                       gameResult.winner === playerColor ? 'Winner takes 85% of pot' : 'Better luck next time!'}
                    </div>
                  </div>

                  <div className="flex space-x-4 justify-center">
                    <button onClick={returnToLobby} className="primary-button font-audiowide">
                      Play Again
                    </button>
                    <button onClick={() => router.push('/')} className="secondary-button font-audiowide">
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
} 