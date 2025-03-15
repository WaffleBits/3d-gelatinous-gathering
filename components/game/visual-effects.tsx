import { useRef, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { 
  EffectComposer, 
  Bloom, 
  Vignette, 
  ChromaticAberration 
} from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { useGameStore } from "@/lib/game-store"

// Optimized particle system for ambient floating particles
function ParticleSystem({ particleCount = 100 }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  // Create particles with random positions - optimized for performance
  const particles = useMemo(() => {
    const count = particleCount
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Position in a large cube
      positions[i3] = (Math.random() - 0.5) * 200
      positions[i3 + 1] = Math.random() * 20  // Height
      positions[i3 + 2] = (Math.random() - 0.5) * 200
      
      // Color - light blue / cyan
      colors[i3] = 0.5 + Math.random() * 0.5
      colors[i3 + 1] = 0.8 + Math.random() * 0.2
      colors[i3 + 2] = 1.0
      
      // Size
      sizes[i] = Math.random() * 0.5 + 0.1
    }
    
    return { positions, colors, sizes }
  }, [particleCount])
  
  // Optimize particle animation with frame skipping
  const frameCount = useRef(0)
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    frameCount.current++
    
    // Only update rotation every frame
    particlesRef.current.rotation.y += delta * 0.01
    
    // Only update particle positions every 3 frames
    if (frameCount.current % 3 !== 0) return
    
    // Process only a portion of particles each frame for better performance
    const startIndex = (frameCount.current % 3) * Math.floor(particles.positions.length / 9)
    const endIndex = Math.min(startIndex + Math.floor(particles.positions.length / 9), particles.positions.length)
    
    // Access geometry attributes
    const positionAttr = particlesRef.current.geometry.attributes.position
    const positionArray = positionAttr.array as Float32Array
    
    // Animate positions
    for (let i = startIndex; i < endIndex; i += 3) {
      // Simple sine wave animation
      positionArray[i + 1] += Math.sin(state.clock.elapsedTime * 0.1 + i) * delta * 0.1
      
      // Reset particles that go too high
      if (positionArray[i + 1] > 20) {
        positionArray[i + 1] = 0
      }
    }
    
    // Only mark as needing update when we've modified positions
    positionAttr.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Main visual effects component - optimized quality settings
export function VisualEffects({ quality = "medium" }: { quality?: "low" | "medium" | "high" }) {
  const { scene } = useThree()
  const { score } = useGameStore()
  const currentFogRef = useRef<THREE.Fog | null>(null)
  
  // Configure effect intensity based on quality settings
  const effectsConfig = useMemo(() => {
    switch (quality) {
      case "low":
        return {
          enabled: false,          // No post-processing at all
          bloomEnabled: false,
          bloomIntensity: 0,
          bloomRadius: 0,
          chromaticAberration: false,
          chromaticAberrationOffset: 0,
          vignette: false,
          fog: { enabled: false, density: 0, near: 0, far: 0 },
          particles: false,
          particleCount: 0
        }
      case "medium":
        return {
          enabled: true,
          bloomEnabled: true,
          bloomIntensity: 0.15,     // Lower intensity for better performance
          bloomRadius: 0.4,         // Lower radius for better performance
          bloomHeight: 160,         // Lower resolution for better performance
          chromaticAberration: false,
          chromaticAberrationOffset: 0,
          vignette: false,
          fog: { enabled: true, density: 0.002, near: 30, far: 100 },
          particles: true,
          particleCount: 75        // Reduced particle count
        }
      case "high":
        return {
          enabled: true,
          bloomEnabled: true,
          bloomIntensity: 0.25,
          bloomRadius: 0.6,
          bloomHeight: 240,
          chromaticAberration: true,
          chromaticAberrationOffset: 0.0002,
          vignette: true,
          fog: { enabled: true, density: 0.002, near: 20, far: 100 },
          particles: true,
          particleCount: 150
        }
      default: // fallback to medium
        return {
          enabled: true,
          bloomEnabled: true,
          bloomIntensity: 0.15,
          bloomRadius: 0.4,
          bloomHeight: 160,
          chromaticAberration: false,
          chromaticAberrationOffset: 0,
          vignette: false,
          fog: { enabled: true, density: 0.002, near: 30, far: 100 },
          particles: true,
          particleCount: 75
        }
    }
  }, [quality])

  // Adjust fog based on player size/score to prevent visibility issues
  useEffect(() => {
    if (!effectsConfig.fog.enabled || !currentFogRef.current) return
    
    // Calculate player size from score (same formula as in game-scene.tsx)
    const playerSize = 1 + score * 0.1
    
    // Increase fog distance as player grows to maintain visibility
    const baseFar = effectsConfig.fog.far || 100
    const baseNear = effectsConfig.fog.near || 30
    
    // Scale fog with player size - larger players see further
    const farDistance = baseFar + playerSize * 20
    const nearDistance = baseNear + playerSize * 5
    
    // Update fog settings dynamically
    currentFogRef.current.near = nearDistance
    currentFogRef.current.far = farDistance
    
    console.log(`Fog adjusted for player size ${playerSize.toFixed(1)}: near=${nearDistance.toFixed(1)}, far=${farDistance.toFixed(1)}`)
  }, [score, effectsConfig.fog.enabled, effectsConfig.fog.near, effectsConfig.fog.far])
  
  // Skip rendering everything if low quality
  if (quality === "low") {
    return null
  }
  
  return (
    <>
      {/* Fog */}
      {effectsConfig.fog.enabled ? (
        <fog 
          ref={currentFogRef}
          attach="fog" 
          color="#0a4d8c" 
          near={effectsConfig.fog.near} 
          far={effectsConfig.fog.far} 
          args={["#0a4d8c", effectsConfig.fog.near, effectsConfig.fog.far]} 
        />
      ) : null}
      
      {/* Ambient particles */}
      {effectsConfig.particles ? (
        <ParticleSystem particleCount={effectsConfig.particleCount} />
      ) : null}
      
      {/* Post-processing effects */}
      {effectsConfig.enabled && (
        <EffectComposer enabled={effectsConfig.enabled}>
          {effectsConfig.bloomEnabled ? (
            <Bloom
              intensity={effectsConfig.bloomIntensity}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              height={effectsConfig.bloomHeight}
              blendFunction={BlendFunction.SCREEN}
            />
          ) : null}
          {effectsConfig.chromaticAberration ? (
            <ChromaticAberration
              offset={new THREE.Vector2(effectsConfig.chromaticAberrationOffset, effectsConfig.chromaticAberrationOffset)}
              blendFunction={BlendFunction.NORMAL}
            />
          ) : null}
          {effectsConfig.vignette ? (
            <Vignette
              offset={0.3}
              darkness={0.7}
              blendFunction={BlendFunction.NORMAL}
            />
          ) : null}
        </EffectComposer>
      )}
    </>
  )
} 