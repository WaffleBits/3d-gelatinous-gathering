import { io, Socket } from "socket.io-client"
import { useEffect, useState } from "react"

// Player data interface
export interface PlayerData {
  id: string
  name: string
  position: [number, number, number]
  size: number
  score: number
  skinId: number
  color: string
}

// Create a socket connection
let socket: Socket | null = null

export function initializeSocket(serverUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001") {
  if (!socket) {
    socket = io(serverUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    console.log("Socket initialized")
  }

  return socket
}

export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map())

  useEffect(() => {
    const socket = initializeSocket()

    function onConnect() {
      console.log("Socket connected")
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log("Socket disconnected")
      setIsConnected(false)
    }

    function onPlayersUpdate(updatedPlayers: PlayerData[]) {
      const newPlayersMap = new Map<string, PlayerData>()
      updatedPlayers.forEach((player) => {
        newPlayersMap.set(player.id, player)
      })
      setPlayers(newPlayersMap)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("players", onPlayersUpdate)

    // Cleanup on unmount
    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("players", onPlayersUpdate)
    }
  }, [])

  return { isConnected, players, socket }
}

// Helper functions for game actions
export function joinGame(playerName: string, skinId: number) {
  if (!socket) return
  
  socket.emit("join", { name: playerName, skinId })
}

export function updatePlayerPosition(position: [number, number, number], size: number, score: number) {
  if (!socket) return
  
  socket.emit("updatePosition", { position, size, score })
}

export function playerDied() {
  if (!socket) return
  
  socket.emit("playerDied")
}

export function disconnect() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
} 