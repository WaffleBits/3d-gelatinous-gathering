"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls, PerspectiveCamera, useTexture } from "@react-three/drei"
import { useGameStore } from "../stores/gameStore"
import { Player } from "./Player"
import { Food } from "./Food"
import { Enemy } from "./Enemy"
import { PowerUp } from "./PowerUp"
import type { Socket } from "socket.io-client"
import { Vector3 } from "three"
import { generateRandomPosition, checkCollision } from "../utils/gameUtils"
import type { FoodItem } from "../types/Food"
import type { Player as PlayerType } from "../types/Player"
import type { PowerUpType, PowerUpItem } from "../types/PowerUp"

interface SceneProps {
  multiplayer: boolean
  socket: Socket | null
}

export default function Scene({ multiplayer, socket }: SceneProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>()
  const playerRef = useRef<any>()
  const gridTexture = useTexture("/textures/grid.png")

  const {
    playerId,
    playerName,
    selectedSkin,
    score,
    addScore,
    setGameOver,
    players,
    setPlayers,
    updateLocalPlayer,
    addCoins,
    activatePowerUp,
    playerSize,
    playerSpeed,
  } = useGameStore()

  const [foods, setFoods] = useState<FoodItem[]>([])
  const [enemies, setEnemies] = useState<PlayerType[]>([])
  const [powerUps, setPowerUps] = useState<PowerUpItem[]>([])
  const [worldTheme, setWorldTheme] = useState<string>("default")

  // Initialize game elements
  useEffect(() => {
    // Set random world theme
    const themes = ["default", "sunset", "night", "underwater", "space"]
    setWorldTheme(themes[Math.floor(Math.random() * themes.length)])

    if (!multiplayer) {
      // Generate random food positions for single player mode
      const newFoods = Array.from({ length: 200 }, (_, i) => ({
        id: i.toString(),
        position: generateRandomPosition(100),
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        value: Math.random() > 0.8 ? 2 : 1,
      }))

      // Generate random enemies for single player mode
      const newEnemies = Array.from({ length: 15 }, (_, i) => ({
        id: `bot-${i}`,
        name: `Bot ${i + 1}`,
        position: generateRandomPosition(100),
        velocity: [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05],
        size: Math.random() * 1.5 + 0.5,
        score: Math.floor(Math.random() * 20),
        skin: Math.floor(Math.random() * 5),
        isBot: true,
      }))

      // Generate random power-ups
      const newPowerUps = Array.from({ length: 5 }, (_, i) => {
        const types: PowerUpType[] = ["speed", "size", "magnet", "shield", "coin"]
        return {
          id: `powerup-${i}`,
          position: generateRandomPosition(100),
          type: types[Math.floor(Math.random() * types.length)],
          duration: 10000, // 10 seconds
        }
      })

      setFoods(newFoods)
      setEnemies(newEnemies)
      setPowerUps(newPowerUps)
    } else if (socket) {
      // Request initial game state from server
      socket.emit("requestGameState")

      // Listen for food updates from server
      socket.on("foodUpdate", (serverFoods: FoodItem[]) => {
        setFoods(serverFoods)
      })

      // Listen for power-up updates from server
      socket.on("powerUpUpdate", (serverPowerUps: PowerUpItem[]) => {
        setPowerUps(serverPowerUps)
      })

      // Join the game with player info
      socket.emit("joinGame", {
        name: playerName,
        skin: selectedSkin,
      })
    }

    return () => {
      if (socket) {
        socket.off("foodUpdate")
        socket.off("powerUpUpdate")
      }
    }
  }, [multiplayer, socket, playerName, selectedSkin])

  // Handle food collection in single player mode
  const collectFood = (foodId: string) => {
    if (!multiplayer) {
      const food = foods.find((f) => f.id === foodId)
      if (food) {
        setFoods(foods.filter((f) => f.id !== foodId))
        addScore(food.value || 1)

        // Spawn new food
        const newFood = {
          id: `food-${Date.now()}-${Math.random()}`,
          position: generateRandomPosition(100),
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          value: Math.random() > 0.8 ? 2 : 1,
        }

        setFoods((prev) => [...prev, newFood])
      }
    } else if (socket) {
      // In multiplayer, tell the server we collected food
      socket.emit("collectFood", foodId)
    }
  }

  // Handle power-up collection
  const collectPowerUp = (powerUpId: string) => {
    if (!multiplayer) {
      const powerUp = powerUps.find((p) => p.id === powerUpId)
      if (powerUp) {
        setPowerUps(powerUps.filter((p) => p.id !== powerUpId))

        // Apply power-up effect
        if (powerUp.type === "coin") {
          // Add coins instead of activating
          addCoins(Math.floor(Math.random() * 20) + 10)
        } else {
          activatePowerUp(powerUp.type, powerUp.duration)
        }

        // Spawn new power-up after a delay
        setTimeout(() => {
          const types: PowerUpType[] = ["speed", "size", "magnet", "shield", "coin"]
          const newPowerUp = {
            id: `powerup-${Date.now()}-${Math.random()}`,
            position: generateRandomPosition(100),
            type: types[Math.floor(Math.random() * types.length)],
            duration: 10000, // 10 seconds
          }

          setPowerUps((prev) => [...prev, newPowerUp])
        }, 30000) // Respawn after 30 seconds
      }
    } else if (socket) {
      // In multiplayer, tell the server we collected a power-up
      socket.emit("collectPowerUp", powerUpId)
    }
  }

  // Handle eating other players
  const eatPlayer = (playerId: string) => {
    if (!multiplayer) {
      const enemy = enemies.find((e) => e.id === playerId)
      if (enemy) {
        // Add score based on enemy size
        addScore(Math.floor((enemy.size || 1) * 5))

        // Add coins
        addCoins(Math.floor((enemy.size || 1) * 2))

        // Remove the eaten enemy
        setEnemies(enemies.filter((e) => e.id !== playerId))

        // Spawn a new enemy after a delay
        setTimeout(() => {
          const newEnemy = {
            id: `bot-${Date.now()}-${Math.random()}`,
            name: `Bot ${Math.floor(Math.random() * 100)}`,
            position: generateRandomPosition(100),
            velocity: [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05],
            size: Math.random() * 1.5 + 0.5,
            score: Math.floor(Math.random() * 20),
            skin: Math.floor(Math.random() * 5),
            isBot: true,
          }

          setEnemies((prev) => [...prev, newEnemy])
        }, 5000) // Respawn after 5 seconds
      }
    } else if (socket) {
      // In multiplayer, tell the server we ate a player
      socket.emit("eatPlayer", playerId)
    }
  }

  // Update AI enemies in single player mode
  useFrame((_, delta) => {
    if (!multiplayer) {
      setEnemies((prevEnemies) =>
        prevEnemies
          .map((enemy) => {
            if (!enemy.isBot) return enemy

            // Change direction randomly
            if (Math.random() < 0.01) {
              return {
                ...enemy,
                velocity: [
                  ((Math.random() - 0.5) * 0.05) / (enemy.size || 1),
                  0,
                  ((Math.random() - 0.5) * 0.05) / (enemy.size || 1),
                ],
              }
            }

            // Update position
            const newX = (enemy.position[0] || 0) + (enemy.velocity[0] || 0)
            const newZ = (enemy.position[2] || 0) + (enemy.velocity[2] || 0)

            // Keep within bounds
            const bounds = 95
            let vx = enemy.velocity[0] || 0
            let vz = enemy.velocity[2] || 0

            if (Math.abs(newX) > bounds) vx *= -1
            if (Math.abs(newZ) > bounds) vz *= -1

            const clampedX = Math.max(-bounds, Math.min(bounds, newX))
            const clampedZ = Math.max(-bounds, Math.min(bounds, newZ))

            // Check for food collisions - IMPROVED BOT FOOD DETECTION
            const enemyPos = new Vector3(clampedX, 0, clampedZ)
            let hasEatenFood = false

            foods.forEach((food) => {
              const foodPos = new Vector3(food.position[0] || 0, food.position[1] || 0, food.position[2] || 0)

              if (checkCollision(enemyPos, foodPos, (enemy.size || 1) * 0.5, 0.2)) {
                // Remove the food and add a new one
                setFoods((currentFoods) => {
                  const newFoods = currentFoods.filter((f) => f.id !== food.id)
                  newFoods.push({
                    id: `food-${Date.now()}-${Math.random()}`,
                    position: generateRandomPosition(100),
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    value: Math.random() > 0.8 ? 2 : 1,
                  })
                  return newFoods
                })

                // Grow the enemy
                hasEatenFood = true
              }
            })

            // Check for player collisions with other bots
            let hasEatenBot = false
            let growthAmount = 0

            prevEnemies.forEach((otherEnemy) => {
              if (enemy.id === otherEnemy.id) return

              const otherPos = new Vector3(
                otherEnemy.position[0] || 0,
                otherEnemy.position[1] || 0,
                otherEnemy.position[2] || 0,
              )

              if (checkCollision(enemyPos, otherPos, (enemy.size || 1) * 0.5, (otherEnemy.size || 1) * 0.5)) {
                // If this enemy is bigger, it can eat the other
                if ((enemy.size || 1) > (otherEnemy.size || 1) * 1.1) {
                  hasEatenBot = true
                  growthAmount += (otherEnemy.size || 1) * 0.3
                }
              }
            })

            // Apply growth from eating food and other bots
            return {
              ...enemy,
              position: [clampedX, 0, clampedZ],
              velocity: [vx, 0, vz],
              size: hasEatenFood
                ? (enemy.size || 1) + 0.05
                : hasEatenBot
                  ? (enemy.size || 1) + growthAmount
                  : enemy.size || 1,
              score: hasEatenFood
                ? (enemy.score || 0) + 1
                : hasEatenBot
                  ? (enemy.score || 0) + Math.floor(growthAmount * 10)
                  : enemy.score || 0,
            }
          })
          .filter((enemy) => {
            // Remove enemies that have been eaten by other enemies
            const hasBeenEaten = prevEnemies.some(
              (predator) =>
                predator.id !== enemy.id &&
                (predator.size || 1) > (enemy.size || 1) * 1.1 &&
                checkCollision(
                  new Vector3(predator.position[0] || 0, 0, predator.position[2] || 0),
                  new Vector3(enemy.position[0] || 0, 0, enemy.position[2] || 0),
                  (predator.size || 1) * 0.5,
                  (enemy.size || 1) * 0.5,
                ),
            )

            return !hasBeenEaten
          }),
      )
    }
  })

  // Update camera to follow player
  useFrame(() => {
    if (playerRef.current && controlsRef.current) {
      const playerPosition = playerRef.current.position

      // Update camera target to follow player
      controlsRef.current.target.set(playerPosition.x, 0, playerPosition.z)

      // Move camera above player
      camera.position.set(
        playerPosition.x,
        15 + playerSize * 0.5, // Camera height increases with player size
        playerPosition.z + 10,
      )
    }
  })

  // Update player position on server in multiplayer mode
  const updatePlayerPosition = (position: [number, number, number]) => {
    if (multiplayer && socket) {
      socket.emit("updatePosition", {
        position,
        score,
      })
    }

    // Update local player state
    updateLocalPlayer({
      position,
      score,
    })
  }

  // Get environment settings based on world theme
  const getEnvironmentSettings = () => {
    switch (worldTheme) {
      case "sunset":
        return {
          preset: "sunset",
          groundColor: "#ff9e7d",
          fogColor: "#ff7d50",
          groundTexture: "/textures/sand.jpg",
          ambientLight: 0.7,
          directionalLight: 1.2,
        }
      case "night":
        return {
          preset: "night",
          groundColor: "#1a1a2e",
          fogColor: "#0f0f1a",
          groundTexture: "/textures/grass_night.jpg",
          ambientLight: 0.3,
          directionalLight: 0.8,
        }
      case "underwater":
        return {
          preset: "dawn",
          groundColor: "#0077be",
          fogColor: "#00a9ff",
          groundTexture: "/textures/underwater.jpg",
          ambientLight: 0.6,
          directionalLight: 0.9,
        }
      case "space":
        return {
          preset: "night",
          groundColor: "#000000",
          fogColor: "#0a0a2a",
          groundTexture: "/textures/space.jpg",
          ambientLight: 0.4,
          directionalLight: 0.7,
        }
      default:
        return {
          preset: "dawn",
          groundColor: "#4a7349",
          fogColor: "#a8d8a5",
          groundTexture: "/textures/grass.jpg",
          ambientLight: 0.6,
          directionalLight: 1.0,
        }
    }
  }

  const env = getEnvironmentSettings()

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 10]} />
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, 0]}
        mouseButtons={{
          LEFT: 2, // Set to ROTATE
          MIDDLE: 1, // Set to DOLLY
          RIGHT: 0, // Set to PAN
        }}
      />

      <fog attach="fog" args={[env.fogColor, 10, 150]} />

      <ambientLight intensity={env.ambientLight} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={env.directionalLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Environment preset={env.preset as any} />

      {/* Ground plane with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={env.groundColor}
          map={useTexture(env.groundTexture)}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Add decorative elements based on theme */}
      {worldTheme === "underwater" && (
        <>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh
              key={`coral-${i}`}
              position={[Math.random() * 180 - 90, Math.random() * 2, Math.random() * 180 - 90]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              <coneGeometry args={[0.5, 2, 8]} />
              <meshStandardMaterial color={`hsl(${Math.random() * 60 + 300}, 70%, 60%)`} />
            </mesh>
          ))}
        </>
      )}

      {worldTheme === "space" && (
        <>
          {Array.from({ length: 50 }).map((_, i) => (
            <mesh
              key={`star-${i}`}
              position={[Math.random() * 180 - 90, Math.random() * 50 + 10, Math.random() * 180 - 90]}
            >
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          ))}
        </>
      )}

      {/* Player */}
      <Player
        ref={playerRef}
        name={playerName}
        skinId={selectedSkin}
        size={playerSize}
        speed={playerSpeed}
        onCollectFood={collectFood}
        onCollectPowerUp={collectPowerUp}
        onEatPlayer={eatPlayer}
        foods={foods}
        powerUps={powerUps}
        enemies={multiplayer ? players.filter((p) => p.id !== playerId) : enemies}
        onGameOver={() => setGameOver(true)}
        onUpdatePosition={updatePlayerPosition}
        isMultiplayer={multiplayer}
      />

      {/* Food items */}
      {foods.map((food) => (
        <Food key={food.id} id={food.id} position={food.position} color={food.color} value={food.value || 1} />
      ))}

      {/* Power-ups */}
      {powerUps.map((powerUp) => (
        <PowerUp key={powerUp.id} id={powerUp.id} position={powerUp.position} type={powerUp.type} />
      ))}

      {/* Other players/enemies */}
      {(multiplayer ? players.filter((p) => p.id !== playerId) : enemies).map((enemy) => (
        <Enemy
          key={enemy.id}
          id={enemy.id}
          name={enemy.name || `Player ${enemy.id}`}
          position={enemy.position}
          size={enemy.size || 1}
          score={enemy.score || 0}
          skinId={enemy.skin || 0}
        />
      ))}
    </>
  )
}

