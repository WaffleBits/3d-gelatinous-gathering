export type PowerUpType = "speed" | "size" | "magnet" | "shield" | "coin"

export interface PowerUpItem {
  id: string
  position: [number, number, number]
  type: PowerUpType
  duration?: number
}

