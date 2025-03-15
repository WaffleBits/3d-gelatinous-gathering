"use client"

import { Button } from "./ui/Button"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useGameStore } from "../stores/gameStore"

interface LeaderboardModalProps {
  onClose: () => void
}

interface LeaderboardEntry {
  name: string
  score: number
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { score, playerName } = useGameStore()

  useEffect(() => {
    // Load leaderboard data from localStorage
    const savedLeaderboard = localStorage.getItem("leaderboard")
    let leaderboard: LeaderboardEntry[] = savedLeaderboard
      ? JSON.parse(savedLeaderboard)
      : [
          { name: "ProGamer123", score: 156 },
          { name: "AgarioKing", score: 142 },
          { name: "BlobMaster", score: 137 },
          { name: "CellEater99", score: 125 },
          { name: "SphereHunter", score: 118 },
          { name: "GrowthMachine", score: 105 },
          { name: "BallRoller", score: 98 },
          { name: "CellDivider", score: 92 },
          { name: "SizeMatters", score: 87 },
          { name: "EatOrBeEaten", score: 81 },
        ]

    // Add current player's high score if available
    if (playerName && score > 0) {
      // Check if player already exists in leaderboard
      const existingEntry = leaderboard.findIndex((entry) => entry.name === playerName)

      if (existingEntry >= 0) {
        // Update score if higher
        if (score > leaderboard[existingEntry].score) {
          leaderboard[existingEntry].score = score
        }
      } else {
        // Add new entry
        leaderboard.push({ name: playerName, score })
      }

      // Sort and limit to top 10
      leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10)

      // Save updated leaderboard
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard))
    }

    setLeaderboardData(leaderboard)
    setLoading(false)
  }, [score, playerName])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.map((entry, index) => (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-3 rounded-md 
                  ${entry.name === playerName ? "bg-primary/20" : "bg-muted"}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold w-6 text-center">{index + 1}</span>
                  <span>{entry.name}</span>
                </div>
                <span className="font-mono">{entry.score}</span>
              </div>
            ))}

            {leaderboardData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No scores yet. Play a game to set a record!</div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Play more to improve your ranking!</p>
        </div>
      </div>
    </div>
  )
}

