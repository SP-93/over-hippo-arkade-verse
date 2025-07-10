import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Trail } from "@react-three/drei";
import * as THREE from "three";

interface SnakeSegmentProps {
  position: [number, number, number];
  isHead?: boolean;
}

export const EnhancedSnakeSegment = ({ position, isHead }: SnakeSegmentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <Box
        ref={meshRef}
        args={[0.8, 0.8, 0.8]}
      >
        <meshStandardMaterial 
          color={isHead ? "#00ff41" : "#00cc33"} 
          metalness={0.6}
          roughness={0.2}
          emissive={isHead ? "#004411" : "#002211"}
        />
      </Box>
      
      {/* Glow effect */}
      <Box
        ref={glowRef}
        args={[1.2, 1.2, 1.2]}
      >
        <meshBasicMaterial 
          color={isHead ? "#00ff41" : "#00cc33"}
          transparent
          opacity={0.2}
        />
      </Box>
      
      {/* Core light */}
      <Box args={[0.4, 0.4, 0.4]}>
        <meshBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </Box>
    </group>
  );
};

interface FoodProps {
  position: [number, number, number];
}

export const EnhancedFood = ({ position }: FoodProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
    
    if (glowRef.current) {
      glowRef.current.rotation.x = state.clock.elapsedTime * 1.5;
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.3);
    }
  });

  return (
    <group position={position}>
      {/* Main food sphere */}
      <Sphere
        ref={meshRef}
        args={[0.4, 16, 16]}
      >
        <meshStandardMaterial 
          color="#ff3366" 
          metalness={0.8}
          roughness={0.1}
          emissive="#441122"
        />
      </Sphere>
      
      {/* Outer glow */}
      <Sphere
        ref={glowRef}
        args={[0.8, 12, 12]}
      >
        <meshBasicMaterial 
          color="#ff6699"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Floating particles around food */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 1.2;
        return (
          <Sphere
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 2) * 0.3,
              Math.sin(angle) * radius
            ]}
            args={[0.1, 8, 8]}
          >
            <meshBasicMaterial 
              color="#ffaa33"
              transparent
              opacity={0.6}
            />
          </Sphere>
        );
      })}
    </group>
  );
};

interface SnakeTrailProps {
  positions: [number, number, number][];
}

export const SnakeTrail = ({ positions }: SnakeTrailProps) => {
  const trailRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (trailRef.current && !Array.isArray(trailRef.current.material)) {
      const material = trailRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group>
      {positions.map((pos, index) => {
        const opacity = 1 - (index / positions.length);
        return (
          <Box
            key={index}
            position={pos}
            args={[0.6, 0.6, 0.6]}
            ref={index === 0 ? trailRef : undefined}
          >
            <meshBasicMaterial 
              color="#00ff88"
              transparent
              opacity={opacity * 0.4}
            />
          </Box>
        );
      })}
    </group>
  );
};

export const GameBoundaries = ({ size = 20 }: { size?: number }) => {
  const boundaryRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (boundaryRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      boundaryRef.current.children.forEach((child: any) => {
        if (child.material && !Array.isArray(child.material) && 'opacity' in child.material) {
          child.material.opacity = intensity;
        }
      });
    }
  });

  return (
    <group ref={boundaryRef}>
      {/* Grid lines */}
      <gridHelper args={[size, size, "#00ff41", "#004411"]} />
      
      {/* Boundary walls */}
      {[-size/2, size/2].map((x, i) => (
        <Box
          key={`wall-x-${i}`}
          position={[x, 1, 0]}
          args={[0.2, 2, size]}
        >
          <meshBasicMaterial 
            color="#00ff41"
            transparent
            opacity={0.3}
          />
        </Box>
      ))}
      
      {[-size/2, size/2].map((z, i) => (
        <Box
          key={`wall-z-${i}`}
          position={[0, 1, z]}
          args={[size, 2, 0.2]}
        >
          <meshBasicMaterial 
            color="#00ff41"
            transparent
            opacity={0.3}
          />
        </Box>
      ))}
      
      {/* Corner markers */}
      {[
        [-size/2, -size/2],
        [size/2, -size/2],
        [size/2, size/2],
        [-size/2, size/2]
      ].map(([x, z], i) => (
        <Sphere
          key={`corner-${i}`}
          position={[x, 0.5, z]}
          args={[0.3, 8, 8]}
        >
          <meshBasicMaterial 
            color="#ffff00"
            transparent
            opacity={0.8}
          />
        </Sphere>
      ))}
    </group>
  );
};