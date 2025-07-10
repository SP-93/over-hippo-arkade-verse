import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder, Torus } from "@react-three/drei";
import * as THREE from "three";

interface PacManProps {
  position: [number, number, number];
  direction: 'up' | 'down' | 'left' | 'right';
}

export const EnhancedPacMan = ({ position, direction }: PacManProps) => {
  const pacmanRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (pacmanRef.current) {
      // Rotation based on direction
      const rotations = {
        right: 0,
        left: Math.PI,
        up: Math.PI / 2,
        down: -Math.PI / 2
      };
      pacmanRef.current.rotation.z = rotations[direction];
      
      // Bounce animation
      pacmanRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 8) * 0.1;
    }
    
    // Mouth animation
    if (mouthRef.current) {
      const mouthOpen = Math.sin(state.clock.elapsedTime * 15) * 0.3 + 0.3;
      mouthRef.current.scale.y = mouthOpen;
    }
  });

  return (
    <group ref={pacmanRef} position={position}>
      {/* Main body */}
      <Sphere args={[0.4, 16, 16]}>
        <meshStandardMaterial 
          color="#ffff00"
          metalness={0.3}
          roughness={0.2}
          emissive="#444400"
          emissiveIntensity={0.2}
        />
      </Sphere>
      
      {/* Mouth */}
      <Box
        ref={mouthRef}
        position={[0.2, 0, 0]}
        args={[0.4, 0.6, 0.6]}
      >
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.9}
        />
      </Box>
      
      {/* Glow effect */}
      <Sphere args={[0.5, 12, 12]}>
        <meshBasicMaterial 
          color="#ffff88"
          transparent
          opacity={0.2}
        />
      </Sphere>
      
      {/* Eyes */}
      <Sphere
        position={[-0.1, 0.15, 0.3]}
        args={[0.06, 8, 8]}
      >
        <meshBasicMaterial color="#000000" />
      </Sphere>
      <Sphere
        position={[-0.1, -0.15, 0.3]}
        args={[0.06, 8, 8]}
      >
        <meshBasicMaterial color="#000000" />
      </Sphere>
    </group>
  );
};

interface GhostProps {
  position: [number, number, number];
  color: string;
  mode: 'chase' | 'scatter' | 'frightened';
}

export const EnhancedGhost = ({ position, color, mode }: GhostProps) => {
  const ghostRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ghostRef.current) {
      // Floating animation
      ghostRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 6 + position[0]) * 0.1;
      
      // Rotation based on mode
      if (mode === 'frightened') {
        ghostRef.current.rotation.y = state.clock.elapsedTime * 2;
      }
    }
    
    if (bodyRef.current && mode === 'frightened') {
      bodyRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 8) * 0.1);
    }
  });

  const getGhostColor = () => {
    if (mode === 'frightened') return '#4444ff';
    return color;
  };

  const getEmissiveColor = () => {
    if (mode === 'frightened') return '#000044';
    const colorMap: { [key: string]: string } = {
      '#ff0000': '#440000',
      '#ffb8ff': '#440044',
      '#00ffff': '#004444',
      '#ffb852': '#441100'
    };
    return colorMap[color] || '#222222';
  };

  return (
    <group ref={ghostRef} position={position}>
      {/* Ghost body */}
      <Sphere
        ref={bodyRef}
        args={[0.35, 12, 12]}
        scale={[1, 1.2, 1]}
      >
        <meshStandardMaterial 
          color={getGhostColor()}
          metalness={0.2}
          roughness={0.4}
          emissive={getEmissiveColor()}
          emissiveIntensity={0.3}
        />
      </Sphere>
      
      {/* Ghost bottom wavy part */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
        <Box
          key={i}
          position={[x, -0.35, 0]}
          args={[0.08, 0.15, 0.3]}
        >
          <meshStandardMaterial 
            color={getGhostColor()}
            metalness={0.2}
            roughness={0.4}
            emissive={getEmissiveColor()}
            emissiveIntensity={0.3}
          />
        </Box>
      ))}
      
      {/* Eyes */}
      <Sphere
        position={[-0.12, 0.1, 0.25]}
        args={[0.08, 8, 8]}
      >
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      <Sphere
        position={[0.12, 0.1, 0.25]}
        args={[0.08, 8, 8]}
      >
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      
      {/* Eye pupils */}
      <Sphere
        position={[-0.12, 0.1, 0.3]}
        args={[0.04, 6, 6]}
      >
        <meshBasicMaterial color="#000000" />
      </Sphere>
      <Sphere
        position={[0.12, 0.1, 0.3]}
        args={[0.04, 6, 6]}
      >
        <meshBasicMaterial color="#000000" />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere args={[0.45, 10, 10]}>
        <meshBasicMaterial 
          color={getGhostColor()}
          transparent
          opacity={0.15}
        />
      </Sphere>
    </group>
  );
};

