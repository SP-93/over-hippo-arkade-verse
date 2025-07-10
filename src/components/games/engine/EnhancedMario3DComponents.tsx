import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// Enhanced Enemy Component with detailed 3D design
export const EnhancedEnemy3D = ({ 
  position, 
  color = "#8B4513", 
  size = 0.8, 
  type = "goomba",
  behavior = "patrol",
  speed = 1
}: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      switch (behavior) {
        case "patrol":
          meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 3;
          // Subtle bouncing animation
          meshRef.current.position.y = position[1] + Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 0.1;
          break;
        case "circle":
          meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed) * 2;
          meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * speed) * 2;
          break;
      }
      
      // Animated eyes looking around
      if (eyesRef.current) {
        eyesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.3;
      }
    }
  });

  if (type === "goomba") {
    return (
      <group ref={meshRef}>
        {/* Goomba body - mushroom-like */}
        <Sphere position={[0, 0, 0]} args={[size * 0.6, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial 
            color={color}
            metalness={0}
            roughness={0.8}
          />
        </Sphere>
        
        {/* Goomba cap */}
        <Cylinder 
          position={[0, size * 0.4, 0]} 
          args={[size * 0.7, size * 0.3, size * 0.3, 16]} 
          castShadow
        >
          <meshStandardMaterial 
            color="#654321"
            metalness={0.1}
            roughness={0.7}
          />
        </Cylinder>
        
        {/* Eyes */}
        <group ref={eyesRef}>
          <Sphere position={[-size * 0.2, size * 0.1, size * 0.4]} args={[size * 0.1, 8, 8]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Sphere>
          <Sphere position={[size * 0.2, size * 0.1, size * 0.4]} args={[size * 0.1, 8, 8]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Sphere>
        </group>
        
        {/* Angry eyebrows */}
        <mesh position={[0, size * 0.2, size * 0.5]} castShadow>
          <boxGeometry args={[size * 0.6, size * 0.05, size * 0.05]} />
          <meshStandardMaterial color="#8B0000" />
        </mesh>
        
        {/* Feet */}
        <Cylinder 
          position={[-size * 0.3, -size * 0.5, 0]} 
          args={[size * 0.15, size * 0.15, size * 0.2, 8]} 
          castShadow
        >
          <meshStandardMaterial color="#654321" />
        </Cylinder>
        <Cylinder 
          position={[size * 0.3, -size * 0.5, 0]} 
          args={[size * 0.15, size * 0.15, size * 0.2, 8]} 
          castShadow
        >
          <meshStandardMaterial color="#654321" />
        </Cylinder>
      </group>
    );
  }
  
  // Koopa Troopa
  return (
    <group ref={meshRef}>
      {/* Shell */}
      <Sphere position={[0, 0, 0]} args={[size * 0.7, 16, 16]} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#32CD32"
          metalness={0.3}
          roughness={0.4}
        />
      </Sphere>
      
      {/* Shell pattern */}
      <Sphere position={[0, 0, 0]} args={[size * 0.72, 16, 16]}>
        <meshStandardMaterial 
          color="#228B22"
          transparent
          opacity={0.8}
        />
      </Sphere>
      
      {/* Head */}
      <Sphere position={[0, size * 0.8, 0]} args={[size * 0.4, 12, 12]} castShadow>
        <meshStandardMaterial 
          color="#90EE90"
          metalness={0}
          roughness={0.6}
        />
      </Sphere>
      
      {/* Eyes */}
      <group ref={eyesRef}>
        <Sphere position={[-size * 0.15, size * 0.85, size * 0.3]} args={[size * 0.08, 8, 8]} castShadow>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere position={[size * 0.15, size * 0.85, size * 0.3]} args={[size * 0.08, 8, 8]} castShadow>
          <meshStandardMaterial color="#000000" />
        </Sphere>
      </group>
      
      {/* Beak */}
      <mesh position={[0, size * 0.75, size * 0.35]} castShadow>
        <coneGeometry args={[size * 0.08, size * 0.15, 6]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      
      {/* Arms */}
      <Cylinder 
        position={[-size * 0.6, size * 0.3, 0]} 
        args={[size * 0.1, size * 0.1, size * 0.4, 8]} 
        castShadow
      >
        <meshStandardMaterial color="#90EE90" />
      </Cylinder>
      <Cylinder 
        position={[size * 0.6, size * 0.3, 0]} 
        args={[size * 0.1, size * 0.1, size * 0.4, 8]} 
        castShadow
      >
        <meshStandardMaterial color="#90EE90" />
      </Cylinder>
    </group>
  );
};

// Enhanced Coin with better visual effects
export const EnhancedCoin3D = ({ 
  position, 
  color = "#FFD700", 
  collected = false
}: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      
      // Pulsing glow effect
      if (glowRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
        glowRef.current.scale.setScalar(scale);
      }
    }
  });

  if (collected) return null;

  return (
    <group ref={meshRef}>
      {/* Main coin */}
      <Cylinder
        position={[0, 0, 0]}
        args={[0.4, 0.4, 0.1, 16]}
        castShadow
      >
        <meshStandardMaterial 
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Cylinder>
      
      {/* Inner detail */}
      <Cylinder
        position={[0, 0, 0]}
        args={[0.3, 0.3, 0.12, 16]}
        castShadow
      >
        <meshStandardMaterial 
          color="#FFA500"
          metalness={0.8}
          roughness={0.2}
        />
      </Cylinder>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <Sphere position={[0, 0, 0]} args={[0.6, 16, 16]}>
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.2}
          />
        </Sphere>
      </mesh>
      
      {/* Sparkle particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Sphere 
          key={i}
          position={[
            Math.cos(i * Math.PI / 3) * 0.8,
            Math.sin(i * Math.PI / 2) * 0.3,
            Math.sin(i * Math.PI / 3) * 0.8
          ]} 
          args={[0.02, 6, 6]}
        >
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent
            opacity={0.8}
          />
        </Sphere>
      ))}
    </group>
  );
};

// Particle explosion effect
export const ParticleExplosion3D = ({ 
  position, 
  active = false,
  color = "#FFD700"
}: any) => {
  const particlesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particlesRef.current && active) {
      const time = state.clock.elapsedTime;
      particlesRef.current.children.forEach((particle, i) => {
        const t = time * 2 + i;
        particle.position.x = Math.cos(t) * (time * 2);
        particle.position.y = Math.sin(t * 1.5) * (time * 1.5);
        particle.position.z = Math.sin(t) * (time * 2);
        particle.scale.setScalar(Math.max(0, 1 - time));
      });
    }
  });

  if (!active) return null;

  return (
    <group ref={particlesRef} position={position}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Sphere key={i} args={[0.05, 6, 6]}>
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.8}
          />
        </Sphere>
      ))}
    </group>
  );
};