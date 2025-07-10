import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Cylinder, Sphere } from "@react-three/drei";
import * as THREE from "three";

interface Barrel {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
}

interface PlayerProps {
  position: [number, number, number];
  onCollision: () => void;
}

export const EnhancedPlayer = ({ position, onCollision }: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Smooth breathing animation
      meshRef.current.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    }
  });

  return (
    <Box ref={meshRef} position={position} args={[0.8, 1.2, 0.8]}>
      <meshStandardMaterial 
        color="#4A90E2" 
        metalness={0.3}
        roughness={0.7}
        emissive="#1a3d5c"
        emissiveIntensity={0.2}
      />
    </Box>
  );
};

interface EnhancedBarrelProps {
  barrel: Barrel;
  onCollisionWithPlayer: (barrelId: number) => void;
  playerPosition: [number, number, number];
}

export const EnhancedBarrel = ({ barrel, onCollisionWithPlayer, playerPosition }: EnhancedBarrelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Improved collision detection with player
      const barrelPos = new THREE.Vector3(...barrel.position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = barrelPos.distanceTo(playerPos);
      
      // More accurate collision detection (considering barrel and player size)
      if (distance < 1.2) {
        onCollisionWithPlayer(barrel.id);
      }
      
      // Rolling animation
      meshRef.current.rotation.x += 0.1;
      meshRef.current.rotation.z += 0.05;
    }
  });

  return (
    <Cylinder 
      ref={meshRef}
      position={barrel.position} 
      args={[0.4, 0.4, 0.8, 16]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial 
        color="#8B4513" 
        metalness={0.1}
        roughness={0.8}
        emissive="#3d1f0a"
        emissiveIntensity={0.1}
      />
    </Cylinder>
  );
};

export const EnhancedLadder = ({ position, height = 10 }: { position: [number, number, number]; height?: number }) => {
  return (
    <group position={position}>
      {/* Ladder rails */}
      <Box position={[-0.3, height/2, 0]} args={[0.1, height, 0.1]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box position={[0.3, height/2, 0]} args={[0.1, height, 0.1]}>
        <meshStandardMaterial color="#654321" />
      </Box>
      
      {/* Ladder rungs */}
      {Array.from({ length: Math.floor(height / 0.8) }, (_, i) => (
        <Box key={i} position={[0, i * 0.8 + 0.4, 0]} args={[0.7, 0.05, 0.1]}>
          <meshStandardMaterial color="#654321" />
        </Box>
      ))}
    </group>
  );
};

export const EnhancedPlatform = ({ position, width = 6 }: { position: [number, number, number]; width?: number }) => {
  return (
    <Box position={position} args={[width, 0.2, 1]}>
      <meshStandardMaterial 
        color="#8B7355" 
        metalness={0.1}
        roughness={0.9}
      />
    </Box>
  );
};

interface WinZoneProps {
  position: [number, number, number];
  playerPosition: [number, number, number];
  onWin: () => void;
}

export const EnhancedWinZone = ({ position, playerPosition, onWin }: WinZoneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current && !isTriggered) {
      const winPos = new THREE.Vector3(...position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = winPos.distanceTo(playerPos);
      
      if (distance < 2) {
        setIsTriggered(true);
        onWin();
      }
      
      // Glowing animation
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.1);
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[1, 16, 16]}>
      <meshStandardMaterial 
        color="#FFD700" 
        emissive="#FFD700"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </Sphere>
  );
};

export const GameBoundary = ({ size = 20 }: { size?: number }) => {
  return (
    <group>
      {/* Invisible walls for collision detection */}
      <Box position={[-size/2, 0, 0]} args={[0.1, size, size]} visible={false} />
      <Box position={[size/2, 0, 0]} args={[0.1, size, size]} visible={false} />
      <Box position={[0, -size/2, 0]} args={[size, 0.1, size]} visible={false} />
      
      {/* Visual floor */}
      <Box position={[0, -10, 0]} args={[size, 0.2, size]}>
        <meshStandardMaterial color="#2F4F2F" />
      </Box>
    </group>
  );
};