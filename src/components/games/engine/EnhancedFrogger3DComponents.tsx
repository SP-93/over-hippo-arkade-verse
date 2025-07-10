import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface FrogProps {
  position: [number, number, number];
  onDrown: () => void;
  onSafety: () => void;
}

export const EnhancedFrog = ({ position, onDrown, onSafety }: FrogProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isInWater, setIsInWater] = useState(false);
  const [isOnLog, setIsOnLog] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      // Breathing animation
      meshRef.current.scale.y = 1 + Math.sin(Date.now() * 0.008) * 0.1;
      
      // Check water zones (y position 5-15 is water)
      const inWaterZone = position[2] >= 5 && position[2] <= 15;
      
      if (inWaterZone && !isOnLog) {
        if (!isInWater) {
          setIsInWater(true);
          setTimeout(() => {
            if (!isOnLog) {
              onDrown();
            }
          }, 2000); // 2 seconds to find a log
        }
      } else {
        setIsInWater(false);
      }
      
      // Check safety zones
      if (position[2] >= 20) {
        onSafety();
      }
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.4, 16, 16]}>
        <meshStandardMaterial 
          color={isInWater ? "#4169E1" : "#228B22"} 
          metalness={0.3}
          roughness={0.7}
          emissive={isInWater ? "#000080" : "#006400"}
          emissiveIntensity={0.2}
        />
      </Sphere>
      {/* Eyes */}
      <Sphere position={[-0.15, 0.2, 0.3]} args={[0.1, 8, 8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere position={[0.15, 0.2, 0.3]} args={[0.1, 8, 8]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
    </group>
  );
};

interface CarProps {
  position: [number, number, number];
  velocity: number;
  color: string;
  playerPosition: [number, number, number];
  onCollision: () => void;
}

export const EnhancedCar = ({ position, velocity, color, playerPosition, onCollision }: CarProps) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Move car
      meshRef.current.position.x += velocity * 0.1;
      
      // Wrap around screen
      if (meshRef.current.position.x > 25) {
        meshRef.current.position.x = -25;
      } else if (meshRef.current.position.x < -25) {
        meshRef.current.position.x = 25;
      }
      
      // Collision detection with player
      const carPos = new THREE.Vector3().copy(meshRef.current.position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = carPos.distanceTo(playerPos);
      
      if (distance < 1.2) {
        onCollision();
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Car body */}
      <Box args={[2, 0.6, 1]} position={[0, 0.3, 0]}>
        <meshStandardMaterial 
          color={color} 
          metalness={0.8}
          roughness={0.2}
        />
      </Box>
      {/* Car top */}
      <Box args={[1.2, 0.4, 0.8]} position={[0, 0.8, 0]}>
        <meshStandardMaterial 
          color={color} 
          metalness={0.6}
          roughness={0.3}
        />
      </Box>
      {/* Wheels */}
      <Cylinder position={[-0.7, 0, 0.6]} args={[0.2, 0.2, 0.1, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2F2F2F" />
      </Cylinder>
      <Cylinder position={[0.7, 0, 0.6]} args={[0.2, 0.2, 0.1, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2F2F2F" />
      </Cylinder>
      <Cylinder position={[-0.7, 0, -0.6]} args={[0.2, 0.2, 0.1, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2F2F2F" />
      </Cylinder>
      <Cylinder position={[0.7, 0, -0.6]} args={[0.2, 0.2, 0.1, 8]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#2F2F2F" />
      </Cylinder>
    </group>
  );
};

interface LogProps {
  position: [number, number, number];
  velocity: number;
  playerPosition: [number, number, number];
  onPlayerMount: (logPosition: [number, number, number]) => void;
  onPlayerDismount: () => void;
}

export const EnhancedLog = ({ position, velocity, playerPosition, onPlayerMount, onPlayerDismount }: LogProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [playerOnLog, setPlayerOnLog] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      // Move log
      meshRef.current.position.x += velocity * 0.05;
      
      // Wrap around screen
      if (meshRef.current.position.x > 25) {
        meshRef.current.position.x = -25;
      } else if (meshRef.current.position.x < -25) {
        meshRef.current.position.x = 25;
      }
      
      // Check if player is on this log
      const logPos = new THREE.Vector3().copy(meshRef.current.position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = logPos.distanceTo(playerPos);
      
      if (distance < 1.5 && !playerOnLog) {
        setPlayerOnLog(true);
        onPlayerMount([logPos.x, logPos.y, logPos.z]);
      } else if (distance > 2 && playerOnLog) {
        setPlayerOnLog(false);
        onPlayerDismount();
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Cylinder args={[0.3, 0.3, 3, 12]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.1}
          roughness={0.9}
        />
      </Cylinder>
      {/* Log ends */}
      <Cylinder position={[-1.5, 0, 0]} args={[0.35, 0.35, 0.2, 12]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      <Cylinder position={[1.5, 0, 0]} args={[0.35, 0.35, 0.2, 12]} rotation={[0, 0, Math.PI/2]}>
        <meshStandardMaterial color="#654321" />
      </Cylinder>
    </group>
  );
};

export const WaterZone = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Water animation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Box ref={meshRef} position={position} args={size}>
      <meshStandardMaterial 
        color="#4169E1" 
        transparent
        opacity={0.7}
        metalness={0.8}
        roughness={0.1}
        emissive="#1e3a8a"
        emissiveIntensity={0.2}
      />
    </Box>
  );
};

export const Road = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => {
  return (
    <Box position={position} args={size}>
      <meshStandardMaterial 
        color="#2F2F2F" 
        metalness={0.1}
        roughness={0.9}
      />
    </Box>
  );
};

export const SafeZone = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Glowing animation
      const glow = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = glow * 0.3;
      }
    }
  });

  return (
    <Box ref={meshRef} position={position} args={size}>
      <meshStandardMaterial 
        color="#228B22" 
        emissive="#006400"
        emissiveIntensity={0.3}
        metalness={0.2}
        roughness={0.8}
      />
    </Box>
  );
};