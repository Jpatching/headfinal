'use client';

export interface Match {
  id: string;
  gameType: string;
  wager: number;
  status: 'pending' | 'in_progress' | 'completed';
  player1: {
    id: string;
    wallet: string;
    username?: string;
  };
  player2?: {
    id: string;
    wallet: string;
    username?: string;
  };
  winner?: {
    id: string;
    wallet: string;
    username?: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  escrowAddress?: string;
}

class MatchService {
  private API_BASE: string;

  constructor() {
    this.API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('pv3_session_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Create a new chess match
  async createChessMatch(wager: number): Promise<Match> {
    try {
      const response = await fetch(`${this.API_BASE}/matches`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          gameType: 'chess',
          wager,
          expiryMinutes: 30,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create match');
      }

      const data = await response.json();
      return data.match;
    } catch (error) {
      console.error('Failed to create chess match:', error);
      throw error;
    }
  }

  // Join an existing match
  async joinMatch(matchId: string): Promise<Match> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/${matchId}/join`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join match');
      }

      const data = await response.json();
      return data.match;
    } catch (error) {
      console.error('Failed to join match:', error);
      throw error;
    }
  }

  // Get available chess matches
  async getAvailableChessMatches(): Promise<Match[]> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/available?gameType=chess`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch matches');
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Failed to fetch available matches:', error);
      return []; // Return empty array on error
    }
  }

  // Get match details
  async getMatch(matchId: string): Promise<Match | null> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/${matchId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.match;
    } catch (error) {
      console.error('Failed to fetch match:', error);
      return null;
    }
  }

  // Submit match result
  async submitMatchResult(matchId: string, winnerId: string, gameData: Record<string, unknown>): Promise<Match> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/${matchId}/result`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          matchId,
          winnerId,
          gameData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit result');
      }

      const data = await response.json();
      return data.match;
    } catch (error) {
      console.error('Failed to submit match result:', error);
      throw error;
    }
  }

  // Cancel a match
  async cancelMatch(matchId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/${matchId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel match');
      }
    } catch (error) {
      console.error('Failed to cancel match:', error);
      throw error;
    }
  }

  // Get user's matches
  async getUserMatches(): Promise<Match[]> {
    try {
      const response = await fetch(`${this.API_BASE}/matches/my-matches`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user matches');
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Failed to fetch user matches:', error);
      return [];
    }
  }
}

// Export singleton instance
export const matchService = new MatchService();
export default matchService; 