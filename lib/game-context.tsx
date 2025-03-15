"use client"

import { createContext, useContext, type ReactNode } from "react"

type GameContextType = {}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  // Add any global game state and logic here

  return <GameContext.Provider value={{}}>{children}</GameContext.Provider>
}

export function useGameContext() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider")
  }
  return context
}

