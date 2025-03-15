"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { MeshStandardMaterial, Mesh, Group } from "three"
import { PowerUpType, PowerUpDefinition } from "@/lib/power-ups"

interface PowerUpProps {
  id: string
  type: PowerUpType
  position: [number, number, number]
  onCollect: (id: string, type: PowerUpType) => void
  definition: PowerUpDefinition
}

export function PowerUp({ id, type, position, onCollect, definition }: PowerUpProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  
  // Floating animation
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Rotate slowly
    groupRef.current.rotation.y += 0.01
    
    // Float up and down
    const y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.5
    groupRef.current.position.y = y
    
    // Pulse the emissive intensity
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 
        0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {/* Power-up object */}
      <mesh ref={meshRef} castShadow>
        {type === 'speed' && (
          <coneGeometry args={[0.3, 0.6, 8]} />
        )}
        {type === 'size' && (
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        )}
        {type === 'magnet' && (
          <cylinderGeometry args={[0.05, 0.25, 0.5, 16]} />
        )}
        {type === 'shield' && (
          <sphereGeometry args={[0.3, 16, 16]} />
        )}
        {type === 'ghost' && (
          <octahedronGeometry args={[0.3, 0]} />
        )}
        <meshStandardMaterial
          ref={materialRef}
          color={definition.color}
          emissive={definition.emissive}
          emissiveIntensity={0.8}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Particle effect around power-up */}
      <points>
        <sphereGeometry args={[0.6, 8, 8]} />
        <pointsMaterial
          color={definition.color}
          size={0.05}
          transparent
          opacity={0.4}
        />
      </points>
      
      {/* Floating label that always faces camera */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {definition.name}
      </Text>
    </group>
  )
} 