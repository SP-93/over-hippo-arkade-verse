import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// Enhanced Spaceship Component
export const EnhancedSpaceship3D = ({ 
  position, 
  rotation = 0, 
  thrust = false 
}: { 
  position: [number, number, number];
  rotation?: number;
  thrust?: boolean;
}) => {
  const shipRef = useRef<THREE.Group>(null);
  const thrustRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (shipRef.current) {
      shipRef.current.position.set(...position);
      shipRef.current.rotation.y = rotation;
      
      // Gentle hover animation
      const hover = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      shipRef.current.position.y = position[1] + hover;
    }
    
    if (thrustRef.current && thrust) {
      const flickerIntensity = Math.random() * 0.5 + 0.5;
      thrustRef.current.scale.setScalar(flickerIntensity);
    }
  });

  return (
    <group ref={shipRef}>
      {/* Main body */}
      <Cylinder args={[0.3, 0.8, 2, 8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial 
          color="#4A90E2" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#1A4A8A"
          emissiveIntensity={0.3}
        />
      </Cylinder>
      
      {/* Wings */}
      <Box args={[2.5, 0.1, 0.8]} position={[0, 0, -0.5]} castShadow>
        <meshStandardMaterial color="#2E5B9A" metalness={0.6} roughness={0.3} />
      </Box>
      
      {/* Cockpit */}
      <Sphere args={[0.4, 12, 8]} position={[0, 0.3, 0.5]} castShadow>
        <meshStandardMaterial 
          color="#87CEEB" 
          transparent 
          opacity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </Sphere>
      
      {/* Engine lights */}
      <Sphere args={[0.15, 8, 8]} position={[-0.8, 0, -1]} castShadow>
        <meshStandardMaterial 
          color="#00ff41" 
          emissive="#00ff41" 
          emissiveIntensity={1}
        />
      </Sphere>
      <Sphere args={[0.15, 8, 8]} position={[0.8, 0, -1]} castShadow>
        <meshStandardMaterial 
          color="#00ff41" 
          emissive="#00ff41" 
          emissiveIntensity={1}
        />
      </Sphere>
      
      {/* Thrust effect */}
      {thrust && (
        <group ref={thrustRef} position={[0, 0, -1.5]}>
          <Cylinder args={[0.2, 0.05, 1, 8]} castShadow>
            <meshBasicMaterial 
              color="#FF6B35" 
              transparent 
              opacity={0.8}
            />
          </Cylinder>
          <Cylinder args={[0.3, 0.1, 0.8, 8]} position={[0, 0, 0.1]} castShadow>
            <meshBasicMaterial 
              color="#FFD23F" 
              transparent 
              opacity={0.6}
            />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

// Enhanced Asteroid Component
export const EnhancedAsteroid3D = ({ 
  position, 
  size = 1, 
  rotationSpeed = 1,
  destroyed = false
}: { 
  position: [number, number, number];
  size?: number;
  rotationSpeed?: number;
  destroyed?: boolean;
}) => {
  const asteroidRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (asteroidRef.current && !destroyed) {
      asteroidRef.current.position.set(...position);
      asteroidRef.current.rotation.x += 0.01 * rotationSpeed;
      asteroidRef.current.rotation.y += 0.015 * rotationSpeed;
      asteroidRef.current.rotation.z += 0.008 * rotationSpeed;
    }
  });

  if (destroyed) return null;

  const asteroidColor = size > 1.5 ? "#8B4513" : size > 1 ? "#A0522D" : "#CD853F";

  return (
    <group ref={asteroidRef}>
      {/* Main asteroid body - irregular shape */}
      <Box args={[size, size * 0.8, size * 1.2]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={asteroidColor}
          roughness={0.9}
          metalness={0.1}
        />
      </Box>
      
      {/* Additional rocky chunks for irregular shape */}
      <Box args={[size * 0.6, size * 0.4, size * 0.8]} position={[size * 0.3, size * 0.2, 0]} castShadow>
        <meshStandardMaterial color={asteroidColor} roughness={0.9} />
      </Box>
      <Box args={[size * 0.4, size * 0.6, size * 0.5]} position={[-size * 0.2, -size * 0.3, size * 0.2]} castShadow>
        <meshStandardMaterial color={asteroidColor} roughness={0.9} />
      </Box>
      
      {/* Surface details */}
      {Array.from({ length: Math.floor(size * 3) }, (_, i) => (
        <Sphere 
          key={i}
          args={[size * 0.05, 6, 6]} 
          position={[
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
          ]}
          castShadow
        >
          <meshStandardMaterial color="#654321" roughness={1} />
        </Sphere>
      ))}
    </group>
  );
};

// Enhanced Bullet Component
export const EnhancedBullet3D = ({ 
  position, 
  direction
}: { 
  position: [number, number, number];
  direction: [number, number, number];
}) => {
  const bulletRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (bulletRef.current) {
      bulletRef.current.position.set(...position);
      bulletRef.current.rotation.z = state.clock.elapsedTime * 20;
    }
    
    if (trailRef.current) {
      const trail = Math.sin(state.clock.elapsedTime * 10) * 0.3 + 0.7;
      trailRef.current.scale.setScalar(trail);
    }
  });

  return (
    <group ref={bulletRef}>
      {/* Main bullet */}
      <Cylinder args={[0.05, 0.02, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial 
          color="#00ff41" 
          emissive="#00ff41" 
          emissiveIntensity={0.8}
          metalness={0.9}
        />
      </Cylinder>
      
      {/* Energy trail */}
      <group ref={trailRef} position={[0, 0, -0.2]}>
        <Cylinder args={[0.08, 0.02, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial 
            color="#66ff99" 
            transparent 
            opacity={0.6}
          />
        </Cylinder>
      </group>
      
      {/* Glow effect */}
      <Sphere args={[0.1, 8, 8]} position={[0, 0, 0.1]}>
        <meshBasicMaterial 
          color="#00ff41" 
          transparent 
          opacity={0.3}
        />
      </Sphere>
    </group>
  );
};

// Explosion Effect Component
export const ExplosionEffect3D = ({ 
  position, 
  size = 1, 
  color = "#FF6B35" 
}: { 
  position: [number, number, number];
  size?: number;
  color?: string;
}) => {
  const explosionRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (explosionRef.current) {
      const scale = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 1;
      explosionRef.current.scale.setScalar(scale * size);
      explosionRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group ref={explosionRef} position={position}>
      {/* Main explosion sphere */}
      <Sphere args={[1, 12, 8]}>
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
        />
      </Sphere>
      
      {/* Explosion fragments */}
      {Array.from({ length: 8 }, (_, i) => (
        <Sphere 
          key={i}
          args={[0.2, 6, 6]} 
          position={[
            Math.cos(i * Math.PI / 4) * 2,
            Math.sin(i * Math.PI / 4) * 2,
            (Math.random() - 0.5) * 2
          ]}
        >
          <meshBasicMaterial color="#FFD23F" transparent opacity={0.6} />
        </Sphere>
      ))}
    </group>
  );
};

// Star Field Background
export const StarField3D = ({ count = 200 }: { count?: number }) => {
  const starsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const stars = Array.from({ length: count }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ] as [number, number, number],
    size: Math.random() * 0.05 + 0.02
  }));

  return (
    <group ref={starsRef}>
      {stars.map((star, i) => (
        <Sphere key={i} args={[star.size, 4, 4]} position={star.position}>
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={Math.random() * 0.5 + 0.5}
        />
        </Sphere>
      ))}
    </group>
  );
};