import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// Enhanced Pinball Components
export const EnhancedPinballTable3D = () => {
  const tableRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={tableRef}>
      {/* Main table surface */}
      <Box args={[16, 0.2, 24]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#228B22" 
          metalness={0.1} 
          roughness={0.8}
        />
      </Box>
      
      {/* Table borders */}
      <Box args={[0.5, 2, 24]} position={[-8, 1, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      <Box args={[0.5, 2, 24]} position={[8, 1, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      <Box args={[16, 2, 0.5]} position={[0, 1, 12]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      
      {/* Launch lane */}
      <Box args={[1.5, 0.3, 8]} position={[7, 0.25, -8]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
      
      {/* Score lanes */}
      <Box args={[0.2, 0.5, 4]} position={[-3, 0.35, 8]} castShadow>
        <meshStandardMaterial color="#FFD700" />
      </Box>
      <Box args={[0.2, 0.5, 4]} position={[0, 0.35, 8]} castShadow>
        <meshStandardMaterial color="#FFD700" />
      </Box>
      <Box args={[0.2, 0.5, 4]} position={[3, 0.35, 8]} castShadow>
        <meshStandardMaterial color="#FFD700" />
      </Box>
    </group>
  );
};

// Enhanced Ball with Trail
export const EnhancedPinball3D = ({ 
  position, 
  velocity
}: { 
  position: [number, number, number];
  velocity: [number, number, number];
}) => {
  const ballRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ballRef.current) {
      ballRef.current.position.set(...position);
      ballRef.current.rotation.x += 0.1;
      ballRef.current.rotation.z += 0.15;
    }
    
    if (trailRef.current) {
      const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
      const trailIntensity = Math.min(speed * 2, 1);
      trailRef.current.scale.setScalar(trailIntensity);
    }
  });

  return (
    <group ref={ballRef}>
      {/* Main ball */}
      <Sphere args={[0.25, 16, 16]} castShadow>
        <meshStandardMaterial 
          color="#FFD700" 
          metalness={0.9} 
          roughness={0.1}
          emissive="#666600"
          emissiveIntensity={0.3}
        />
      </Sphere>
      
      {/* Trail effect */}
      <group ref={trailRef}>
        <Sphere args={[0.3, 8, 8]}>
          <meshBasicMaterial 
            color="#FFD700" 
            transparent 
            opacity={0.3}
          />
        </Sphere>
      </group>
      
      {/* Core highlight */}
      <Sphere args={[0.15, 8, 8]}>
        <meshBasicMaterial 
          color="#FFFFFF" 
          transparent 
          opacity={0.8}
        />
      </Sphere>
    </group>
  );
};

// Enhanced Flipper
export const EnhancedFlipper3D = ({ 
  position, 
  rotation = 0, 
  side = 'left',
  active = false
}: { 
  position: [number, number, number];
  rotation?: number;
  side?: 'left' | 'right';
  active?: boolean;
}) => {
  const flipperRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (flipperRef.current) {
      flipperRef.current.position.set(...position);
      flipperRef.current.rotation.y = rotation;
      
      if (active) {
        const glow = Math.sin(state.clock.elapsedTime * 10) * 0.1 + 1;
        flipperRef.current.scale.setScalar(glow);
      } else {
        flipperRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={flipperRef}>
      {/* Flipper paddle */}
      <Box args={[2.5, 0.3, 0.6]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={active ? "#ff3366" : "#4A90E2"}
          metalness={0.8} 
          roughness={0.2}
          emissive={active ? "#661122" : "#1A4A8A"}
          emissiveIntensity={active ? 0.5 : 0.2}
        />
      </Box>
      
      {/* Flipper base/pivot */}
      <Cylinder args={[0.3, 0.3, 0.8, 12]} castShadow>
        <meshStandardMaterial 
          color="#666666" 
          metalness={0.9}
        />
      </Cylinder>
      
      {/* Energy field when active */}
      {active && (
        <Box args={[2.7, 0.4, 0.8]}>
          <meshBasicMaterial 
            color="#ff3366" 
            transparent 
            opacity={0.3}
          />
        </Box>
      )}
    </group>
  );
};

// Enhanced Bumper
export const EnhancedBumper3D = ({ 
  position, 
  hit = false
}: { 
  position: [number, number, number];
  hit?: boolean;
}) => {
  const bumperRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (bumperRef.current) {
      if (hit) {
        const scale = Math.sin(state.clock.elapsedTime * 15) * 0.3 + 1.3;
        bumperRef.current.scale.setScalar(scale);
      } else {
        const bounce = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        bumperRef.current.scale.setScalar(bounce);
      }
    }
  });

  return (
    <group ref={bumperRef} position={position}>
      {/* Main bumper body */}
      <Cylinder args={[0.8, 0.8, 1, 16]} castShadow>
        <meshStandardMaterial 
          color={hit ? "#ff3366" : "#00ff41"}
          metalness={0.6} 
          roughness={0.3}
          emissive={hit ? "#ff3366" : "#00ff41"}
          emissiveIntensity={hit ? 0.8 : 0.4}
        />
      </Cylinder>
      
      {/* Bumper cap */}
      <Sphere args={[0.8, 12, 8]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial 
          color={hit ? "#ff6666" : "#66ff66"}
          metalness={0.8} 
          roughness={0.1}
        />
      </Sphere>
      
      {/* Impact rings */}
      {hit && (
        <>
          <Cylinder args={[1.2, 1.2, 0.1, 16]} position={[0, 0.6, 0]}>
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.6}
            />
          </Cylinder>
          <Cylinder args={[1.5, 1.5, 0.1, 16]} position={[0, 0.7, 0]}>
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
            />
          </Cylinder>
        </>
      )}
      
      {/* Base */}
      <Cylinder args={[1, 1, 0.2, 16]} position={[0, -0.4, 0]} receiveShadow>
        <meshStandardMaterial color="#333333" />
      </Cylinder>
    </group>
  );
};

// Enhanced Plunger
export const EnhancedPlunger3D = ({ 
  position, 
  power = 0
}: { 
  position: [number, number, number];
  power?: number;
}) => {
  const plungerRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (plungerRef.current) {
      plungerRef.current.position.set(...position);
      
      if (power > 0) {
        const vibration = Math.sin(state.clock.elapsedTime * 30) * power * 0.1;
        plungerRef.current.position.z += vibration;
      }
    }
  });

  return (
    <group ref={plungerRef}>
      {/* Plunger shaft */}
      <Cylinder args={[0.15, 0.15, 3, 12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial 
          color="#888888" 
          metalness={0.8}
        />
      </Cylinder>
      
      {/* Plunger handle */}
      <Sphere args={[0.3, 12, 8]} position={[0, 0, 1.5]} castShadow>
        <meshStandardMaterial 
          color="#ff6633" 
          metalness={0.6}
        />
      </Sphere>
      
      {/* Power indicator */}
      {power > 0 && (
        <Cylinder 
          args={[0.2, 0.2, power * 2, 8]} 
          position={[0, 0, -power]} 
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial 
            color="#ffff00" 
            transparent 
            opacity={0.7}
          />
        </Cylinder>
      )}
    </group>
  );
};

// Score Display Component
export const ScoreDisplay3D = ({ 
  position, 
  value, 
  color = "#FFD700"
}: { 
  position: [number, number, number];
  value: string;
  color?: string;
}) => {
  const displayRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (displayRef.current) {
      const glow = Math.sin(state.clock.elapsedTime * 4) * 0.2 + 1;
      displayRef.current.scale.setScalar(glow);
    }
  });

  return (
    <group ref={displayRef} position={position}>
      {/* Display background */}
      <Box args={[2, 0.8, 0.1]} castShadow>
        <meshStandardMaterial color="#000000" />
      </Box>
      
      {/* Display frame */}
      <Box args={[2.2, 1, 0.2]} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#666666" metalness={0.8} />
      </Box>
    </group>
  );
};