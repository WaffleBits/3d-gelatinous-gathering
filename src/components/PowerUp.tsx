"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import type { PowerUpType } from "../types/PowerUp"
import type { Mesh } from "three"

interface PowerUpProps {
  id: string
  position: [number, number, number]
  type: PowerUpType
}

export function PowerUp({ id, position, type }: PowerUpProps) {
  const ref = useRef<Mesh>(null)
  const innerRef = useRef<Mesh>(null)

  // Get color and icon based on power-up type
  const getPowerUpProperties = () => {
    switch (type) {
      case "speed":
        return { color: "#00ff00", icon: "⚡" }
      case "size":
        return { color: "#ff00ff", icon: "⬆️" }
      case "magnet":
        return { color: "#0088ff", icon: "🧲" }
      case "shield":
        return { color: "#ffcc00", icon: "🛡️" }
      case "coin":
        return { color: "#ffdd00", icon: "💰" }
      default:
        return { color: "#ffffff", icon: "?" }
    }
  }

  const { color, icon } = getPowerUpProperties()

  // Make power-ups more visible and attractive

  // Animate the power-up
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta
      ref.current.position.y = Math.sin(Date.now() * 0.001) * 0.2 + 0.5
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 2
      innerRef.current.rotation.x += delta
    }
  })

  return (
    <group position={[position[0], position[1] + 0.5, position[2]]}>
      {/* Add a light to make power-up glow */}
      <pointLight position={[0, 0, 0]} distance={3} intensity={0.5} color={color} />

      {/* Power-up outer shape */}
      <mesh ref={ref} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.7} />

        {/* Power-up inner shape */}
        <mesh ref={innerRef} position={[0, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      </mesh>

      {/* Power-up icon */}
      <Text position={[0, 1.2, 0]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
        {icon}
      </Text>

      {/* Add a shadow */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
      </mesh>
    </group>
  )
}

