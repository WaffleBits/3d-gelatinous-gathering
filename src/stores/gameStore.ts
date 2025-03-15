import { create } from "zustand"
import type { Player } from "../types/Player"
import type { PowerUpType } from "../types/PowerUp"

interface GameState {
  // Game state
  isPlaying: boolean
  gameOver: boolean
  score: number
  highScore: number

  // Player state
  playerId: string
  playerName: string
  selectedSkin: number
  coins: number
  playerSize: number
  playerSpeed: number
  activePowerUps: PowerUpType[]

  // Multiplayer state
  players: Player[]

  // Actions
  setIsPlaying: (isPlaying: boolean) => void
  setGameOver: (gameOver: boolean) => void
  addScore: (points: number) => void
  resetGame: () => void

  setPlayerId: (id: string) => void
  setPlayerName: (name: string) => void
  setSelectedSkin: (skinId: number) => void
  addCoins: (amount: number) => void

  activatePowerUp: (type: PowerUpType, duration: number) => void
  deactivatePowerUp: (type: PowerUpType) => void

  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  updatePlayer: (player: Player) => void
  updateLocalPlayer: (update: Partial<Player>) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // Game state
  isPlaying: false,
  gameOver: false,
  score: 0,
  highScore: 0,

  // Player state
  playerId: "",
  playerName: "",
  selectedSkin: 0,
  coins: 0,
  playerSize: 1,
  playerSpeed: 0.1,
  activePowerUps: [],

  // Multiplayer state
  players: [],

  // Actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setGameOver: (gameOver) => set({ gameOver }),

  addScore: (points) =>
    set((state) => {
      const newScore = state.score + points
      // Update player size based on score
      const newSize = 1 + newScore * 0.1
      // Update player speed (inversely proportional to size)
      const newSpeed = 0.1 / (1 + newSize * 0.05)

      return {
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        playerSize: newSize,
        playerSpeed: state.activePowerUps.includes("speed") ? newSpeed * 1.5 : newSpeed,
      }
    }),

  resetGame: () =>
    set((state) => ({
      score: 0,
      gameOver: false,
      playerSize: 1,
      playerSpeed: 0.1,
      activePowerUps: [],
    })),

  setPlayerId: (id) => set({ playerId: id }),

  setPlayerName: (name) => set({ playerName: name }),

  setSelectedSkin: (skinId) => set({ selectedSkin: skinId }),

  addCoins: (amount) =>
    set((state) => ({
      coins: state.coins + amount,
    })),

  activatePowerUp: (type, duration) =>
    set((state) => {
      // Apply power-up effect
      const newState: Partial<GameState> = {
        activePowerUps: [...state.activePowerUps, type],
      }

      // Apply specific power-up effects
      if (type === "speed") {
        newState.playerSpeed = state.playerSpeed * 1.5
      } else if (type === "size") {
        newState.playerSize = state.playerSize * 1.2
      }

      // Set timeout to deactivate power-up
      setTimeout(() => {
        get().deactivatePowerUp(type)
      }, duration)

      return newState
    }),

  deactivatePowerUp: (type) =>
    set((state) => {
      // Remove power-up from active list
      const newActivePowerUps = state.activePowerUps.filter((t) => t !== type)

      // Revert specific power-up effects
      const newState: Partial<GameState> = {
        activePowerUps: newActivePowerUps,
      }

      if (type === "speed") {
        newState.playerSpeed = 0.1 / (1 + state.playerSize * 0.05)
      } else if (type === "size") {
        newState.playerSize = 1 + state.score * 0.1
      }

      return newState
    }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  removePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((player) => player.id !== id),
    })),

  updatePlayer: (updatedPlayer) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === updatedPlayer.id ? { ...player, ...updatedPlayer } : player,
      ),
    })),

  updateLocalPlayer: (update) =>
    set((state) => {
      const { playerId } = state

      // Update the local player in the players array
      const updatedPlayers = state.players.map((player) => (player.id === playerId ? { ...player, ...update } : player))

      // If the player doesn't exist in the array yet, add them
      if (!updatedPlayers.some((player) => player.id === playerId) && playerId) {
        updatedPlayers.push({
          id: playerId,
          name: state.playerName,
          position: [0, 0, 0],
          size: state.playerSize,
          score: state.score,
          skin: state.selectedSkin,
          ...update,
        })
      }

      return { players: updatedPlayers }
    }),
}))

