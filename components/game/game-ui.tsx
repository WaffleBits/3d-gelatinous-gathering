"use client"

import { useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShopModal } from "./shop-modal"
import { LeaderboardModal } from "./leaderboard-modal"
import { skins } from "@/lib/skins"

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

  const { score, gameOver, resetGame, coins } = useGameStore()

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
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  // Start screen
  if (!isPlaying && !gameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-900 to-black">
        <div className="bg-black/80 backdrop-blur-xl p-8 rounded-xl border border-blue-500/30 shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-white mb-6">3D Gelatinous Gathering</h1>
          
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-1">
              Enter Your Name
            </label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Name"
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 w-full"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Visual Quality</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={visualQuality === "low" ? "default" : "outline"}
                onClick={() => setVisualQuality?.("low")}
                className={visualQuality === "low" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 text-gray-300"}
              >
                Low
              </Button>
              <Button
                variant={visualQuality === "medium" ? "default" : "outline"}
                onClick={() => setVisualQuality?.("medium")}
                className={visualQuality === "medium" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 text-gray-300"}
              >
                Medium
              </Button>
              <Button
                variant={visualQuality === "high" ? "default" : "outline"}
                onClick={() => setVisualQuality?.("high")}
                className={visualQuality === "high" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-700 text-gray-300"}
              >
                High
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              FPS issues? Try a lower quality setting
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Choose Your Skin</h3>
              <Button 
                onClick={() => setShowShop(true)} 
                variant="link" 
                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                size="sm"
              >
                Shop for more
              </Button>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center">
              <div 
                className="w-12 h-12 rounded-full" 
                style={{ backgroundColor: skins[selectedSkin].color }}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          >
            Start Game
          </Button>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>Use WASD or arrow keys to move</p>
            <p>Collect food to grow bigger</p>
            <p>Eat smaller players, avoid bigger ones</p>
          </div>
        </div>
        
        {showShop && (
          <ShopModal 
            onClose={() => setShowShop(false)} 
            selectedSkin={selectedSkin} 
            onSelectSkin={setSelectedSkin} 
          />
        )}
      </div>
    )
  }

  // Game over screen
  if (gameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="bg-black/80 backdrop-blur-xl p-8 rounded-xl border border-red-500/30 shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-red-500 mb-2">Game Over</h1>
          <p className="text-xl text-center text-white mb-6">Your score: {score}</p>
          
          <Button 
            onClick={handleRestart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          >
            Play Again
          </Button>
        </div>
      </div>
    )
  }

  // In-game UI
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
        <p className="text-lg font-bold text-white">Score: {score}</p>
      </div>
      
      {/* Coins */}
      <div className="absolute top-4 left-32 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-yellow-400 mr-2" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
        <p className="text-lg font-bold text-white">{coins}</p>
      </div>
      
      {/* Quality selector */}
      <div className="absolute bottom-4 left-4 text-white text-sm">
        <div className="flex items-center space-x-1">
          <span className={visualQuality === "low" ? "font-bold" : "opacity-60"}>Low Quality</span>
          <span className="opacity-40">/</span>
          <span className={visualQuality === "medium" ? "font-bold" : "opacity-60"}>Medium Quality</span>
          <span className="opacity-40">/</span>
          <span className={visualQuality === "high" ? "font-bold" : "opacity-60"}>High Quality</span>
        </div>
        <p className="text-xs opacity-75 mt-1">FPS issues? Try a lower quality setting</p>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex space-x-2 pointer-events-auto">
        <Button
          onClick={() => setShowShop(true)}
          variant="outline"
          className="bg-black/60 border-white/20 text-white hover:bg-black/80"
        >
          Shop
        </Button>
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          className="bg-black/60 border-white/20 text-white hover:bg-black/80"
        >
          Settings
        </Button>
      </div>
      
      {/* Settings panel */}
      {showSettings && renderSettingsPanel()}
      
      {/* Shop modal */}
      {showShop && (
        <ShopModal 
          onClose={() => setShowShop(false)} 
          selectedSkin={selectedSkin} 
          onSelectSkin={setSelectedSkin} 
        />
      )}
    </div>
  )
}