interface PelletProps {
  position: [number, number, number];
  isPowerPellet?: boolean;
}

export const EnhancedPellet = ({ position, isPowerPellet = false }: PelletProps) => {
  const pelletRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (pelletRef.current) {
      pelletRef.current.rotation.y = state.clock.elapsedTime * 4;
      if (isPowerPellet) {
        pelletRef.current.rotation.x = state.clock.elapsedTime * 2;
      }
    }
    
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const size = isPowerPellet ? 0.15 : 0.06;
  const glowSize = isPowerPellet ? 0.3 : 0.12;

  return (
    <group position={position}>
      {/* Main pellet */}
      <Sphere
        ref={pelletRef}
        args={[size, 8, 8]}
      >
        <meshStandardMaterial 
          color={isPowerPellet ? "#ffff00" : "#ffffff"}
          metalness={0.5}
          roughness={0.2}
          emissive={isPowerPellet ? "#444400" : "#444444"}
          emissiveIntensity={0.4}
        />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere
        ref={glowRef}
        args={[glowSize, 6, 6]}
      >
        <meshBasicMaterial 
          color={isPowerPellet ? "#ffff88" : "#ffffff"}
          transparent
          opacity={0.3}
        />
      </Sphere>
      
      {/* Power pellet extra effects */}
      {isPowerPellet && (
        <>
          <Torus
            args={[0.2, 0.02, 8, 16]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <meshBasicMaterial 
              color="#ffff00"
              transparent
              opacity={0.6}
            />
          </Torus>
          
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <Sphere
                key={i}
                position={[
                  Math.cos(angle) * 0.3,
                  Math.sin(angle) * 0.3,
                  0
                ]}
                args={[0.02, 4, 4]}
              >
                <meshBasicMaterial 
                  color="#ffffff"
                  transparent
                  opacity={0.8}
                />
              </Sphere>
            );
          })}
        </>
      )}
    </group>
  );
};

interface MazeWallProps {
  position: [number, number, number];
  size: [number, number, number];
}

export const EnhancedMazeWall = ({ position, size }: MazeWallProps) => {
  const wallRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (wallRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      const material = wallRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = intensity * 0.1;
    }
  });

  return (
    <Box
      ref={wallRef}
      position={position}
      args={size}
    >
      <meshStandardMaterial 
        color="#0066ff"
        metalness={0.6}
        roughness={0.3}
        emissive="#002244"
        emissiveIntensity={0.1}
      />
    </Box>
  );
};

interface ScoreEffectProps {
  position: [number, number, number];
  score: number;
  visible: boolean;
}

export const ScoreEffect = ({ position, score, visible }: ScoreEffectProps) => {
  const textRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (textRef.current && visible) {
      textRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.5 + 1;
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.3;
      
      const opacity = Math.max(0, 1 - (state.clock.elapsedTime % 2) / 2);
      textRef.current.children.forEach((child: any) => {
        if (child.material) {
          child.material.opacity = opacity;
        }
      });
    }
  });

  if (!visible) return null;

  return (
    <group ref={textRef} position={position}>
      {/* Score text background */}
      <Box args={[1, 0.3, 0.1]}>
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.7}
        />
      </Box>
      
      {/* Score value display */}
      <Box args={[0.8, 0.2, 0.05]} position={[0, 0, 0.05]}>
        <meshBasicMaterial 
          color="#ffff00"
          transparent
          opacity={1}
        />
      </Box>
    </group>
  );
};