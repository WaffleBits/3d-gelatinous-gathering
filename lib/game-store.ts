import { create } from "zustand"
import { PowerUpType } from "./power-ups"
import type { Player } from "./types/Player"

interface GameState {
  // Game state
  score: number
  highScore: number
  gameOver: boolean
  isPlaying: boolean
  
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
  addScore: (points: number) => void
  setGameOver: (value: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  resetGame: () => void
  
  setPlayerId: (id: string) => void
  setPlayerName: (name: string) => void
  setSelectedSkin: (skinId: number) => void
  addCoins: (amount: number) => void
  
  activatePowerUp: (type: PowerUpType, duration: number) => void
  deactivatePowerUp: (type: PowerUpType) => void
  hasPowerUp: (type: PowerUpType) => boolean
  
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  updatePlayer: (player: Player) => void
  updateLocalPlayer: (update: Partial<Player>) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // Game state
  score: 0,
  highScore: 0,
  gameOver: false,
  isPlaying: false,
  
  // Player state
  playerId: "",
  playerName: "Player",
  selectedSkin: 0,
  coins: 0,
  playerSize: 1,
  playerSpeed: 0.1,
  activePowerUps: [],
  
  // Multiplayer state
  players: [],
  
  // Actions
  addScore: (points) => {
    set((state) => {
      const newScore = state.score + points
      const newHighScore = Math.max(state.highScore, newScore)
      return { score: newScore, highScore: newHighScore }
    })
  },
  
  setGameOver: (value) => set({ gameOver: value }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  resetGame: () => set({ score: 0, gameOver: false, activePowerUps: [] }),
  
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setSelectedSkin: (skinId) => set({ selectedSkin: skinId }),
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  
  activatePowerUp: (type, duration) => {
    set((state) => ({
      activePowerUps: [...state.activePowerUps.filter(t => t !== type), type]
    }))
    
    // Set timeout to deactivate
    setTimeout(() => {
      get().deactivatePowerUp(type)
    }, duration)
  },
  
  deactivatePowerUp: (type) => {
    set((state) => ({
      activePowerUps: state.activePowerUps.filter(t => t !== type)
    }))
  },
  
  hasPowerUp: (type) => {
    return get().activePowerUps.includes(type)
  },
  
  setPlayers: (players) => set({ players }),
  
  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players.filter(p => p.id !== player.id), player]
    }))
  },
  
  removePlayer: (id) => {
    set((state) => ({
      players: state.players.filter(p => p.id !== id)
    }))
  },
  
  updatePlayer: (player) => {
    set((state) => ({
      players: state.players.map(p => p.id === player.id ? { ...p, ...player } : p)
    }))
  },
  
  updateLocalPlayer: (update) => {
    const playerId = get().playerId
    set((state) => ({
      players: state.players.map(p => p.id === playerId ? { ...p, ...update } : p)
    }))
  }
}))

