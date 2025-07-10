import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

const CELL_SIZE = 1;

interface PacManPlayerProps {
  position: [number, number, number];
  direction: { x: number; z: number };
}

export const PacManPlayer = ({ position, direction }: PacManPlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.atan2(direction.z, direction.x);
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.4, 16, 16]}>
      <meshStandardMaterial 
        color="#ffff00" 
        metalness={0.3}
        roughness={0.2}
        emissive="#444400"
      />
    </Sphere>
  );
};

interface WallProps {
  position: [number, number, number];
}

export const Wall = ({ position }: WallProps) => (
  <Box position={position} args={[CELL_SIZE * 0.9, CELL_SIZE * 2, CELL_SIZE * 0.9]}>
    <meshStandardMaterial 
      color="#2F4F2F" 
      metalness={0.1} 
      roughness={0.8}
      emissive="#1a3d1a"
      emissiveIntensity={0.2}
    />
  </Box>
);

interface DotProps {
  position: [number, number, number];
}

export const Dot = ({ position }: DotProps) => (
  <Sphere position={position} args={[0.08, 12, 12]}>
    <meshStandardMaterial 
      color="#FFD700" 
      emissive="#FFD700"
      emissiveIntensity={0.4}
      metalness={0.3}
      roughness={0.1}
    />
  </Sphere>
);

interface PowerPelletProps {
  position: [number, number, number];
}

export const PowerPellet = ({ position }: PowerPelletProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.2);
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.15, 12, 12]}>
      <meshStandardMaterial 
        color="#ffff00" 
        emissive="#666600"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};

interface GhostProps {
  position: [number, number, number];
  color: string;
}

export const Ghost = ({ position, color }: GhostProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group>
      <Cylinder ref={meshRef} position={position} args={[0.3, 0.3, 0.6, 8]}>
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      </Cylinder>
    </group>
  );
};