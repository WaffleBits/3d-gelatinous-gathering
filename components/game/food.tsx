"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"

interface FoodProps {
  id: number
  position: [number, number, number]
  color: string
}

export function Food({ id, position, color }: FoodProps) {
  const ref = useRef<Mesh>(null)

  // Use a consistent offset for each food item based on its ID
  const offset = useMemo(() => {
    return Math.sin(id * 0.1) * 1000
  }, [id])

  // Add a subtle floating animation
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
      ref.current.position.y = Math.sin(Date.now() * 0.002 + offset) * 0.1 + 0.2
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  )
}

