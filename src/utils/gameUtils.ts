import type { Vector3 } from "three"

// Generate a random position within bounds
export function generateRandomPosition(bounds: number): [number, number, number] {
  return [Math.random() * bounds * 2 - bounds, 0, Math.random() * bounds * 2 - bounds]
}

// Check collision between two objects
export function checkCollision(pos1: Vector3, pos2: Vector3, radius1: number, radius2: number): boolean {
  const distance = pos1.distanceTo(pos2)
  return distance < radius1 + radius2
}

// Calculate size based on score
export function calculateSize(score: number): number {
  return 1 + score * 0.1
}

// Calculate speed based on size (larger = slower)
export function calculateSpeed(size: number): number {
  return 0.1 / (1 + size * 0.05)
}

