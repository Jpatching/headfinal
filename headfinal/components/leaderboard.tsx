"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import GameText from "@/components/game-text"
import { getLeaderboard } from "@/lib/redis"

interface LeaderboardEntry {
  rank: number
  playerId: string
  score: number
}

interface LeaderboardProps {
  limit?: number
}

export default function Leaderboard({ limit = 5 }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        const data = await getLeaderboard('winnings', limit)
        
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

    fetchLeaderboard()
  }, [limit])

  // Function to format player IDs (truncate long wallet addresses)
  const formatPlayerId = (playerId: string) => {
    if (playerId.length > 20) {
      return `${playerId.slice(0, 4)}...${playerId.slice(-4)}`
    }
    return playerId
  }

  return (
    <Card className="bg-blue-900 border-4 border-yellow-400 shadow-lg p-4">
      <div className="flex items-center justify-center mb-4">
        <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
        <GameText variant="heading">Top Players</GameText>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-white">Loading leaderboard...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-400">{error}</div>
      ) : (
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
      )}
    </Card>
  )
}
