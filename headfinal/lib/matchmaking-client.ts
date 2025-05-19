'use client';

/**
 * Client-side utility for interacting with the matchmaking system
 */

// Types
export interface MatchRequest {
  id: string;
  playerPublicKey: string;
  betAmount: number;
  status: 'pending' | 'matched' | 'cancelled' | 'expired';
  matchId?: string;
}

export interface Match {
  id: string;
  player1PublicKey: string;
  player2PublicKey: string;
  betAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  winnerId?: string;
}

export interface MatchmakingResult {
  success: boolean;
  status?: 'pending' | 'matched' | 'cancelled' | 'error';
  requestId?: string;
  matchId?: string;
  error?: string;
  match?: Match;
}

/**
 * Creates a match request and waits for a match, with timeout
 */
export async function findMatch(
  playerPublicKey: string, 
  betAmount: number,
  timeoutSeconds: number = 30
): Promise<MatchmakingResult> {
  try {
    // Create the initial match request
    const response = await fetch('/api/matchmaking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerPublicKey,
        betAmount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        status: 'error',
        error: errorData.error || 'Failed to create match request',
      };
    }

    const data = await response.json();

    // If we got a match immediately, return it
    if (data.status === 'matched' && data.matchId) {
      return {
        success: true,
        status: 'matched',
        requestId: data.requestId,
        matchId: data.matchId,
      };
    }

    // If we have a pending request, set up polling or SSE to wait for a match
    if (data.status === 'pending' && data.requestId) {
      return await waitForMatch(data.requestId, timeoutSeconds);
    }

    // Unexpected response
    return {
      success: false,
      status: 'error',
      error: 'Unexpected response from matchmaking service',
    };
  } catch (error) {
    console.error('Error in findMatch:', error);
    return {
      success: false,
      status: 'error',
      error: error.message || 'Failed to find match',
    };
  }
}

/**
 * Wait for a match using Server-Sent Events or polling as fallback
 */
async function waitForMatch(
  requestId: string,
  timeoutSeconds: number
): Promise<MatchmakingResult> {
  // First try Server-Sent Events if supported
  if (typeof EventSource !== 'undefined') {
    return await waitForMatchSSE(requestId, timeoutSeconds);
  } else {
    // Fall back to polling for older browsers
    return await waitForMatchPolling(requestId, timeoutSeconds);
  }
}

/**
 * Wait for a match using Server-Sent Events
 */
async function waitForMatchSSE(
  requestId: string,
  timeoutSeconds: number
): Promise<MatchmakingResult> {
  return new Promise((resolve) => {
    const source = new EventSource(`/api/matchmaking/stream?requestId=${requestId}`);
    let timeoutId: NodeJS.Timeout;

    // Set timeout to abort if no match found
    if (timeoutSeconds > 0) {
      timeoutId = setTimeout(() => {
        source.close();
        // Cancel the request
        cancelMatchRequest(requestId).catch(console.error);
        resolve({
          success: false,
          status: 'cancelled',
          requestId,
          error: 'Matchmaking timed out',
        });
      }, timeoutSeconds * 1000);
    }

    // Process SSE events
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE event:', data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle request status updates
    source.addEventListener('request', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === 'matched' && data.matchId) {
          clearTimeout(timeoutId);
          source.close();
          resolve({
            success: true,
            status: 'matched',
            requestId,
            matchId: data.matchId,
          });
        } else if (data.status === 'cancelled' || data.status === 'expired') {
          clearTimeout(timeoutId);
          source.close();
          resolve({
            success: false,
            status: data.status,
            requestId,
            error: `Match request ${data.status}`,
          });
        }
      } catch (error) {
        console.error('Error processing request event:', error);
      }
    });

    // Handle errors
    source.addEventListener('error', () => {
      source.close();
      clearTimeout(timeoutId);
      // If SSE fails, fall back to polling
      waitForMatchPolling(requestId, timeoutSeconds).then(resolve);
    });
  });
}

/**
 * Wait for a match using polling (fallback method)
 */
async function waitForMatchPolling(
  requestId: string,
  timeoutSeconds: number
): Promise<MatchmakingResult> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  const pollIntervalMs = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check match status
      const response = await fetch('/api/matchmaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check',
          requestId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          status: 'error',
          requestId,
          error: errorData.error || 'Failed to check match status',
        };
      }

      const data = await response.json();

      // If we found a match, return it
      if (data.status === 'matched' && data.matchId) {
        return {
          success: true,
          status: 'matched',
          requestId,
          matchId: data.matchId,
        };
      }

      // If request was cancelled or expired, return error
      if (data.status === 'cancelled' || data.status === 'expired') {
        return {
          success: false,
          status: data.status,
          requestId,
          error: `Match request ${data.status}`,
        };
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      console.error('Error polling for match:', error);
      // Continue polling despite errors
    }
  }

  // Timeout reached, cancel the request
  try {
    await cancelMatchRequest(requestId);
  } catch (error) {
    console.error('Error cancelling match request:', error);
  }

  return {
    success: false,
    status: 'cancelled',
    requestId,
    error: 'Matchmaking timed out',
  };
}

/**
 * Cancel a pending match request
 */
export async function cancelMatchRequest(requestId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/matchmaking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        requestId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'cancelled';
  } catch (error) {
    console.error('Error cancelling match request:', error);
    return false;
  }
}

/**
 * Get a match by ID
 */
export async function getMatch(matchId: string): Promise<Match | null> {
  try {
    const response = await fetch(`/api/matches/${matchId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.match || null;
  } catch (error) {
    console.error('Error getting match:', error);
    return null;
  }
}

/**
 * Subscribe to match updates using Server-Sent Events
 */
export function subscribeToMatchUpdates(
  matchId: string,
  onUpdate: (match: Match) => void,
  onError: (error: string) => void
): () => void {
  if (typeof EventSource === 'undefined') {
    onError('Server-Sent Events not supported in this browser');
    return () => {};
  }

  const source = new EventSource(`/api/matchmaking/stream?matchId=${matchId}`);

  // Process match updates
  source.addEventListener('match', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
      
      // If match is completed or cancelled, close the connection
      if (data.status === 'completed' || data.status === 'cancelled') {
        source.close();
      }
    } catch (error) {
      console.error('Error processing match event:', error);
    }
  });

  // Handle errors
  source.addEventListener('error', () => {
    source.close();
    onError('Connection to match updates lost');
  });

  // Return cleanup function
  return () => {
    source.close();
  };
}
