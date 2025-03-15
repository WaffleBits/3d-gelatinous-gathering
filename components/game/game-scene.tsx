"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei"
import { Player } from "./player"
import { Food } from "./food"
import { Enemy } from "./enemy"
import { useGameStore } from "@/lib/game-store"
import { Vector3 } from "three"
import { useSocketConnection, joinGame, updatePlayerPosition, playerDied, PlayerData } from "@/lib/socket-client"
import { VisualEffects } from "./visual-effects"
import { PowerUp } from "./power-up"
import { PowerUpType, PowerUpDefinition, getRandomPowerUp, generatePowerUpPosition, powerUps } from "@/lib/power-ups"

interface GameSceneProps {
  playerName: string
  selectedSkin: number
  visualQuality?: "low" | "medium" | "high"
}

export function GameScene({ playerName, selectedSkin, visualQuality = "medium" }: GameSceneProps) {
  const { camera } = useThree()
  const playerRef = useRef<any>()
  const controlsRef = useRef<any>()
  const lastCameraUpdate = useRef(0)

  const { score, addScore, gameOver, setGameOver, activePowerUps, activatePowerUp, hasPowerUp, addCoins } = useGameStore()
  
  // Socket connection for multiplayer
  const { isConnected, players, socket } = useSocketConnection()
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerData[]>([])

  const [foods, setFoods] = useState<{ id: number; position: [number, number, number]; color: string }[]>([])
  const [enemies, setEnemies] = useState<
    {
      id: number
      position: [number, number, number]
      size: number
      color: string
      velocity?: [number, number, number]
      score?: number
    }[]
  >([])

  // Refs to track changes and avoid state updates during render
  const foodsRef = useRef(foods)
  const enemiesRef = useRef(enemies)
  const frameCount = useRef(0)
  const playerSize = useRef(1)
  const isMouseMoving = useRef(false)
  const mouseIdleTimer = useRef<NodeJS.Timeout | null>(null)
  
  // Performance optimization - separate timers for different systems
  const lastInputUpdate = useRef(0)
  const lastCollisionCheck = useRef(0)
  const lastAIUpdate = useRef(0)
  const lastServerUpdate = useRef(0)
  
  // Use requestAnimationFrame for timing
  const clock = useRef({
    delta: 0,
    elapsed: 0,
    prevTime: performance.now() / 1000
  })

  // Throttle function for rate limiting
  const throttle = (fn: Function, limit: number, ref: React.MutableRefObject<number>) => {
    const now = Date.now()
    if (now - ref.current >= limit) {
      fn()
      ref.current = now
    }
  }

  // Add state for power-ups
  const [powerUpsState, setPowerUps] = useState<{
    id: string;
    type: PowerUpType;
    position: [number, number, number];
    definition: PowerUpDefinition;
  }[]>([]);

  // Update refs when state changes
  useEffect(() => {
    foodsRef.current = foods
  }, [foods])

  useEffect(() => {
    enemiesRef.current = enemies
  }, [enemies])

  useEffect(() => {
    playerSize.current = 1 + score * 0.1
  }, [score])

  // Join the multiplayer game when the component mounts
  useEffect(() => {
    if (isConnected) {
      joinGame(playerName, selectedSkin)
      
      // Setup socket event handlers for multiplayer
      socket?.on("foods", (serverFoods) => {
        // Convert server foods to our food format
        const convertedFoods = serverFoods.map((food: any) => ({
          id: parseInt(food.id.split('-')[1]),
          position: food.position,
          color: food.color,
        }))
        setFoods(convertedFoods)
      })
      
      socket?.on("players", (serverPlayers: PlayerData[]) => {
        // Filter out the current player
        const filteredPlayers = serverPlayers.filter(
          (player) => player.id !== socket.id
        )
        setOnlinePlayers(filteredPlayers)
      })

      return () => {
        socket?.off("foods")
        socket?.off("players")
      }
    }
  }, [isConnected, playerName, selectedSkin, socket])

  // Initialize game elements - only create local foods if not connected to server
  useEffect(() => {
    if (!isConnected) {
      // Generate random food positions for offline play
      const newFoods = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50] as [number, number, number],
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      }))
      setFoods(newFoods)
    }

    // Generate random enemies (for both online and offline mode)
    const newEnemies = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50] as [number, number, number],
      velocity: [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05] as [number, number, number],
      size: Math.random() * 1.5 + 0.5,
      score: Math.floor(Math.random() * 20),
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }))
    setEnemies(newEnemies)

    // Set up mouse movement detection
    const handleMouseMove = () => {
      isMouseMoving.current = true

      // Clear any existing timer
      if (mouseIdleTimer.current) {
        clearTimeout(mouseIdleTimer.current)
      }

      // Set a new timer to mark mouse as idle after 1 second
      mouseIdleTimer.current = setTimeout(() => {
        isMouseMoving.current = false
      }, 1000)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (mouseIdleTimer.current) {
        clearTimeout(mouseIdleTimer.current)
      }
    }
  }, [isConnected])

  // Initialize power-ups
  useEffect(() => {
    // Generate initial power-ups
    const initialPowerUps = Array.from({ length: 5 }, (_, i) => {
      const powerUp = getRandomPowerUp();
      return {
        id: `powerup-${i}`,
        type: powerUp.id,
        position: generatePowerUpPosition(),
        definition: powerUp
      };
    });
    
    setPowerUps(initialPowerUps);
    
    // Set up interval to spawn new power-ups
    const spawnInterval = setInterval(() => {
      if (powerUpsState.length < 8) { // Limit max power-ups
        const powerUp = getRandomPowerUp();
        setPowerUps(prev => [
          ...prev,
          {
            id: `powerup-${Date.now()}`,
            type: powerUp.id,
            position: generatePowerUpPosition(),
            definition: powerUp
          }
        ]);
      }
    }, 15000); // Spawn a new power-up every 15 seconds
    
    return () => clearInterval(spawnInterval);
  }, []);

  // Handle food collection
  const collectFood = (foodId: number) => {
    console.log("Food collected:", foodId)

    // Update the server if connected
    if (isConnected && socket) {
      socket.emit("foodEaten", `food-${foodId}`)
    } else {
      // Offline mode - handle locally
      setTimeout(() => {
        setFoods((prev) => {
          const filtered = prev.filter((food) => food.id !== foodId)
          const newFood = {
            id: Date.now(),
            position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50] as [number, number, number],
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          }
          return [...filtered, newFood]
        })
      }, 0)
    }
    
    // Add score in both online and offline modes
    addScore(1)
  }

  // Handle player eating enemy
  const eatEnemy = (enemyId: number) => {
    console.log("Player eating enemy:", enemyId)
    const enemy = enemiesRef.current.find((e) => e.id === enemyId)
    if (!enemy) return

    // Add score based on enemy size
    const enemySize = enemy.size || 1
    addScore(Math.floor(enemySize * 5))

    // Update state outside of render cycle
    setTimeout(() => {
      setEnemies((prev) => prev.filter((e) => e.id !== enemyId))
    }, 0)

    // Spawn a new enemy after a delay
    setTimeout(() => {
      const newEnemy = {
        id: Date.now(),
        position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50] as [number, number, number],
        velocity: [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05] as [number, number, number],
        size: Math.random() * 1.5 + 0.5,
        score: Math.floor(Math.random() * 20),
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      }

      setEnemies((prev) => [...prev, newEnemy])
    }, 3000)
  }

  // Batch update for enemies to improve performance
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentEnemies = [...enemiesRef.current]
      let hasChanges = false

      // Process each enemy
      for (let i = 0; i < currentEnemies.length; i++) {
        const enemy = currentEnemies[i]
        if (!enemy.velocity) continue

        const enemySize = enemy.size || 1
        
        // Change direction randomly or if no food is nearby
        if (Math.random() < 0.005) {
          // Random movement
          enemy.velocity = [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05] as [number, number, number]
          hasChanges = true
        } else {
          // Try to find nearby food - bots should seek food actively
          let nearestFood: typeof foodsRef.current[0] | null = null
          let minDistance = Infinity

          // Find the nearest food
          for (const food of foodsRef.current) {
            const foodPos = new Vector3(...food.position)
            const enemyPos = new Vector3(...enemy.position)
            const distance = foodPos.distanceToSquared(enemyPos)
            
            if (distance < minDistance) {
              minDistance = distance
              nearestFood = food
            }
          }

          // If there's nearby food (within a certain range), move towards it
          if (nearestFood && minDistance < 100) { // 10 units squared
            const foodPos = new Vector3(...nearestFood.position)
            const enemyPos = new Vector3(...enemy.position)
            const direction = foodPos.sub(enemyPos).normalize()
            
            // Adjust speed based on size - larger bots move slower
            const botSpeed = 0.05 / (1 + enemySize * 0.05)
            
            enemy.velocity = [
              direction.x * botSpeed,
              0,
              direction.z * botSpeed
            ] as [number, number, number]
            
            hasChanges = true
          }
        }

        // Update position
        const newX = enemy.position[0] + enemy.velocity[0]
        const newZ = enemy.position[2] + enemy.velocity[2]

        // Keep within bounds
        const bounds = 95
        let vx = enemy.velocity[0]
        let vz = enemy.velocity[2]

        if (Math.abs(newX) > bounds) vx *= -1
        if (Math.abs(newZ) > bounds) vz *= -1

        const clampedX = Math.max(-bounds, Math.min(bounds, newX))
        const clampedZ = Math.max(-bounds, Math.min(bounds, newZ))

        // Check for food collisions with improved detection
        for (const food of foodsRef.current) {
          const enemyPos = new Vector3(clampedX, 0, clampedZ)
          const foodPos = new Vector3(...food.position)
          
          // Use squared distance for better performance
          const distanceSquared = foodPos.distanceToSquared(enemyPos)
          const collisionRadiusSquared = Math.pow((enemySize * 0.5) + 0.2, 2)

          if (distanceSquared < collisionRadiusSquared) {
            // Bot eats food
            console.log("Bot eating food:", food.id)

            // Update enemy size
            enemy.size = enemySize + 0.05
            enemy.score = (enemy.score || 0) + 1
            hasChanges = true

            // Schedule food collection outside of render cycle
            setTimeout(() => {
              collectFood(food.id)
            }, 0)
            break
          }
        }

        // Update enemy position
        if (
          clampedX !== enemy.position[0] ||
          clampedZ !== enemy.position[2] ||
          vx !== enemy.velocity[0] ||
          vz !== enemy.velocity[2]
        ) {
          enemy.position = [clampedX, 0, clampedZ] as [number, number, number]
          enemy.velocity = [vx, 0, vz] as [number, number, number]
          hasChanges = true
        }
      }

      // Only update state if needed
      if (hasChanges) {
        setEnemies([...currentEnemies])
      }
    }, 50) // Update every 50ms instead of 100ms for more responsive bots

    return () => clearInterval(updateInterval)
  }, [])

  // Update camera to follow player - using a completely static approach with proper zoom
  useFrame((state) => {
    // Update clock for frame-independent timing
    const time = performance.now() / 1000
    clock.current.delta = time - clock.current.prevTime
    clock.current.elapsed += clock.current.delta
    clock.current.prevTime = time
    
    if (!playerRef.current || !controlsRef.current) return
    
    // Throttled camera updates - only update every 50ms
    throttle(() => {
      const playerPosition = playerRef.current.position
      
      // Calculate zoom based on player size
      const zoomFactor = 15 + playerSize.current * 1.5 
      const distance = 10 + playerSize.current * 0.8
      
      // Set camera target directly for static feel
      controlsRef.current.target.set(
        playerPosition.x, 
        0, 
        playerPosition.z
      )
      
      // Very minimal smoothing for zoom only
      const currentHeight = camera.position.y
      const targetHeight = zoomFactor
      const smoothedHeight = currentHeight + (targetHeight - currentHeight) * 0.3
      
      // Set camera position directly for static feel
      camera.position.set(
        playerPosition.x,
        smoothedHeight, 
        playerPosition.z + distance
      )
    }, 50, lastCameraUpdate)
    
    // Only run AI updates every 80ms
    throttle(() => {
      // Update AI logic for enemies
      updateEnemyAI()
    }, 80, lastAIUpdate)
    
    // Only check collisions every 60ms
    throttle(() => {
      // Check for collisions between player and food/enemies/power-ups
      if (playerRef.current) {
        checkCollisions()
      }
    }, 60, lastCollisionCheck)
    
    // Only update server less frequently
    throttle(() => {
      // Update server with player position
      if (isConnected && playerRef.current) {
        const position = [
          playerRef.current.position.x,
          playerRef.current.position.y,
          playerRef.current.position.z,
        ] as [number, number, number]
        
        updatePlayerPosition(position, playerSize.current, score)
      }
    }, 100, lastServerUpdate)
    
    // Frame counter for debugging
    frameCount.current++
    if (frameCount.current % 100 === 0) {
      console.log(`FPS: ${Math.round(1 / clock.current.delta)}`)
    }
  })

  // Separate function for checking collisions
  const checkCollisions = () => {
    if (!playerRef.current) return
    
    const playerPos = playerRef.current.position.clone()
    const collisionRadius = playerSize.current * 0.5 + 0.2
    const checkRadius = collisionRadius * 3
    
    // Optimize food collision checks with spatial partitioning
    for (let i = 0; i < foodsRef.current.length; i++) {
      const food = foodsRef.current[i]
      const foodPos = new Vector3(...food.position)
      
      // Quick distance check first (x/z only for speed)
      const dx = Math.abs(foodPos.x - playerPos.x)
      const dz = Math.abs(foodPos.z - playerPos.z)
      
      // Skip detailed collision check if clearly out of range
      if (dx > checkRadius || dz > checkRadius) continue
      
      // Full distance check only for nearby items
      const distanceSquared = foodPos.distanceToSquared(playerPos)
      const collisionRadiusSquared = Math.pow(collisionRadius, 2)

      if (distanceSquared < collisionRadiusSquared) {
        collectFood(food.id)
      }
    }
    
    // Optimize enemy collision detection with the same approach
    for (let i = 0; i < enemiesRef.current.length; i++) {
      const enemy = enemiesRef.current[i]
      const enemyPos = new Vector3(...enemy.position)
      
      // Quick distance check
      const dx = Math.abs(enemyPos.x - playerPos.x)
      const dz = Math.abs(enemyPos.z - playerPos.z)
      const enemyRadius = enemy.size * 0.5
      const checkRange = collisionRadius + enemyRadius
      
      if (dx > checkRange || dz > checkRange) continue
      
      // Full distance check only for nearby enemies
      const distanceSquared = enemyPos.distanceToSquared(playerPos)
      const collisionThresholdSquared = Math.pow(collisionRadius + enemyRadius, 2)

      if (distanceSquared < collisionThresholdSquared) {
        // If player is bigger, eat the enemy
        if (playerSize.current > enemy.size * 1.1) {
          eatEnemy(enemy.id)
        } 
        // If enemy is bigger, game over
        else if (enemy.size > playerSize.current * 1.1) {
          // Check for power-ups that might protect the player
          if (!hasPowerUp('shield') && !hasPowerUp('ghost')) {
            setGameOver(true)
          }
        }
      }
    }
    
    // Check power-up collisions
    for (let i = 0; i < powerUpsState.length; i++) {
      const powerUp = powerUpsState[i]
      const [x, y, z] = powerUp.position
      const powerUpPos = new Vector3(x, y, z)
      
      // Quick distance check
      const dx = Math.abs(powerUpPos.x - playerPos.x)
      const dz = Math.abs(powerUpPos.z - playerPos.z)
      
      if (dx > checkRadius || dz > checkRadius) continue
      
      // Full distance check
      const distance = powerUpPos.distanceTo(playerPos)
      
      if (distance < collisionRadius + 0.5) {
        collectPowerUp(powerUp.id, powerUp.type)
      }
    }
  }
  
  // Separate function for enemy AI update
  const updateEnemyAI = () => {
    const currentEnemies = [...enemiesRef.current]
    let hasChanges = false

    // Process each enemy
    for (let i = 0; i < currentEnemies.length; i++) {
      const enemy = currentEnemies[i]
      if (!enemy.velocity) continue

      const enemySize = enemy.size || 1
      
      // Change direction randomly or if no food is nearby
      if (Math.random() < 0.01) {
        // Random movement
        enemy.velocity = [(Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05] as [number, number, number]
        hasChanges = true
      } else {
        // Try to find nearby food - bots should seek food actively
        let nearestFood: typeof foodsRef.current[0] | null = null
        let minDistance = Infinity

        // Only check a subset of foods for performance
        const foodsToCheck = foodsRef.current.slice(0, 20)
        
        // Find the nearest food
        for (const food of foodsToCheck) {
          const foodPos = new Vector3(...food.position)
          const enemyPos = new Vector3(...enemy.position)
          const distance = foodPos.distanceToSquared(enemyPos)
          
          if (distance < minDistance) {
            minDistance = distance
            nearestFood = food
          }
        }

        // If there's nearby food (within a certain range), move towards it
        if (nearestFood && minDistance < 100) { // 10 units squared
          const foodPos = new Vector3(...nearestFood.position)
          const enemyPos = new Vector3(...enemy.position)
          const direction = foodPos.sub(enemyPos).normalize()
          
          // Adjust speed based on size - larger bots move slower
          const botSpeed = 0.05 / (1 + enemySize * 0.05)
          
          enemy.velocity = [
            direction.x * botSpeed,
            0,
            direction.z * botSpeed
          ] as [number, number, number]
          
          hasChanges = true
        }
      }

      // Update position
      const newX = enemy.position[0] + enemy.velocity[0]
      const newZ = enemy.position[2] + enemy.velocity[2]

      // Keep within bounds
      const bounds = 95
      let vx = enemy.velocity[0]
      let vz = enemy.velocity[2]

      if (Math.abs(newX) > bounds) vx *= -1
      if (Math.abs(newZ) > bounds) vz *= -1

      const clampedX = Math.max(-bounds, Math.min(bounds, newX))
      const clampedZ = Math.max(-bounds, Math.min(bounds, newZ))

      // Update enemy position
      if (
        clampedX !== enemy.position[0] ||
        clampedZ !== enemy.position[2] ||
        vx !== enemy.velocity[0] ||
        vz !== enemy.velocity[2]
      ) {
        enemy.position = [clampedX, 0, clampedZ] as [number, number, number]
        enemy.velocity = [vx, 0, vz] as [number, number, number]
        hasChanges = true
      }
    }

    // Only update state if needed
    if (hasChanges) {
      setEnemies([...currentEnemies])
    }
  }

  // Handle game over
  useEffect(() => {
    if (gameOver && isConnected) {
      playerDied()
    }
  }, [gameOver, isConnected])

  // Handle power-up collection
  const collectPowerUp = (id: string, type: PowerUpType) => {
    console.log(`Power-up collected: ${id}, type: ${type}`);
    
    // Remove the power-up from the scene
    setPowerUps(prev => prev.filter(p => p.id !== id));
    
    // Activate the power-up effect
    const definition = powerUps[type];
    activatePowerUp(type, definition.duration);
    
    // Add coins as a bonus
    addCoins(10);
  };
  
  // Check for power-up collisions
  useEffect(() => {
    if (!playerRef.current) return;
    
    const checkCollisionInterval = setInterval(() => {
      if (!playerRef.current) return;
      
      const playerPos = playerRef.current.position;
      const playerSize = 1 + score * 0.1;
      
      // Check each power-up
      powerUpsState.forEach(powerUp => {
        const [x, y, z] = powerUp.position;
        const distance = Math.sqrt(
          Math.pow(playerPos.x - x, 2) + 
          Math.pow(playerPos.z - z, 2)
        );
        
        // If player is close enough, collect the power-up
        if (distance < playerSize * 0.5 + 0.5) {
          collectPowerUp(powerUp.id, powerUp.type);
        }
      });
    }, 100);
    
    return () => clearInterval(checkCollisionInterval);
  }, [powerUpsState, score]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 10]} />
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        target={[0, 0, 0]}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 6}
      />

      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 30, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} // Reduced from 4096 for better performance
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
      />

      <Environment preset="sunset" />

      {/* Visual Effects */}
      <VisualEffects quality={visualQuality} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#1a3c6e" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Grid for reference */}
      <gridHelper 
        args={[200, 40]} 
        position={[0, 0.01, 0]} 
      />

      {/* Player */}
      <Player
        ref={playerRef}
        name={playerName}
        skinId={selectedSkin}
        size={playerSize.current}
        onCollectFood={collectFood}
        onEatEnemy={eatEnemy}
        foods={foods}
        enemies={enemies}
        onGameOver={() => setGameOver(true)}
      />

      {/* Use instanced rendering for food items if there are many */}
      {foods.map((food) => (
        <Food key={food.id} id={food.id} position={food.position} color={food.color} />
      ))}

      {/* Enemy players */}
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          id={enemy.id}
          position={enemy.position}
          size={enemy.size}
          color={enemy.color}
          score={enemy.score || 0}
        />
      ))}

      {/* Online Players */}
      {onlinePlayers.map((player) => (
        <group key={player.id} position={player.position}>
          <mesh castShadow>
            <sphereGeometry args={[player.size * 0.5, 16, 16]} /> {/* Reduced from 32 segments */}
            <meshStandardMaterial color={player.color} />
          </mesh>
          <mesh position={[0, -player.size * 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[player.size * 0.4, 16]} /> {/* Reduced from 32 segments */}
            <meshBasicMaterial color="black" transparent={true} opacity={0.3} />
          </mesh>
          <Text
            position={[0, player.size * 0.5 + 0.5, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {player.name || `Player ${player.id.substring(0, 5)}`}
          </Text>
        </group>
      ))}

      {/* Power-ups */}
      {powerUpsState.map(powerUp => (
        <PowerUp
          key={powerUp.id}
          id={powerUp.id}
          type={powerUp.type}
          position={powerUp.position}
          onCollect={collectPowerUp}
          definition={powerUp.definition}
        />
      ))}
    </>
  )
}

