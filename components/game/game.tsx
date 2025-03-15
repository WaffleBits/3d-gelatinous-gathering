"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useState } from "react"
import { GameScene } from "./game-scene"
import { GameUI } from "./game-ui"
import { GameProvider } from "@/lib/game-context"

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [selectedSkin, setSelectedSkin] = useState(0)
  const [visualQuality, setVisualQuality] = useState<"low" | "medium" | "high">("medium")

  const startGame = (name: string) => {
    setPlayerName(name)
    setIsPlaying(true)
  }

  return (
    <GameProvider>
      <div className="relative w-full h-screen">
        <Canvas shadows camera={{ position: [0, 15, 0], fov: 50, near: 0.1, far: 1000 }}>
          <Suspense fallback={null}>
            {isPlaying && (
              <GameScene 
                playerName={playerName} 
                selectedSkin={selectedSkin} 
                visualQuality={visualQuality}
              />
            )}
          </Suspense>
        </Canvas>

        <GameUI
          isPlaying={isPlaying}
          onStart={startGame}
          selectedSkin={selectedSkin}
          setSelectedSkin={setSelectedSkin}
          visualQuality={visualQuality}
          setVisualQuality={setVisualQuality}
        />
      </div>
    </GameProvider>
  )
}

