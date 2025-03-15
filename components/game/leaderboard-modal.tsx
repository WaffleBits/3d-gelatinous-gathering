"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface LeaderboardModalProps {
  onClose: () => void
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  // Mock leaderboard data
  const leaderboardData = [
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          {leaderboardData.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-md bg-muted">
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center">{index + 1}</span>
                <span>{entry.name}</span>
              </div>
              <span className="font-mono">{entry.score}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Play more to improve your ranking!</p>
        </div>
      </div>
    </div>
  )
}

