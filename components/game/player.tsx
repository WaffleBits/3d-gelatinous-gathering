"use client"

import { useRef, useEffect, forwardRef, useState, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Html } from "@react-three/drei"
import { Vector3, type Mesh } from "three"
import { useMobile } from "@/hooks/use-mobile"
import { skins } from "@/lib/skins"
import { useGameStore } from "@/lib/game-store"
import { PowerUpType } from "@/lib/power-ups"

interface PlayerProps {
  name: string
  skinId: number
  size: number
  onCollectFood: (id: number) => void
  onEatEnemy: (id: number, size?: number) => void
  foods: { id: number; position: [number, number, number]; color: string }[]
  enemies: { id: number; position: [number, number, number]; size: number; color: string }[]
  onGameOver: () => void
}

export const Player = forwardRef<Mesh, PlayerProps>(function Player(
  { name, skinId, size, onCollectFood, onEatEnemy, foods, enemies, onGameOver },
  ref,
) {
  const { viewport } = useThree()
  const isMobile = useMobile()
  const velocity = useRef(new Vector3())
  const speed = useRef(0.1)
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [joystickAngle, setJoystickAngle] = useState(0)
  const [joystickStrength, setJoystickStrength] = useState(0)
  const sphereRef = useRef<Mesh>(null)
  const lastInputTime = useRef(0)
  const lastMovementUpdate = useRef(0)
  
  // For optimized rendering
  const clock = useRef({
    delta: 0,
    elapsed: 0,
    prevTime: performance.now() / 1000
  })

  // Get active power-ups from the game store
  const { activePowerUps, hasPowerUp } = useGameStore()
  
  // Adjust speed based on size and power-ups - only recalculate when needed
  useEffect(() => {
    // More dramatic speed reduction as size increases
    let baseSpeed = 0.1 / Math.pow(1 + size * 0.05, 1.2)
    
    // Apply speed boost if active
    if (hasPowerUp('speed')) {
      baseSpeed *= 1.5
    }
    
    speed.current = baseSpeed
  }, [size, activePowerUps, hasPowerUp])

  // Throttle function for rate limiting
  const throttle = (fn: Function, minInterval: number, timeRef: React.MutableRefObject<number>) => {
    const now = Date.now()
    if (now - timeRef.current >= minInterval) {
      fn()
      timeRef.current = now
    }
  }

  // Handle keyboard controls - Separate input handling from movement
  useEffect(() => {
    // Create an input state object that will be updated by events
    const inputState = {
      up: false,
      down: false,
      left: false,
      right: false
    }
    
    const updateVelocity = () => {
      // Reset velocity
      velocity.current.set(0, 0, 0)
      
      // Apply inputs
      if (inputState.up) velocity.current.z = -speed.current
      if (inputState.down) velocity.current.z = speed.current
      if (inputState.left) velocity.current.x = -speed.current
      if (inputState.right) velocity.current.x = speed.current
      
      // Normalize diagonal movement
      if ((inputState.up || inputState.down) && (inputState.left || inputState.right)) {
        velocity.current.normalize().multiplyScalar(speed.current)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          inputState.up = true
          break
        case "ArrowDown":
        case "s":
          inputState.down = true
          break
        case "ArrowLeft":
        case "a":
          inputState.left = true
          break
        case "ArrowRight":
        case "d":
          inputState.right = true
          break
      }
      updateVelocity()
      lastInputTime.current = Date.now()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          inputState.up = false
          break
        case "ArrowDown":
        case "s":
          inputState.down = false
          break
        case "ArrowLeft":
        case "a":
          inputState.left = false
          break
        case "ArrowRight":
        case "d":
          inputState.right = false
          break
      }
      updateVelocity()
      lastInputTime.current = Date.now()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Handle touch controls for mobile - optimized to reduce calculations
  useEffect(() => {
    if (!isMobile) return

    const handleTouchStart = (e: TouchEvent) => {
      setJoystickActive(true)
      const touch = e.touches[0]
      setJoystickPosition({ x: touch.clientX, y: touch.clientY })
      lastInputTime.current = Date.now()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!joystickActive) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - joystickPosition.x
      const deltaY = touch.clientY - joystickPosition.y

      // Calculate angle and strength
      const angle = Math.atan2(deltaY, deltaX)
      const strength = Math.min(1, Math.sqrt(deltaX ** 2 + deltaY ** 2) / 50)

      // Only update if there's a significant change (reduces unnecessary state updates)
      if (Math.abs(angle - joystickAngle) > 0.1 || Math.abs(strength - joystickStrength) > 0.05) {
        setJoystickAngle(angle)
        setJoystickStrength(strength)
        
        // Update velocity based on joystick
        velocity.current.x = Math.cos(angle) * strength * speed.current
        velocity.current.z = Math.sin(angle) * strength * speed.current
      }
      
      lastInputTime.current = Date.now()
    }

    const handleTouchEnd = () => {
      setJoystickActive(false)
      velocity.current.set(0, 0, 0)
      lastInputTime.current = Date.now()
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchmove", handleTouchMove)
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isMobile, joystickActive, joystickPosition, speed.current])

  // Update player position using frame-independent movement
  useFrame((_, delta) => {
    // Update clock for consistent timing
    const time = performance.now() / 1000
    clock.current.delta = time - clock.current.prevTime
    clock.current.elapsed += clock.current.delta
    clock.current.prevTime = time
    
    if (!ref || !("current" in ref) || !ref.current) return

    // Apply delta time for smoother, frame-independent movement
    ref.current.position.x += velocity.current.x * delta * 60
    ref.current.position.z += velocity.current.z * delta * 60

    // Keep player within bounds
    const bounds = 95
    ref.current.position.x = Math.max(-bounds, Math.min(bounds, ref.current.position.x))
    ref.current.position.z = Math.max(-bounds, Math.min(bounds, ref.current.position.z))

    // Optimize sphere rotation for visual effect
    throttle(() => {
      if (sphereRef.current && velocity.current.length() > 0.01) {
        sphereRef.current.rotation.x += delta * velocity.current.z * 2
        sphereRef.current.rotation.z -= delta * velocity.current.x * 2
      }
    }, 16, lastMovementUpdate) // 60fps target for visual effects
  })

  // Get the current skin
  const skin = skins[skinId] || skins[0]

  // Optimization: Memoize power-up effects to avoid recreating on every render
  const powerUpEffects = useMemo(() => {
    return {
      shield: hasPowerUp('shield') && (
        <mesh>
          <sphereGeometry args={[size * 0.6, 16, 16]} />
          <meshStandardMaterial 
            color="#44aaff" 
            transparent={true} 
            opacity={0.3} 
            emissive="#44aaff"
            emissiveIntensity={0.5}
          />
        </mesh>
      ),
      ghost: hasPowerUp('ghost') && (
        <mesh>
          <sphereGeometry args={[size * 0.55, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent={true} 
            opacity={0.2}
            emissive="#ffffff"
            emissiveIntensity={0.2}
          />
        </mesh>
      ),
      speed: hasPowerUp('speed') && (
        <points>
          <sphereGeometry args={[size * 0.7, 8, 8]} />
          <pointsMaterial 
            color="#ffcc00" 
            size={0.1} 
            transparent={true} 
            opacity={0.4}
          />
        </points>
      )
    }
  }, [size, hasPowerUp])

  // Optimized player rendering
  return (
    <group ref={ref as any} position={[0, 0, 0]}>
      {/* Player sphere */}
      <mesh ref={sphereRef} castShadow>
        <sphereGeometry args={[size * 0.5, 16, 16]} /> {/* Reduced from 32 segments */}
        <meshStandardMaterial color={skin.color} />
      </mesh>

      {/* Add a shadow plane that follows the player */}
      <mesh position={[0, -size * 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.4, 16]} /> {/* Reduced from 32 segments */}
        <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
      </mesh>
      
      {/* Power-up visual effects */}
      {powerUpEffects.shield}
      {powerUpEffects.ghost}
      {powerUpEffects.speed}
      
      {/* Player name */}
      <Text
        position={[0, size * 0.5 + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Mobile joystick UI */}
      {isMobile && joystickActive && (
        <Html fullscreen>
          <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full border-2 border-white/30 bg-black/20 touch-none">
            <div
              className="absolute w-20 h-20 rounded-full bg-white/50"
              style={{
                transform: `translate(${Math.cos(joystickAngle) * joystickStrength * 40}px, ${Math.sin(joystickAngle) * joystickStrength * 40}px)`,
                left: "25%",
                top: "25%",
              }}
            />
          </div>
        </Html>
      )}
    </group>
  )
})

