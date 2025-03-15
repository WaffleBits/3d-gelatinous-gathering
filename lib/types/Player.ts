export interface Player {
  id: string
  name?: string
  position: [number, number, number]
  velocity?: [number, number, number]
  size?: number
  score?: number
  skin?: number
  isBot?: boolean
} 