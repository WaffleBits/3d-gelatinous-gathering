"use client"

import { useState, useEffect } from "react"
import { useGameStore } from "../stores/gameStore"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { ShopModal } from "./ShopModal"
import { LeaderboardModal } from "./LeaderboardModal"
import { SettingsModal } from "./SettingsModal"
import { skins } from "../data/skins"
import type { PowerUpType } from "../types/PowerUp"

interface InterfaceProps {
  isPlaying: boolean
  onStart: (name: string, skin: number, multiplayer: boolean) => void
  onRestart: () => void
  multiplayer: boolean
  connecting: boolean
  connectionError: boolean
}

export default function Interface({
  isPlaying,
  onStart,
  onRestart,
  multiplayer,
  connecting,
  connectionError,
}: InterfaceProps) {
  const [playerName, setPlayerName] = useState("")
  const [selectedSkin, setSelectedSkin] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [multiplayerMode, setMultiplayerMode] = useState(false)

  const { score, gameOver, resetGame, coins, activePowerUps } = useGameStore()

  // Load saved player name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("playerName")
    if (savedName) {
      setPlayerName(savedName)
    }

    const savedSkin = localStorage.getItem("selectedSkin")
    if (savedSkin) {
      setSelectedSkin(Number.parseInt(savedSkin))
    }
  }, [])

  const handleStart = () => {
    if (playerName.trim()) {
      // Save player name to localStorage
      localStorage.setItem("playerName", playerName)
      localStorage.setItem("selectedSkin", selectedSkin.toString())

      onStart(playerName, selectedSkin, multiplayerMode)
    }
  }

  const handleRestart = () => {
    resetGame()
    onRestart()
  }

  const handleSkinSelect = (skinId: number) => {
    setSelectedSkin(skinId)
    localStorage.setItem("selectedSkin", skinId.toString())
  }

  // Get power-up icon and name
  const getPowerUpDisplay = (type: PowerUpType) => {
    switch (type) {
      case "speed":
        return { icon: "⚡", name: "Speed Boost" }
      case "size":
        return { icon: "⬆️", name: "Size Boost" }
      case "magnet":
        return { icon: "🧲", name: "Food Magnet" }
      case "shield":
        return { icon: "🛡️", name: "Shield" }
      default:
        return { icon: "?", name: type }
    }
  }

  if (gameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          <p className="text-xl mb-2">Your score: {score}</p>
          <p className="text-lg mb-6">Coins earned: +{Math.floor(score * 0.5)}</p>
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

            <div className="flex gap-2 mb-4">
              <div
                className={`flex-1 p-3 rounded-lg cursor-pointer transition-all flex items-center justify-center ${!multiplayerMode ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                onClick={() => setMultiplayerMode(false)}
              >
                Singleplayer
              </div>
              <div
                className={`flex-1 p-3 rounded-lg cursor-pointer transition-all flex items-center justify-center ${multiplayerMode ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                onClick={() => setMultiplayerMode(true)}
              >
                Multiplayer
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {skins.slice(0, 5).map((skin, index) => (
                <div
                  key={index}
                  className={`
                    p-2 rounded-lg cursor-pointer transition-all
                    ${selectedSkin === index ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}
                  `}
                  onClick={() => handleSkinSelect(index)}
                >
                  <div className="w-full aspect-square rounded-full mb-1" style={{ backgroundColor: skin.color }} />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowShop(true)} variant="outline" className="flex-1">
                Shop
              </Button>

              <Button onClick={() => setShowLeaderboard(true)} variant="outline" className="flex-1">
                Leaderboard
              </Button>

              <Button onClick={() => setShowSettings(true)} variant="outline" className="flex-1">
                Settings
              </Button>
            </div>

            <Button
              onClick={handleStart}
              disabled={!playerName.trim() || (multiplayerMode && connecting)}
              size="lg"
              className="w-full"
            >
              {multiplayerMode ? (connecting ? "Connecting..." : "Play Multiplayer") : "Play Singleplayer"}
            </Button>

            {connectionError && multiplayerMode && (
              <div className="mt-2 text-center text-sm text-destructive">
                <p>Failed to connect to multiplayer server.</p>
                <p>Playing in singleplayer mode instead.</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Use WASD or arrow keys to move</p>
            <p>Collect food to grow bigger</p>
            <p>Eat smaller players, avoid bigger ones</p>
            <p>Look for power-ups to gain advantages</p>
          </div>
        </div>

        {showShop && (
          <ShopModal onClose={() => setShowShop(false)} selectedSkin={selectedSkin} onSelectSkin={handleSkinSelect} />
        )}

        {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    )
  }

  // In-game UI
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 bg-black/50 p-3 rounded text-white">
        <div className="text-lg font-bold">Score: {score}</div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">💰</span>
          <span className="text-yellow-500">{coins}</span>
        </div>
      </div>

      {/* Active power-ups display */}
      {activePowerUps.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 p-2 rounded text-white flex gap-2">
          {activePowerUps.map((powerUp, index) => {
            const { icon, name } = getPowerUpDisplay(powerUp)
            return (
              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-black/30 rounded">
                <span className="text-lg">{icon}</span>
                <span>{name}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          onClick={() => setShowShop(true)}
          variant="outline"
          size="sm"
          className="pointer-events-auto flex items-center gap-1"
        >
          <span>💰</span>
          Shop
        </Button>

        <Button onClick={() => setShowSettings(true)} variant="outline" size="sm" className="pointer-events-auto">
          Settings
        </Button>
      </div>

      {/* Game controls help */}
      <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded text-white text-sm">
        <p>WASD or Arrows: Move</p>
        <p>Mouse: Look around</p>
      </div>

      {/* Show modals when needed */}
      {showShop && (
        <div className="pointer-events-auto">
          <ShopModal onClose={() => setShowShop(false)} selectedSkin={selectedSkin} onSelectSkin={handleSkinSelect} />
        </div>
      )}

      {showSettings && (
        <div className="pointer-events-auto">
          <SettingsModal onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  )
}

