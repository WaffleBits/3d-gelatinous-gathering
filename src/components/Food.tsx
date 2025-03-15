"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"

interface FoodProps {
  id: string
  position: [number, number, number]
  color: string
  value?: number
}

export function Food({ id, position, color, value = 1 }: FoodProps) {
  const ref = useRef<Mesh>(null)

  // Add a subtle floating animation
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
      ref.current.position.y = Math.sin(Date.now() * 0.002 + Number.parseInt(id)) * 0.1 + 0.2
    }
  })

  // Larger food for higher value
  const size = value > 1 ? 0.3 : 0.2

  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} />
    </mesh>
  )
}

