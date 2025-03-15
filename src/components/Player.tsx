"use client"

import { useRef, useEffect, forwardRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Html, Trail } from "@react-three/drei"
import { Vector3, type Mesh, type MeshStandardMaterial } from "three"
import { useMobile } from "../../hooks/use-mobile"
import { skins } from "../data/skins"
import type { FoodItem } from "../types/Food"
import type { Player as PlayerType } from "../types/Player"
import type { PowerUpItem } from "../types/PowerUp"
import { checkCollision } from "../utils/gameUtils"
import { useGameStore } from "../stores/gameStore"

interface PlayerProps {
  name: string
  skinId: number
  size: number
  speed: number
  onCollectFood: (id: string) => void
  onCollectPowerUp: (id: string) => void
  onEatPlayer: (id: string) => void
  foods: FoodItem[]
  powerUps: PowerUpItem[]
  enemies: PlayerType[]
  onGameOver: () => void
  onUpdatePosition: (position: [number, number, number]) => void
  isMultiplayer: boolean
}

export const Player = forwardRef<Mesh, PlayerProps>(function Player(
  {
    name,
    skinId,
    size,
    speed,
    onCollectFood,
    onCollectPowerUp,
    onEatPlayer,
    foods,
    powerUps,
    enemies,
    onGameOver,
    onUpdatePosition,
    isMultiplayer,
  },
  ref,
) {
  const { viewport } = useThree()
  const isMobile = useMobile()
  const velocity = useRef(new Vector3())
  const sphereRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [joystickAngle, setJoystickAngle] = useState(0)
  const [joystickStrength, setJoystickStrength] = useState(0)
  const lastUpdateTime = useRef(0)

  const { activePowerUps } = useGameStore()

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          velocity.current.z = -speed
          break
        case "ArrowDown":
        case "s":
          velocity.current.z = speed
          break
        case "ArrowLeft":
        case "a":
          velocity.current.x = -speed
          break
        case "ArrowRight":
        case "d":
          velocity.current.x = speed
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "ArrowDown":
        case "s":
          velocity.current.z = 0
          break
        case "ArrowLeft":
        case "a":
        case "ArrowRight":
        case "d":
          velocity.current.x = 0
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [speed])

  // Handle touch controls for mobile
  useEffect(() => {
    if (!isMobile) return

    const handleTouchStart = (e: TouchEvent) => {
      setJoystickActive(true)
      const touch = e.touches[0]
      setJoystickPosition({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!joystickActive) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - joystickPosition.x
      const deltaY = touch.clientY - joystickPosition.y

      // Calculate angle and strength
      const angle = Math.atan2(deltaY, deltaX)
      const strength = Math.min(1, Math.sqrt(deltaX ** 2 + deltaY ** 2) / 50)

      setJoystickAngle(angle)
      setJoystickStrength(strength)

      // Update velocity based on joystick
      velocity.current.x = Math.cos(angle) * strength * speed
      velocity.current.z = Math.sin(angle) * strength * speed
    }

    const handleTouchEnd = () => {
      setJoystickActive(false)
      velocity.current.set(0, 0, 0)
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchmove", handleTouchMove)
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isMobile, joystickActive, joystickPosition, speed])

  // Apply power-up effects
  useEffect(() => {
    if (materialRef.current) {
      // Reset material effects
      materialRef.current.emissive.set(0, 0, 0)
      materialRef.current.emissiveIntensity = 0

      // Apply shield effect
      if (activePowerUps.includes("shield")) {
        materialRef.current.emissive.set(0, 0.5, 1)
        materialRef.current.emissiveIntensity = 0.5
      }
    }
  }, [activePowerUps])

  // Fix player ability to eat bots and improve camera controls

  // Update the useFrame function to properly handle eating other players
  useFrame((_, delta) => {
    if (!ref || !("current" in ref) || !ref.current) return

    // Update position
    ref.current.position.x += velocity.current.x
    ref.current.position.z += velocity.current.z

    // Keep player within bounds
    const bounds = 95
    ref.current.position.x = Math.max(-bounds, Math.min(bounds, ref.current.position.x))
    ref.current.position.z = Math.max(-bounds, Math.min(bounds, ref.current.position.z))

    // Check food collisions
    foods.forEach((food) => {
      const foodPos = new Vector3(food.position[0] || 0, food.position[1] || 0, food.position[2] || 0)

      // Increase collection radius if magnet power-up is active
      const collectionRadius = activePowerUps.includes("magnet") ? size * 0.5 + 3 : size * 0.5

      if (checkCollision(ref.current.position, foodPos, collectionRadius, 0.2)) {
        onCollectFood(food.id)
      }
    })

    // Check power-up collisions
    powerUps.forEach((powerUp) => {
      const powerUpPos = new Vector3(powerUp.position[0] || 0, powerUp.position[1] || 0, powerUp.position[2] || 0)

      if (checkCollision(ref.current.position, powerUpPos, size * 0.5, 0.5)) {
        onCollectPowerUp(powerUp.id)
      }
    })

    // Check enemy collisions - FIXED EATING LOGIC
    enemies.forEach((enemy) => {
      const enemyPos = new Vector3(enemy.position[0] || 0, enemy.position[1] || 0, enemy.position[2] || 0)

      const enemySize = enemy.size || 1

      if (checkCollision(ref.current.position, enemyPos, size * 0.5, enemySize * 0.5)) {
        // If player has shield, they're protected from being eaten
        if (size < enemySize && !activePowerUps.includes("shield")) {
          onGameOver()
        } else if (size > enemySize * 1.1) {
          // Player can eat smaller enemies - FIXED THRESHOLD
          onEatPlayer(enemy.id)
        }
      }
    })

    // Send position updates to server at a reasonable rate (every 100ms)
    const now = Date.now()
    if (now - lastUpdateTime.current > 100) {
      lastUpdateTime.current = now
      onUpdatePosition([ref.current.position.x, ref.current.position.y, ref.current.position.z])
    }

    // Rotate the sphere for visual effect
    if (sphereRef.current) {
      if (velocity.current.length() > 0.01) {
        sphereRef.current.rotation.x += delta * velocity.current.z * 2
        sphereRef.current.rotation.z -= delta * velocity.current.x * 2
      }
    }
  })

  // Get the current skin
  const skin = skins[skinId] || skins[0]

  // Determine if we should show a trail based on speed power-up
  const showTrail = activePowerUps.includes("speed")

  // Update the return JSX to improve shadows
  return (
    <group ref={ref as any} position={[0, 0, 0]}>
      {/* Player trail when speed power-up is active */}
      {showTrail && (
        <Trail width={1} length={5} color={skin.color} attenuation={(t) => t * t}>
          <mesh position={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={skin.color} />
          </mesh>
        </Trail>
      )}

      {/* Player sphere with improved shadow */}
      <mesh ref={sphereRef} castShadow>
        <sphereGeometry args={[size * 0.5, 32, 32]} />
        <meshStandardMaterial ref={materialRef} color={skin.color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Add a shadow plane that follows the player */}
      <mesh position={[0, -size * 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <circleGeometry args={[size * 0.4, 32]} />
        <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
      </mesh>

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
      {isMobile && (
        <Html fullscreen>
          <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full border-2 border-white/30 bg-black/20 touch-none">
            {joystickActive && (
              <div
                className="absolute w-20 h-20 rounded-full bg-white/50"
                style={{
                  transform: `translate(${Math.cos(joystickAngle) * joystickStrength * 40}px, ${Math.sin(joystickAngle) * joystickStrength * 40}px)`,
                  left: "25%",
                  top: "25%",
                }}
              />
            )}
          </div>
        </Html>
      )}
    </group>
  )
})

