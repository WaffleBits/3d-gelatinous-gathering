"use client"

import { useRef, useEffect } from "react"
import { Text } from "@react-three/drei"
import { skins } from "../data/skins"
import type * as THREE from "three"

interface EnemyProps {
  id: string
  name: string
  position: [number, number, number]
  size: number
  score: number
  skinId: number
}

export function Enemy({ id, name, position, size, score, skinId }: EnemyProps) {
  const ref = useRef<THREE.Group>(null)
  const sphereRef = useRef<THREE.Mesh>(null)

  // Set initial position
  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(...position)
    }
  }, [position])

  // Get the current skin
  const skin = skins[skinId] || skins[0]

  return (
    <group ref={ref}>
      {/* Enemy sphere */}
      <mesh ref={sphereRef} castShadow>
        <sphereGeometry args={[size * 0.5, 32, 32]} />
        <meshStandardMaterial color={skin.color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Add a shadow plane that follows the enemy */}
      <mesh position={[0, -size * 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <circleGeometry args={[size * 0.4, 32]} />
        <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
      </mesh>

      {/* Enemy name */}
      <Text
        position={[0, size * 0.5 + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {name} - {score}
      </Text>
    </group>
  )
}

