'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { 
  PV3_CONFIG, 
  derivePDAs, 
  formatSOL, 
  parseSOL 
} from '@/lib/solana-config';
import { 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

export interface Match {
  id: string;
  creator: string;
  joiner?: string;
  wagerAmount: number;
  gameType: number;
  status: 'waiting' | 'active' | 'completed';
  createdAt: number;
}

export interface GameStats {
  activeMatches: number;
  totalVolume: number;
  activePlayers: number;
  uptime: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  totalEarned: number; // in lamports
  pendingRewards: number; // in lamports
  weeklyEarnings: number; // in lamports
}

export interface RewardHistory {
  date: string;
  type: string;
  amount: number;
  status: 'claimed' | 'pending';
}

export interface UserProfile {
  id: string;
  wallet: string;
  username?: string;
  avatar?: string;
  totalEarnings: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  reputation: number;
  createdAt: string;
}

export const usePV3 = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();
  
  // State
  const [balance, setBalance] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    gamesPlayed: 47,
    gamesWon: 29,
    winRate: 61.7,
    totalWinnings: 2.45,
    totalLosses: 1.82,
    netProfit: 0.63,
    currentStreak: 3,
    longestStreak: 8,
  });
  const [gameStats] = useState<GameStats>({
    activeMatches: 2,
    totalVolume: 7.5,
    activePlayers: 1247,
    uptime: 99.2,
  });

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Wallet Authentication
  const authenticateWallet = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or does not support message signing');
    }

    try {
      setLoading(true);
      
      // Step 1: Get authentication message from backend
      const messageResponse = await fetch(`${API_BASE}/auth/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to get authentication message');
      }

      const { message } = await messageResponse.json();
      console.log('Got auth message:', message);
      
      // Step 2: Sign the message with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      
      // Convert signature to base58 (required by backend)
      const signatureBase58 = bs58.encode(signature);
      console.log('Signature created');

      // Step 3: Send signature to get session token
      const authResponse = await fetch(`${API_BASE}/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          signature: signatureBase58,
          message,
          timestamp: Date.now(),
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const authData = await authResponse.json();
      console.log('Authentication response:', authData);
      
      // Step 4: The backend sets an HTTP-only cookie, but we also need the token for API calls
      // We'll need to extract it from the response or use a different approach
      // For now, let's create a session token that matches the backend format
      const tokenPayload = {
        userId: authData.user.id,
        wallet: authData.user.wallet,
        timestamp: Date.now(),
      };
      const token = btoa(JSON.stringify(tokenPayload));
      
      setSessionToken(token);
      localStorage.setItem('pv3_session_token', token);
      localStorage.setItem('pv3_session_expires', authData.expiresAt.toString());
      
      console.log('Authentication successful');
      return authData;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, signMessage, API_BASE]);

  // Helper function to get auth headers with real session token
  const getAuthHeaders = useCallback(() => {
    if (!sessionToken) {
      throw new Error('No session token available. Please authenticate first.');
    }
    
    return {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    };
  }, [sessionToken]);

  // Check for existing session on wallet connection
  useEffect(() => {
    if (publicKey) {
      const storedToken = localStorage.getItem('pv3_session_token');
      const storedExpiry = localStorage.getItem('pv3_session_expires');
      
      if (storedToken && storedExpiry) {
        const expiresAt = parseInt(storedExpiry);
        if (Date.now() < expiresAt) {
          // Token is still valid
          setSessionToken(storedToken);
          console.log('Restored existing session');
        } else {
          // Token expired, clear it
          localStorage.removeItem('pv3_session_token');
          localStorage.removeItem('pv3_session_expires');
          console.log('Session expired');
        }
      }
    } else {
      // Wallet disconnected, clear session
      setSessionToken(null);
      localStorage.removeItem('pv3_session_token');
      localStorage.removeItem('pv3_session_expires');
    }
  }, [publicKey]);

  // Auto-authenticate on wallet connection if no valid session
  useEffect(() => {
    if (publicKey && !sessionToken && signMessage) {
      // Auto-authenticate when wallet connects
      authenticateWallet().catch(error => {
        console.error('Auto-authentication failed:', error);
      });
    }
  }, [publicKey, sessionToken, signMessage, authenticateWallet]);

  // Load wallet balance
  const loadBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance);

      // Check session vault balance
      const [vaultPDA] = derivePDAs.sessionVault(publicKey);
      try {
        const vaultBalance = await connection.getBalance(vaultPDA);
        setVaultBalance(vaultBalance);
      } catch {
        setVaultBalance(0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }, [connection, publicKey]);

  // Deposit SOL from wallet to vault
  const depositToVault = useCallback(async (amount: number) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const lamports = amount * LAMPORTS_PER_SOL;
    
    if (balance < lamports) {
      throw new Error('Insufficient wallet balance');
    }

    setLoading(true);
    try {
      const [vaultPDA] = derivePDAs.sessionVault(publicKey);
      
      // Create transaction to transfer SOL to vault PDA
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: vaultPDA,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Reload balances
      await loadBalance();
      
      return signature;
    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, connection, balance, loadBalance]);

  // Withdraw SOL from vault to wallet
  const withdrawFromVault = useCallback(async (amount: number) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const lamports = amount * LAMPORTS_PER_SOL;
    
    if (vaultBalance < lamports) {
      throw new Error('Insufficient vault balance');
    }

    setLoading(true);
    try {
      // Note: In production, this would need to go through the smart contract
      // to properly withdraw from the PDA back to the user
      console.log('Withdraw would require smart contract call to transfer from PDA to wallet');
      
      // For demo purposes, we'll just alert
      alert(`Withdraw of ${amount} SOL would be processed through smart contract`);
      
      return 'demo_withdraw_signature';
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, vaultBalance]);

  // Load live matches (mock data for now)
  const loadMatches = useCallback(() => {
    const mockMatches: Match[] = [
      {
        id: 'match_001',
        creator: 'CryptoKing',
        joiner: 'SolanaQueen',
        wagerAmount: 2.5,
        gameType: PV3_CONFIG.GAME_TYPES.COIN_FLIP,
        status: 'active',
        createdAt: Date.now() - 300000,
      },
      {
        id: 'match_002',
        creator: 'GameMaster',
        joiner: 'ProGamer',
        wagerAmount: 1.8,
        gameType: PV3_CONFIG.GAME_TYPES.ROCK_PAPER_SCISSORS,
        status: 'active',
        createdAt: Date.now() - 600000,
      },
    ];

    setMatches(mockMatches);
  }, []);

  // Initialize on wallet connection
  useEffect(() => {
    if (publicKey) {
      loadBalance();
      loadMatches();
    } else {
      setBalance(0);
      setVaultBalance(0);
      setMatches([]);
    }
  }, [publicKey, loadBalance, loadMatches]);

  // Game functionality
  const createGame = useCallback(async (gameType: number, wagerAmount: number) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    if (wagerAmount <= 0) {
      throw new Error('Wager amount must be greater than 0');
    }

    const wagerLamports = wagerAmount * LAMPORTS_PER_SOL;
    
    if (vaultBalance < wagerLamports) {
      throw new Error('Insufficient vault balance');
    }

    setLoading(true);
    try {
      // In production, this would call the smart contract
      // For now, we'll simulate game creation
      const newMatch: Match = {
        id: `match_${Date.now()}`,
        creator: publicKey.toString(),
        wagerAmount,
        gameType,
        status: 'waiting',
        createdAt: Date.now(),
      };

      setMatches(prev => [newMatch, ...prev]);
      
      // Simulate vault balance deduction
      setVaultBalance(prev => prev - wagerLamports);
      
      return newMatch.id;
    } catch (error) {
      console.error('Game creation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, vaultBalance]);

  // Process game completion - this should be called after each game
  const processGameCompletion = useCallback(async (matchId: string, wagerAmount: number, won: boolean) => {
    if (!publicKey) return;

    try {
      // Calculate platform fee (6.5% of pot)
      const totalPot = wagerAmount * 2;
      const platformFee = totalPot * 0.065;

      // Call backend to process referral rewards
      const headers = getAuthHeaders();
      await fetch(`${API_BASE}/matches/${matchId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          winner: won ? publicKey.toString() : 'opponent',
          platformFee,
          wagerAmount,
        }),
      });
    } catch (error) {
      console.error('Error processing game completion:', error);
    }
  }, [publicKey, API_BASE, getAuthHeaders]);

  const playGame = useCallback(async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    setLoading(true);
    try {
      let result;
      const totalPot = match.wagerAmount * 2;
      const fee = totalPot * 0.065; // 6.5% platform fee
      const winnings = totalPot - fee;

      // Simple game logic based on game type
      switch (match.gameType) {
        case PV3_CONFIG.GAME_TYPES.COIN_FLIP:
          result = Math.random() < 0.5;
          break;
        case PV3_CONFIG.GAME_TYPES.DICE_ROLL:
          const playerRoll = Math.floor(Math.random() * 6) + 1;
          const opponentRoll = Math.floor(Math.random() * 6) + 1;
          result = playerRoll > opponentRoll;
          break;
        case PV3_CONFIG.GAME_TYPES.ROCK_PAPER_SCISSORS:
          result = Math.random() < 0.5;
          break;
        default:
          result = Math.random() < 0.5;
      }

      // Update match to completed
      setMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, status: 'completed' as const }
          : m
      ));

      // Update player statistics
      setPlayerStats(prev => {
        const newStats = {
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: result ? prev.gamesWon + 1 : prev.gamesWon,
          currentStreak: result ? prev.currentStreak + 1 : 0,
        };

        if (result) {
          newStats.totalWinnings += winnings;
          newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
        } else {
          newStats.totalLosses += match.wagerAmount;
        }

        newStats.netProfit = newStats.totalWinnings - newStats.totalLosses;
        newStats.winRate = (newStats.gamesWon / newStats.gamesPlayed) * 100;

        return newStats;
      });

      // Process referral rewards after game completion
      await processGameCompletion(matchId, match.wagerAmount, result);

      // If player wins, add winnings to vault
      if (result) {
        setVaultBalance(prev => prev + (winnings * LAMPORTS_PER_SOL));
        return { won: true, amount: winnings, matchId };
      } else {
        return { won: false, amount: 0, matchId };
      }
    } catch (error) {
      console.error('Play game error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [matches, processGameCompletion]);

  const joinGame = useCallback(async (matchId: string) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status !== 'waiting') {
        throw new Error('Match is not available to join');
      }

      const wagerLamports = match.wagerAmount * LAMPORTS_PER_SOL;
      
      if (vaultBalance < wagerLamports) {
        throw new Error('Insufficient vault balance');
      }

      // Update match status
      setMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, joiner: publicKey.toString(), status: 'active' as const }
          : m
      ));

      // Deduct wager from vault
      setVaultBalance(prev => prev - wagerLamports);

      // Start the game automatically
      setTimeout(() => playGame(matchId), 1000);

      return matchId;
    } catch (error) {
      console.error('Join game error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, vaultBalance, matches, playGame]);

  const quickPlay = useCallback(async (gameType: number, wagerAmount: number) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // Create game and play immediately
      const matchId = await createGame(gameType, wagerAmount);
      
      // Simulate finding an opponent and playing
      setTimeout(async () => {
        try {
          const result = await playGame(matchId);
          
          if (result.won) {
            alert(`🎉 You won ${formatSOL(result.amount * LAMPORTS_PER_SOL)} SOL!`);
          } else {
            alert(`😞 You lost ${wagerAmount} SOL. Better luck next time!`);
          }
        } catch (error) {
          alert(`Game error: ${error}`);
        }
      }, 2000);
      
      return matchId;
    } catch (error) {
      console.error('Quick play error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, createGame, playGame]);

  // Load referral stats
  const loadReferralStats = useCallback(async (): Promise<ReferralStats | null> => {
    if (!publicKey) return null;

    try {
      const headers = getAuthHeaders();
      console.log('API_BASE:', API_BASE);
      console.log('Headers:', headers);
      
      // Get referral code
      console.log('Fetching referral code...');
      const codeResponse = await fetch(`${API_BASE}/referrals/my-code`, { headers });
      console.log('Code response status:', codeResponse.status);
      
      if (!codeResponse.ok) {
        console.error('Failed to fetch referral code:', codeResponse.statusText);
        // Return demo data if API fails
        return {
          referralCode: `REF_${publicKey.toString().slice(0, 8)}`,
          totalReferred: 0,
          totalEarned: 0,
          pendingRewards: 0,
          weeklyEarnings: 0,
        };
      }
      
      const codeData = await codeResponse.json();
      console.log('Code data:', codeData);
      
      // Get referral stats
      console.log('Fetching referral stats...');
      const statsResponse = await fetch(`${API_BASE}/referrals/stats`, { headers });
      console.log('Stats response status:', statsResponse.status);
      
      if (!statsResponse.ok) {
        console.error('Failed to fetch referral stats:', statsResponse.statusText);
        // Return partial data with just the referral code
        return {
          referralCode: codeData.referralCode || `REF_${publicKey.toString().slice(0, 8)}`,
          totalReferred: 0,
          totalEarned: 0,
          pendingRewards: 0,
          weeklyEarnings: 0,
        };
      }
      
      const statsData = await statsResponse.json();
      console.log('Stats data:', statsData);
      
      // Get earnings
      console.log('Fetching earnings...');
      const earningsResponse = await fetch(`${API_BASE}/referrals/earnings-sol`, { headers });
      console.log('Earnings response status:', earningsResponse.status);
      
      if (!earningsResponse.ok) {
        console.error('Failed to fetch earnings:', earningsResponse.statusText);
        // Return data without earnings
        return {
          referralCode: codeData.referralCode || `REF_${publicKey.toString().slice(0, 8)}`,
          totalReferred: statsData.stats?.totalReferrals || 0,
          totalEarned: 0,
          pendingRewards: 0,
          weeklyEarnings: 0,
        };
      }
      
      const earningsData = await earningsResponse.json();
      console.log('Earnings data:', earningsData);

      return {
        referralCode: codeData.referralCode || `REF_${publicKey.toString().slice(0, 8)}`,
        totalReferred: statsData.stats?.totalReferrals || 0,
        totalEarned: Math.floor((earningsData.totalEarnings || 0) * LAMPORTS_PER_SOL),
        pendingRewards: Math.floor((earningsData.pendingEarnings || 0) * LAMPORTS_PER_SOL),
        weeklyEarnings: Math.floor((earningsData.totalEarnings || 0) * 0.3 * LAMPORTS_PER_SOL), // Estimate weekly as 30% of total
      };
    } catch (error) {
      console.error('Error loading referral stats:', error);
      // Return demo data as fallback
      return {
        referralCode: `REF_${publicKey.toString().slice(0, 8)}`,
        totalReferred: 0,
        totalEarned: 0,
        pendingRewards: 0,
        weeklyEarnings: 0,
      };
    }
  }, [publicKey, API_BASE, getAuthHeaders]);

  // Claim referral rewards
  const claimReferralRewards = useCallback(async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_BASE}/referrals/claim-sol`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destinationWallet: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to claim rewards');
      }

      const data = await response.json();
      
      // Reload wallet balance after claim
      await loadBalance();
      
      return {
        success: data.success,
        transactionId: data.transactionId,
        amount: data.amount,
      };
    } catch (error) {
      console.error('Claim rewards error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, API_BASE, loadBalance, getAuthHeaders]);

  // Get reward history
  const loadRewardHistory = useCallback(async (): Promise<RewardHistory[]> => {
    if (!publicKey) return [];

    try {
      const headers = getAuthHeaders();
      console.log('Fetching reward history...');
      const response = await fetch(`${API_BASE}/referrals/sol-history`, { headers });
      console.log('History response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch reward history:', response.statusText);
        return []; // Return empty array instead of throwing
      }
      
      const data = await response.json();
      console.log('History data:', data);

      return data.history?.map((item: { timestamp: string; amount: number; claimed: boolean }) => ({
        date: new Date(item.timestamp).toISOString().split('T')[0],
        type: 'Referral Rakeback',
        amount: Math.floor(item.amount * LAMPORTS_PER_SOL),
        status: item.claimed ? 'claimed' : 'pending',
      })) || [];
    } catch (error) {
      console.error('Error loading reward history:', error);
      return []; // Return empty array instead of throwing
    }
  }, [publicKey, API_BASE, getAuthHeaders]);

  // Load user profile
  const loadUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!publicKey || !sessionToken) return null;

    try {
      const headers = getAuthHeaders();
      console.log('Fetching user profile...');
      const response = await fetch(`${API_BASE}/auth/profile`, { headers });
      console.log('Profile response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch user profile:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('Profile data:', data);

      return {
        id: data.user.id,
        wallet: data.user.wallet,
        username: data.user.username,
        avatar: data.user.avatar,
        totalEarnings: data.user.totalEarnings,
        totalMatches: data.user.totalMatches,
        wins: data.user.wins,
        losses: data.user.losses,
        winRate: data.user.winRate,
        reputation: data.user.reputation,
        createdAt: data.user.createdAt,
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, [publicKey, sessionToken, API_BASE, getAuthHeaders]);

  // Apply referral code
  const applyReferralCode = useCallback(async (referralCode: string) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE}/referrals/apply-code`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ referralCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply referral code');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Apply referral code error:', error);
      throw error;
    }
  }, [publicKey, API_BASE, getAuthHeaders]);

  return {
    // State
    connected: !!publicKey,
    publicKey,
    balance,
    vaultBalance,
    loading,
    matches,
    gameStats,
    playerStats,
    
    // Actions
    loadBalance,
    depositToVault,
    withdrawFromVault,
    createGame,
    joinGame,
    playGame,
    quickPlay,
    
    // Referral & Rewards
    loadReferralStats,
    claimReferralRewards,
    loadRewardHistory,
    loadUserProfile,
    applyReferralCode,
    processGameCompletion,
    
    // Utilities
    formatSOL,
    parseSOL,
    
    // Config
    gameTypes: PV3_CONFIG.GAME_TYPES,
    fees: PV3_CONFIG.FEES,
  };
}; 