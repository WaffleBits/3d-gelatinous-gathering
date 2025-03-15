// Power-up types with different effects
export type PowerUpType = 'speed' | 'size' | 'magnet' | 'shield' | 'ghost';

export interface PowerUpDefinition {
  id: PowerUpType;
  name: string;
  description: string;
  duration: number; // Duration in milliseconds
  color: string;
  emissive: string;
  scale: number;
  effect: string;
}

// Define all available power-ups
export const powerUps: Record<PowerUpType, PowerUpDefinition> = {
  speed: {
    id: 'speed',
    name: 'Speed Boost',
    description: 'Move 50% faster for a limited time',
    duration: 10000, // 10 seconds
    color: '#ffcc00',
    emissive: '#ffcc00',
    scale: 0.4,
    effect: 'speed'
  },
  size: {
    id: 'size',
    name: 'Growth Spurt',
    description: 'Instantly grow 25% larger',
    duration: 15000, // 15 seconds
    color: '#ff5500',
    emissive: '#ff5500',
    scale: 0.5,
    effect: 'size'
  },
  magnet: {
    id: 'magnet',
    name: 'Food Magnet',
    description: 'Attract nearby food towards you',
    duration: 8000, // 8 seconds
    color: '#cc44ff',
    emissive: '#cc44ff',
    scale: 0.4,
    effect: 'magnet'
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    description: 'Protect against one attack from larger players',
    duration: 12000, // 12 seconds
    color: '#44aaff',
    emissive: '#44aaff',
    scale: 0.5,
    effect: 'shield'
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost Mode',
    description: 'Pass through other players for a short time',
    duration: 6000, // 6 seconds
    color: '#aaaaaa',
    emissive: '#ffffff',
    scale: 0.4,
    effect: 'ghost'
  }
};

// Generate a random power-up
export function getRandomPowerUp(): PowerUpDefinition {
  const types = Object.keys(powerUps) as PowerUpType[];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return powerUps[randomType];
}

// Calculate power-up spawn positions
export function generatePowerUpPosition(bounds = 90): [number, number, number] {
  return [
    (Math.random() * 2 - 1) * bounds,
    0.5, // Slightly elevated off the ground
    (Math.random() * 2 - 1) * bounds
  ];
} 