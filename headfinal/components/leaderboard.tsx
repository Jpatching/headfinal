"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Trophy, Refresh } from "lucide-react"
import GameText from "@/components/game-text"
import { getLeaderboard } from "@/lib/redis"
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
  rank: number
  playerId: string
  score: number
}

interface LeaderboardProps {
  limit?: number
  type?: 'wins' | 'winnings'
  autoRefresh?: boolean
}

export default function Leaderboard({ 
  limit = 5, 
  type = 'winnings',
  autoRefresh = true
}: LeaderboardProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // Reference to the SSE connection
  const eventSourceRef = useRef<EventSource | null>(null)

  // Function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true)
      const data = await getLeaderboard(type, limit)
      
      // If no real data yet, show placeholder data
      if (!data || data.length === 0) {
        const placeholders: LeaderboardEntry[] = [
          { rank: 1, playerId: "CR7", score: 1000 },
          { rank: 2, playerId: "Messi", score: 850 },
          { rank: 3, playerId: "Neymar", score: 700 },
          { rank: 4, playerId: "Mbappe", score: 500 },
          { rank: 5, playerId: "SBF", score: 0 }
        ].slice(0, limit)
        
        setLeaders(placeholders)
      } else {
        setLeaders(data)
      }
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      setError("Failed to load leaderboard data")
      
      // Show placeholder data on error
      const placeholders: LeaderboardEntry[] = [
        { rank: 1, playerId: "CR7", score: 1000 },
        { rank: 2, playerId: "Messi", score: 850 },
        { rank: 3, playerId: "Neymar", score: 700 },
        { rank: 4, playerId: "Mbappe", score: 500 },
        { rank: 5, playerId: "SBF", score: 0 }
      ].slice(0, limit)
      
      setLeaders(placeholders)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initialize leaderboard
    fetchLeaderboardData()
    
    // Set up auto-refresh
    let refreshInterval: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      refreshInterval = setInterval(fetchLeaderboardData, 10000) // Refresh every 10 seconds
    }
    
    // Try to set up SSE (Server-Sent Events) for real-time updates
    const setupSSE = () => {
      try {
        // Close any existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }
        
        // Create new connection
        const source = new EventSource('/api/leaderboard/stream')
        eventSourceRef.current = source
        
        source.onmessage = (event) => {
          try {
            const eventData = JSON.parse(event.data)
            if (eventData.type === type) {
              setLeaders(eventData.leaders)
              setLastUpdate(new Date().toLocaleTimeString())
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error)
          }
        }
        
        source.onerror = () => {
          // On error, close connection and fall back to polling
          source.close()
          eventSourceRef.current = null
        }
      } catch (error) {
        console.error('Error setting up SSE:', error)
      }
    }
    
    // Try to set up SSE if browser supports it
    if (autoRefresh && typeof EventSource !== 'undefined') {
      setupSSE()
    }
    
    // Cleanup function
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [limit, type, autoRefresh])

  // Function to format player IDs (truncate long wallet addresses)
  const formatPlayerId = (playerId: string) => {
    if (playerId.length > 20) {
      return `${playerId.slice(0, 4)}...${playerId.slice(-4)}`
    }
    return playerId
  }

  // Handle manual refresh
  const handleRefresh = () => {
    if (eventSourceRef.current) {
      // If we have an active SSE connection, just update the UI state
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 500)
    } else {
      // Otherwise fetch fresh data
      fetchLeaderboardData()
    }
  }

  return (
    <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
          <GameText variant="heading">Top Players</GameText>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          className="bg-transparent border border-yellow-400 hover:bg-yellow-400 hover:text-blue-900"
          onClick={handleRefresh}
        >
          <Refresh className="h-4 w-4 mr-1" />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-white">Loading leaderboard...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-400">{error}</div>
      ) : (
        <>
          <div className="space-y-2">
            {leaders.map((entry, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded-md ${
                  index === 0 ? "bg-yellow-400 text-blue-900" : "bg-blue-800 text-white"
                }`}
              >
                <div className="flex items-center">
                  <span className="font-bold w-6 text-center">{entry.rank}</span>
                  <span className="ml-2">{formatPlayerId(entry.playerId)}</span>
                </div>
                <div className="font-bold">{entry.score.toLocaleString()} SOL</div>
              </div>
            ))}
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-gray-400 mt-2 text-right">
              Last updated: {lastUpdate}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
