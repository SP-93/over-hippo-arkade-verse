import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder, Plane } from "@react-three/drei";
import * as THREE from "three";

// Enhanced 3D Player Character with animations
export const Player3D = ({ 
  position, 
  rotation, 
  color = "#00ff41", 
  size = 1, 
  type = "cube",
  animation = "idle"
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      switch (animation) {
        case "jump":
          meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 10) * 0.2;
          break;
        case "spin":
          meshRef.current.rotation.y = state.clock.elapsedTime * 2;
          break;
        case "pulse":
          const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
          meshRef.current.scale.setScalar(scale);
          break;
        default:
          meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      }
    }
  });

  if (type === "sphere") {
    return (
      <Sphere
        ref={meshRef}
        position={position}
        rotation={rotation}
        args={[size * 0.5, 32, 32]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </Sphere>
    );
  }

  return (
    <Box
      ref={meshRef}
      position={position}
      rotation={rotation}
      args={[size, size, size]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={color}
        metalness={0.3}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </Box>
  );
};

// Enhanced 3D Enemy with AI behavior
export const Enemy3D = ({ 
  position, 
  color = "#ff3366", 
  size = 1, 
  behavior = "patrol",
  speed = 1
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      switch (behavior) {
        case "patrol":
          meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 3;
          break;
        case "circle":
          meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed) * 2;
          meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * speed) * 2;
          break;
        case "bounce":
          meshRef.current.position.y = position[1] + Math.abs(Math.sin(state.clock.elapsedTime * speed * 2)) * 2;
          break;
      }
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[size, size, size]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={color}
        metalness={0.5}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Box>
  );
};

// 3D Collectible Item
export const Collectible3D = ({ 
  position, 
  color = "#FFD700", 
  type = "coin",
  collected = false
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (collected) return null;

  if (type === "coin") {
    return (
      <Cylinder
        ref={meshRef}
        position={position}
        args={[0.3, 0.3, 0.1, 16]}
        castShadow
      >
        <meshStandardMaterial 
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Cylinder>
    );
  }

  return (
    <Sphere
      ref={meshRef}
      position={position}
      args={[0.4, 16, 16]}
      castShadow
    >
      <meshStandardMaterial 
        color={color}
        metalness={0.8}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

// 3D Platform/Block
export const Platform3D = ({ 
  position, 
  size = [2, 0.5, 2], 
  color = "#4a5568",
  type = "solid"
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && type === "moving") {
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime) * 2;
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      args={size}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial 
        color={color}
        metalness={0.1}
        roughness={0.8}
      />
    </Box>
  );
};

// 3D Game World Floor
export const GameFloor3D = ({ 
  size = 50, 
  color = "#2d3748",
  pattern = "grid"
}: any) => {
  return (
    <group>
      <Plane
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[size, size]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={color}
          metalness={0.1}
          roughness={0.9}
        />
      </Plane>
      
      {pattern === "grid" && (
        <gridHelper 
          args={[size, size, "#00ff41", "#003311"]} 
          position={[0, -0.49, 0]}
        />
      )}
    </group>
  );
};

// 3D Particle System
export const ParticleSystem3D = ({ 
  position, 
  count = 50, 
  color = "#00ff41",
  spread = 5
}: any) => {
  const particles = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y = state.clock.elapsedTime * 0.5;
      particles.current.children.forEach((particle, i) => {
        const time = state.clock.elapsedTime + i;
        particle.position.y = Math.sin(time * 2 + i) * 0.5;
        particle.scale.setScalar(Math.sin(time * 3 + i) * 0.5 + 1);
      });
    }
  });

  const particlePositions = Array.from({ length: count }, (_, i) => [
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread
  ] as [number, number, number]);

  return (
    <group ref={particles} position={position}>
      {particlePositions.map((pos, i) => (
        <Sphere key={i} position={pos} args={[0.05, 8, 8]}>
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </Sphere>
      ))}
    </group>
  );
};

// 3D UI Elements
export const UI3D = ({ 
  position, 
  text, 
  color = "#ffffff",
  size = 1
}: any) => {
  return (
    <group position={position}>
      <Plane args={[size * 2, size * 0.5]}>
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </Plane>
    </group>
  );
};