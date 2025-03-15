"use client"

import { Suspense, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Loader } from "./components/Loader"
import Scene from "./components/Scene"
import Interface from "./components/Interface"
import { useGameStore } from "./stores/gameStore"
import { type Socket, io } from "socket.io-client"
import type { Player as PlayerType } from "./types/Player"

export default function App() {
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [multiplayer, setMultiplayer] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(false)

  const {
    setPlayers,
    addPlayer,
    removePlayer,
    updatePlayer,
    setPlayerId,
    playerId,
    playerName,
    setPlayerName,
    selectedSkin,
    setSelectedSkin,
    isPlaying,
    setIsPlaying,
    resetGame,
  } = useGameStore()

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Connect to multiplayer server
  const connectToServer = async () => {
    if (connecting) return

    setConnecting(true)
    setConnectionError(false)

    try {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || "https://agario3d-server.example.com", {
        timeout: 10000,
        reconnectionAttempts: 3,
      })

      newSocket.on("connect", () => {
        console.log("Connected to server")
        setMultiplayer(true)
        setConnecting(false)
        setSocket(newSocket)
      })

      newSocket.on("connect_error", (err) => {
        console.error("Connection error:", err)
        setConnectionError(true)
        setConnecting(false)
        setMultiplayer(false)
        newSocket.disconnect()
      })

      newSocket.on("players", (players: PlayerType[]) => {
        setPlayers(players)
      })

      newSocket.on("playerJoined", (player: PlayerType) => {
        addPlayer(player)
      })

      newSocket.on("playerLeft", (id: string) => {
        removePlayer(id)
      })

      newSocket.on("playerUpdated", (player: PlayerType) => {
        updatePlayer(player)
      })

      newSocket.on("assignId", (id: string) => {
        setPlayerId(id)
      })

      // Set a timeout for connection
      setTimeout(() => {
        if (!newSocket.connected) {
          console.log("Connection timeout")
          setConnectionError(true)
          setConnecting(false)
          setMultiplayer(false)
          newSocket.disconnect()
        }
      }, 10000)
    } catch (error) {
      console.error("Failed to connect:", error)
      setConnectionError(true)
      setConnecting(false)
      setMultiplayer(false)
    }
  }

  // Start game function
  const startGame = (name: string, skin: number, multiplayerMode = false) => {
    setPlayerName(name)
    setSelectedSkin(skin)

    if (multiplayerMode) {
      connectToServer()
    }

    setIsPlaying(true)
  }

  // Restart game function
  const restartGame = () => {
    resetGame()

    if (socket && multiplayer) {
      socket.emit("respawn", { name: playerName, skin: selectedSkin })
    }

    setIsPlaying(true)
  }

  // Clean up socket connection on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  if (loading) {
    return <Loader progress={100} text="Initializing Game..." />
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <Canvas shadows camera={{ position: [0, 15, 0], fov: 50, near: 0.1, far: 1000 }}>
        <Suspense fallback={null}>{isPlaying && <Scene multiplayer={multiplayer} socket={socket} />}</Suspense>
      </Canvas>

      <Interface
        isPlaying={isPlaying}
        onStart={startGame}
        onRestart={restartGame}
        multiplayer={multiplayer}
        connecting={connecting}
        connectionError={connectionError}
      />
    </div>
  )
}

