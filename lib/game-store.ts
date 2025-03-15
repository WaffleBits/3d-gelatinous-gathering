import { create } from "zustand"
import { PowerUpType } from "./power-ups"

interface GameState {
  score: number
  highScore: number
  gameOver: boolean
  coins: number;
  activePowerUps: PowerUpType[];
  addScore: (points: number) => void
  setGameOver: (value: boolean) => void
  resetGame: () => void
  addCoins: (amount: number) => void
  activatePowerUp: (type: PowerUpType, duration: number) => void
  deactivatePowerUp: (type: PowerUpType) => void
  hasPowerUp: (type: PowerUpType) => boolean
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  highScore: 0,
  gameOver: false,
  coins: 0,
  activePowerUps: [],

  addScore: (points) =>
    set((state) => {
      const newScore = state.score + points
      return {
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
      }
    }),

  setGameOver: (value) => set({ gameOver: value }),

  resetGame: () => set({ score: 0, gameOver: false, activePowerUps: [] }),
  
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  
  activatePowerUp: (type, duration) => {
    set((state) => ({
      activePowerUps: [...state.activePowerUps, type]
    }));
    
    // Set timeout to deactivate the power-up after duration
    setTimeout(() => {
      get().deactivatePowerUp(type);
    }, duration);
  },
  
  deactivatePowerUp: (type) => set((state) => ({
    activePowerUps: state.activePowerUps.filter(t => t !== type)
  })),
  
  hasPowerUp: (type) => {
    const state = get();
    return state.activePowerUps.includes(type);
  }
}))

