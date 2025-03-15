"use client"

import { useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShopModal } from "./shop-modal"
import { LeaderboardModal } from "./leaderboard-modal"

interface GameUIProps {
  isPlaying: boolean
  onStart: (name: string) => void
  selectedSkin: number
  setSelectedSkin: (skin: number) => void
  visualQuality?: "low" | "medium" | "high"
  setVisualQuality?: (quality: "low" | "medium" | "high") => void
}

export function GameUI({ isPlaying, onStart, selectedSkin, setSelectedSkin, visualQuality = "medium", setVisualQuality }: GameUIProps) {
  const [playerName, setPlayerName] = useState("")
  const [showShop, setShowShop] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { score, gameOver, resetGame } = useGameStore()

  const handleStart = () => {
    if (playerName.trim()) {
      onStart(playerName)
    }
  }

  const handleRestart = () => {
    resetGame()
    onStart(playerName)
  }

  // Settings panel
  const renderSettingsPanel = () => {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 p-6 rounded-lg backdrop-blur-lg border border-white/20 w-80 z-20">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        
        <div className="mb-4">
          <h3 className="text-white mb-2">Visual Quality</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setVisualQuality?.("low")}
              className={`px-3 py-1 rounded ${visualQuality === "low" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"}`}
            >
              Low
            </button>
            <button
              onClick={() => setVisualQuality?.("medium")}
              className={`px-3 py-1 rounded ${visualQuality === "medium" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"}`}
            >
              Medium
            </button>
            <button
              onClick={() => setVisualQuality?.("high")}
              className={`px-3 py-1 rounded ${visualQuality === "high" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"}`}
            >
              High
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(false)}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          <p className="text-xl mb-6">Your score: {score}</p>
          <Button onClick={handleRestart} size="lg" className="w-full">
            Play Again
          </Button>
        </div>
      </div>
    )
  }

  if (!isPlaying) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-8">3D Agar.io</h1>

          <div className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full"
            />

            <div className="flex gap-2">
              <Button onClick={() => setShowShop(true)} variant="outline" className="flex-1">
                Shop
              </Button>

              <Button onClick={() => setShowLeaderboard(true)} variant="outline" className="flex-1">
                Leaderboard
              </Button>
            </div>

            <Button onClick={handleStart} disabled={!playerName.trim()} size="lg" className="w-full">
              Play
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Use WASD or arrow keys to move</p>
            <p>Collect food to grow bigger</p>
            <p>Eat smaller players, avoid bigger ones</p>
          </div>
        </div>

        {showShop && (
          <ShopModal onClose={() => setShowShop(false)} selectedSkin={selectedSkin} onSelectSkin={setSelectedSkin} />
        )}

        {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

        {showSettings && renderSettingsPanel()}
      </div>
    )
  }

  // In-game UI
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-white">Score: {score}</div>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isPlaying && setVisualQuality && (
        <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-lg text-white">
          <button 
            onClick={() => setVisualQuality("low")} 
            className={`px-3 py-1 rounded mr-2 ${visualQuality === "low" ? "bg-green-500" : "bg-gray-700"}`}
          >
            Low Quality (Best Performance)
          </button>
          <button 
            onClick={() => setVisualQuality("medium")} 
            className={`px-3 py-1 rounded mr-2 ${visualQuality === "medium" ? "bg-green-500" : "bg-gray-700"}`}
          >
            Medium Quality
          </button>
          <button 
            onClick={() => setVisualQuality("high")} 
            className={`px-3 py-1 rounded ${visualQuality === "high" ? "bg-green-500" : "bg-gray-700"}`}
          >
            High Quality
          </button>
          <div className="mt-2 text-xs text-center">
            FPS issues? Try a lower quality setting
          </div>
        </div>
      )}
    </div>
  )
}

