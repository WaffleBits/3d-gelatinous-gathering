"use client"

import { useRef, useEffect } from "react"
import { Text } from "@react-three/drei"
import type { Group } from "three"

interface EnemyProps {
  id: number
  position: [number, number, number]
  size: number
  color: string
  score?: number
}

export function Enemy({ id, position, size, color, score = 0 }: EnemyProps) {
  const groupRef = useRef<Group>(null)

  // Update position when props change
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2])
    }
  }, [position])

  // Generate a random bot name
  const botName = `Bot ${id + 1}`

  return (
    <group ref={groupRef}>
      {/* Enemy sphere */}
      <mesh castShadow>
        <sphereGeometry args={[size * 0.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Add a shadow plane that follows the enemy */}
      <mesh position={[0, -size * 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.4, 32]} />
        <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
      </mesh>

      {/* Enemy name - positioned relative to the group */}
      <Text
        position={[0, size * 0.5 + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {botName} - {score}
      </Text>
    </group>
  )
}

