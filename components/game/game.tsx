"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useState, useEffect, useRef } from "react"
import { GameScene } from "./game-scene"
import { GameUI } from "./game-ui"
import { GameProvider } from "@/lib/game-context"
import { Loader } from "@/components/ui/loader"

// Simple FPS counter component
function FpsCounter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const lastUpdate = useRef(performance.now());

  useEffect(() => {
    let frameId: number;
    let animationActive = true;

    const updateFps = () => {
      frames.current += 1;
      const now = performance.now();
      const delta = now - lastUpdate.current;

      if (delta >= 1000) {
        setFps(Math.round((frames.current * 1000) / delta));
        frames.current = 0;
        lastUpdate.current = now;
      }

      if (animationActive) {
        frameId = requestAnimationFrame(updateFps);
      }
    };

    frameId = requestAnimationFrame(updateFps);

    return () => {
      animationActive = false;
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="bg-black/60 text-white px-2 py-1 rounded font-mono text-sm flex items-center">
      <span className="mr-1">FPS:</span>
      <span className={fps > 30 ? "text-green-400" : fps > 15 ? "text-yellow-400" : "text-red-400"}>
        {fps}
      </span>
    </div>
  );
}

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [selectedSkin, setSelectedSkin] = useState(0)
  const [visualQuality, setVisualQuality] = useState<"low" | "medium" | "high">("medium")
  const [isMounted, setIsMounted] = useState(false)

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const startGame = (name: string) => {
    setPlayerName(name)
    setIsPlaying(true)
  }

  // Prevent hydration issues by not rendering until client-side
  if (!isMounted) {
    return <Loader />;
  }

  return (
    <GameProvider>
      <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-black overflow-hidden">
        {/* Performance monitor */}
        {isPlaying && (
          <div className="absolute top-16 right-4 z-10">
            <FpsCounter />
          </div>
        )}
        
        <Canvas 
          shadows 
          dpr={[1, visualQuality === "low" ? 1 : visualQuality === "medium" ? 1.5 : 2]} 
          performance={{ min: 0.5 }}
          gl={{ 
            antialias: visualQuality !== "low", 
            alpha: false, 
            powerPreference: "high-performance",
            depth: true,
          }}
          camera={{ 
            position: [0, 15, 0], 
            fov: 60, 
            near: 0.1, 
            far: 1000 
          }}
        >
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

