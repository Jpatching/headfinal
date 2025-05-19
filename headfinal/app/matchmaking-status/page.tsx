"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity } from "lucide-react";
import GameText from "@/components/game-text";

interface MatchmakingStats {
  queueCount: number;
  activeMatches: number;
  lastMatched: string;
  pendingRequestsCount: number;
  matchesCount: number;
  pendingByAmount: Record<string, number>;
  pendingRequests: any[];
  recentMatches: any[];
  allKeys: string[];
  timestamp: string;
}

export default function MatchmakingDashboard() {
  const [stats, setStats] = useState<MatchmakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/matchmaking-debug");
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats({
        ...data.debugData,
        timestamp: data.timestamp
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load matchmaking stats");
      console.error("Error fetching matchmaking stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-6">
          <div className="flex justify-center items-center h-40">
            <div className="text-white text-center">
              <RefreshCw className="animate-spin h-10 w-10 mx-auto mb-4" />
              <p>Loading matchmaking statistics...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-6">
          <div className="flex justify-center items-center h-40">
            <div className="text-red-400 text-center">
              <p className="mb-4">Error: {error}</p>
              <Button 
                variant="outline" 
                className="bg-transparent border border-yellow-400 hover:bg-yellow-400 hover:text-blue-900"
                onClick={handleManualRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="h-8 w-8 text-yellow-400 mr-3" />
          <GameText variant="heading" className="text-2xl">Matchmaking Status</GameText>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {lastUpdated && `Last updated: ${lastUpdated}`}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-transparent border border-yellow-400 hover:bg-yellow-400 hover:text-blue-900"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Stats Card */}
          <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4">
            <GameText variant="subheading" className="mb-4">Key Statistics</GameText>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-blue-800 rounded-md">
                <span>Queue Count:</span>
                <span className="font-bold">{stats.queueCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-800 rounded-md">
                <span>Active Matches:</span>
                <span className="font-bold">{stats.activeMatches}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-800 rounded-md">
                <span>Pending Requests:</span>
                <span className="font-bold">{stats.pendingRequestsCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-800 rounded-md">
                <span>Total Matches:</span>
                <span className="font-bold">{stats.matchesCount}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-800 rounded-md">
                <span>Last Matched:</span>
                <span className="font-bold">{stats.lastMatched ? new Date(stats.lastMatched).toLocaleTimeString() : 'None'}</span>
              </div>
            </div>
          </Card>

          {/* Pending by Amount Card */}
          <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4">
            <GameText variant="subheading" className="mb-4">Pending by Bet Amount</GameText>
            {Object.keys(stats.pendingByAmount).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.pendingByAmount).map(([amount, count]) => (
                  <div key={amount} className="flex justify-between p-2 bg-blue-800 rounded-md">
                    <span>{amount} SOL:</span>
                    <span className="font-bold">{count} requests</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-400">No pending requests</div>
            )}
          </Card>

          {/* Recent Matches Card */}
          <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4 md:col-span-2">
            <GameText variant="subheading" className="mb-4">Recent Matches</GameText>
            {stats.recentMatches && stats.recentMatches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-blue-800 text-left">
                      <th className="px-4 py-2">Match ID</th>
                      <th className="px-4 py-2">Player 1</th>
                      <th className="px-4 py-2">Player 2</th>
                      <th className="px-4 py-2">Bet Amount</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentMatches.map((match) => (
                      <tr key={match.id} className="border-t border-blue-800">
                        <td className="px-4 py-2 text-xs">{formatId(match.id)}</td>
                        <td className="px-4 py-2 text-xs">{formatId(match.player1PublicKey)}</td>
                        <td className="px-4 py-2 text-xs">{formatId(match.player2PublicKey)}</td>
                        <td className="px-4 py-2">{match.betAmount} SOL</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">{match.winnerId ? formatId(match.winnerId) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 text-gray-400">No recent matches</div>
            )}
          </Card>

          {/* Pending Requests Card */}
          <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4 md:col-span-2">
            <GameText variant="subheading" className="mb-4">Pending Requests</GameText>
            {stats.pendingRequests && stats.pendingRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-blue-800 text-left">
                      <th className="px-4 py-2">Request ID</th>
                      <th className="px-4 py-2">Player</th>
                      <th className="px-4 py-2">Bet Amount</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pendingRequests.map((request) => (
                      <tr key={request.id} className="border-t border-blue-800">
                        <td className="px-4 py-2 text-xs">{formatId(request.id)}</td>
                        <td className="px-4 py-2 text-xs">{formatId(request.playerPublicKey)}</td>
                        <td className="px-4 py-2">{request.betAmount} SOL</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {request.timestamp ? new Date(request.timestamp).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 text-gray-400">No pending requests</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatId(id: string): string {
  if (!id) return '-';
  if (id.length <= 10) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-900 text-green-300';
    case 'completed':
      return 'bg-blue-900 text-blue-300';
    case 'cancelled':
      return 'bg-red-900 text-red-300';
    case 'pending':
      return 'bg-yellow-900 text-yellow-300';
    case 'matched':
      return 'bg-purple-900 text-purple-300';
    case 'expired':
      return 'bg-gray-900 text-gray-300';
    default:
      return 'bg-gray-800 text-gray-300';
  }
}
