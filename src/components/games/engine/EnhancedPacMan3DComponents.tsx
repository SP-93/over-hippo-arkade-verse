import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface GhostAIProps {
  position: [number, number, number];
  targetPosition: [number, number, number];
  maze: number[][];
  color: string;
  mode: 'chase' | 'scatter' | 'frightened';
  onPlayerCollision: () => void;
}

export const EnhancedGhost = ({ position, targetPosition, maze, color, mode, onPlayerCollision }: GhostAIProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [direction, setDirection] = useState<[number, number]>([0, 0]);
  
  useFrame(() => {
    if (meshRef.current) {
      // Basic AI pathfinding - move towards target
      const dx = targetPosition[0] - currentPosition[0];
      const dz = targetPosition[2] - currentPosition[2];
      
      // Simple movement logic
      if (Math.abs(dx) > Math.abs(dz)) {
        setDirection([dx > 0 ? 1 : -1, 0]);
      } else {
        setDirection([0, dz > 0 ? 1 : -1]);
      }
      
      // Update position
      const newX = currentPosition[0] + direction[0] * 0.05;
      const newZ = currentPosition[2] + direction[1] * 0.05;
      
      // Check maze boundaries
      const gridX = Math.round(newX);
      const gridZ = Math.round(newZ);
      
      if (maze[gridZ] && maze[gridZ][gridX] !== 1) {
        setCurrentPosition([newX, currentPosition[1], newZ]);
        meshRef.current.position.set(newX, currentPosition[1], newZ);
      }
      
      // Floating animation
      meshRef.current.position.y = currentPosition[1] + Math.sin(Date.now() * 0.005) * 0.1;
      
      // Check collision with player
      const ghostPos = new THREE.Vector3(newX, currentPosition[1], newZ);
      const playerPos = new THREE.Vector3(...targetPosition);
      const distance = ghostPos.distanceTo(playerPos);
      
      if (distance < 0.8) {
        onPlayerCollision();
      }
    }
  });

  const ghostColor = mode === 'frightened' ? "#4169E1" : color;

  return (
    <group ref={meshRef} position={currentPosition}>
      {/* Ghost body */}
      <Sphere args={[0.4, 16, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={ghostColor}
          metalness={0.3}
          roughness={0.7}
          emissive={ghostColor}
          emissiveIntensity={0.2}
        />
      </Sphere>
      
      {/* Ghost "skirt" */}
      <Cylinder args={[0.4, 0.5, 0.3, 8]} position={[0, -0.15, 0]}>
        <meshStandardMaterial 
          color={ghostColor}
          metalness={0.3}
          roughness={0.7}
        />
      </Cylinder>
      
      {/* Eyes */}
      <Sphere position={[-0.15, 0.1, 0.3]} args={[0.08, 8, 8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere position={[0.15, 0.1, 0.3]} args={[0.08, 8, 8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      
      {/* Pupils */}
      <Sphere position={[-0.15, 0.1, 0.35]} args={[0.04, 8, 8]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere position={[0.15, 0.1, 0.35]} args={[0.04, 8, 8]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
    </group>
  );
};

interface EnhancedPacManProps {
  position: [number, number, number];
  direction: { x: number; z: number };
}

export const EnhancedPacMan = ({ position, direction }: EnhancedPacManProps) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Rotation based on direction
      let rotation = 0;
      if (direction.x > 0) rotation = 0;
      else if (direction.x < 0) rotation = Math.PI;
      else if (direction.z > 0) rotation = Math.PI / 2;
      else if (direction.z < 0) rotation = -Math.PI / 2;
      
      meshRef.current.rotation.y = rotation;
      
      // Mouth animation
      const mouthAnimation = Math.sin(state.clock.elapsedTime * 10) * 0.3;
      meshRef.current.rotation.z = mouthAnimation;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Sphere args={[0.4, 16, 16]}>
        <meshStandardMaterial 
          color="#ffff00" 
          metalness={0.3}
          roughness={0.2}
          emissive="#444400"
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );
};

interface EnhancedDotProps {
  position: [number, number, number];
  isPowerPellet?: boolean;
  collected: boolean;
  onCollect: () => void;
  playerPosition: [number, number, number];
}

export const EnhancedDot = ({ position, isPowerPellet = false, collected, onCollect, playerPosition }: EnhancedDotProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!collected && meshRef.current) {
      // Check if player is close enough to collect
      const dotPos = new THREE.Vector3(...position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = dotPos.distanceTo(playerPos);
      
      if (distance < 0.5) {
        onCollect();
      }
      
      // Animation for power pellets
      if (isPowerPellet) {
        meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.2);
      }
    }
  });

  if (collected) return null;

  const size = isPowerPellet ? 0.15 : 0.08;

  return (
    <Sphere ref={meshRef} position={position} args={[size, 12, 12]}>
      <meshStandardMaterial 
        color="#FFD700" 
        emissive="#FFD700"
        emissiveIntensity={isPowerPellet ? 0.5 : 0.4}
        metalness={0.3}
        roughness={0.1}
      />
    </Sphere>
  );
};

interface MazeWallProps {
  position: [number, number, number];
  type: 'wall' | 'corner' | 'junction';
}

export const EnhancedMazeWall = ({ position, type }: MazeWallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Subtle glow animation
      const glow = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = glow * 0.2;
      }
    }
  });

  const height = type === 'corner' ? 1.5 : 1.2;

  return (
    <Box ref={meshRef} position={position} args={[0.9, height, 0.9]}>
      <meshStandardMaterial 
        color="#2F4F2F" 
        metalness={0.1} 
        roughness={0.8}
        emissive="#1a3d1a"
        emissiveIntensity={0.2}
      />
    </Box>
  );
};

export const GameBounds = ({ size = 21 }: { size?: number }) => {
  return (
    <group>
      {/* Outer walls */}
      <Box position={[0, 0, -size/2]} args={[size, 0.5, 0.2]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      <Box position={[0, 0, size/2]} args={[size, 0.5, 0.2]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      <Box position={[-size/2, 0, 0]} args={[0.2, 0.5, size]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      <Box position={[size/2, 0, 0]} args={[0.2, 0.5, size]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      
      {/* Floor */}
      <Box position={[0, -0.5, 0]} args={[size, 0.1, size]}>
        <meshStandardMaterial color="#000033" />
      </Box>
    </group>
  );
};