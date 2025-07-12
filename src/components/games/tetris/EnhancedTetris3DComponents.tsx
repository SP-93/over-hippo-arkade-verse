import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, RoundedBox } from "@react-three/drei";
import { Enhanced3DErrorBoundary } from "@/components/Enhanced3DErrorBoundary";
import * as THREE from "three";

interface TetrisBlockProps {
  position: [number, number, number];
  color: string;
  type?: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  falling?: boolean;
}

export const EnhancedTetrisBlock = ({ position, color, type = 'I', falling = false }: TetrisBlockProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (falling) {
        meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
        meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
      }
    }
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
    }
  });

  const getEmissiveColor = (baseColor: string) => {
    const colorMap: { [key: string]: string } = {
      '#ff0000': '#440000',
      '#00ff00': '#004400', 
      '#0000ff': '#000044',
      '#ffff00': '#444400',
      '#ff00ff': '#440044',
      '#00ffff': '#004444',
      '#ff8800': '#441100'
    };
    return colorMap[baseColor] || '#222222';
  };

  return (
    <group position={position}>
      {/* Main block */}
      <RoundedBox
        ref={meshRef}
        args={[0.9, 0.9, 0.9]}
        radius={0.05}
        smoothness={4}
      >
        <meshStandardMaterial 
          color={color}
          metalness={0.4}
          roughness={0.3}
          emissive={getEmissiveColor(color)}
          emissiveIntensity={0.2}
        />
      </RoundedBox>
      
      {/* Glow effect */}
      <Box
        ref={glowRef}
        args={[1.1, 1.1, 1.1]}
      >
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.1}
        />
      </Box>
      
      {/* Inner highlight */}
      <Box args={[0.7, 0.7, 0.7]}>
        <meshBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0.3}
        />
      </Box>
      
      {/* Corner details */}
      {[
        [-0.3, -0.3, 0.45],
        [0.3, -0.3, 0.45],
        [0.3, 0.3, 0.45],
        [-0.3, 0.3, 0.45]
      ].map(([x, y, z], i) => (
        <Box
          key={i}
          position={[x, y, z]}
          args={[0.1, 0.1, 0.1]}
        >
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.6}
          />
        </Box>
      ))}
    </group>
  );
};

interface TetrisGameFieldProps {
  width: number;
  height: number;
  grid: (string | null)[][];
}

export const EnhancedTetrisGameField = ({ width, height, grid }: TetrisGameFieldProps) => {
  const fieldRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (fieldRef.current) {
      const intensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      fieldRef.current.children.forEach((child: any) => {
        if (child.userData.isWall && child.material) {
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = intensity;
        }
      });
    }
  });

  return (
    <group ref={fieldRef}>
      {/* Game field boundaries */}
      {/* Left wall */}
      <Box
        position={[-width/2 - 0.5, height/2, 0]}
        args={[0.2, height + 1, 1]}
        userData={{ isWall: true }}
      >
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.3}
        />
      </Box>
      
      {/* Right wall */}
      <Box
        position={[width/2 + 0.5, height/2, 0]}
        args={[0.2, height + 1, 1]}
        userData={{ isWall: true }}
      >
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.3}
        />
      </Box>
      
      {/* Bottom wall */}
      <Box
        position={[0, -0.5, 0]}
        args={[width + 1, 0.2, 1]}
        userData={{ isWall: true }}
      >
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.5}
        />
      </Box>
      
      {/* Grid lines */}
      {Array.from({ length: width + 1 }, (_, x) => (
        <Box
          key={`grid-v-${x}`}
          position={[x - width/2, height/2, -0.1]}
          args={[0.02, height, 0.02]}
        >
          <meshBasicMaterial 
            color="#444444"
            transparent
            opacity={0.3}
          />
        </Box>
      ))}
      
      {Array.from({ length: height + 1 }, (_, y) => (
        <Box
          key={`grid-h-${y}`}
          position={[0, y, -0.1]}
          args={[width, 0.02, 0.02]}
        >
          <meshBasicMaterial 
            color="#444444"
            transparent
            opacity={0.3}
          />
        </Box>
      ))}
      
      {/* Placed blocks */}
      {grid.map((row, y) =>
        row.map((cell, x) => 
          cell ? (
            <EnhancedTetrisBlock
              key={`${x}-${y}`}
              position={[x - width/2 + 0.5, height - y - 0.5, 0]}
              color={cell}
            />
          ) : null
        )
      )}
    </group>
  );
};

interface LineCompleteEffectProps {
  lines: number[];
  width: number;
  height: number;
}

export const LineCompleteEffect = ({ lines, width, height }: LineCompleteEffectProps) => {
  const effectRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (effectRef.current) {
      const intensity = Math.sin(state.clock.elapsedTime * 20) * 0.5 + 0.5;
      effectRef.current.children.forEach((child: any) => {
        if (child.material) {
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = intensity;
        }
      });
    }
  });

  return (
    <group ref={effectRef}>
      {lines.map((lineY) => (
        <group key={lineY}>
          {/* Line highlight */}
          <Box
            position={[0, height - lineY - 0.5, 0.1]}
            args={[width, 0.8, 0.1]}
          >
            <meshBasicMaterial 
              color="#ffffff"
              transparent
              opacity={0.8}
            />
          </Box>
          
          {/* Particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <Box
              key={i}
              position={[
                (Math.random() - 0.5) * width,
                height - lineY - 0.5,
                Math.random() * 2
              ]}
              args={[0.1, 0.1, 0.1]}
            >
              <meshBasicMaterial 
                color="#ffff00"
                transparent
                opacity={0.8}
              />
            </Box>
          ))}
        </group>
      ))}
    </group>
  );
};

interface NextPieceDisplayProps {
  piece: {
    shape: number[][];
    color: string;
  } | null;
}

export const NextPieceDisplay = ({ piece }: NextPieceDisplayProps) => {
  const displayRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (displayRef.current) {
      displayRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  if (!piece) return null;

  return (
    <group ref={displayRef} position={[8, 15, 0]}>
      {/* Display frame */}
      <Box
        position={[0, 0, -0.5]}
        args={[4, 4, 0.1]}
      >
        <meshBasicMaterial 
          color="#333333"
          transparent
          opacity={0.8}
        />
      </Box>
      
      {/* Next piece blocks */}
      {piece.shape.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <EnhancedTetrisBlock
              key={`next-${x}-${y}`}
              position={[x - 1.5, 1.5 - y, 0]}
              color={piece.color}
              falling={true}
            />
          ) : null
        )
      )}
      
      {/* "NEXT" label indicator */}
      <Box
        position={[-1.5, 2.5, 0]}
        args={[2, 0.3, 0.1]}
      >
        <meshBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </Box>
    </group>
  );
};

interface Enhanced3DTetrisUIProps {
  score: number;
  level: number;
  lines: number;
  isPaused: boolean;
  nextPiece?: any;
  onRestart: () => void;
}

export const Enhanced3DTetrisUI = ({ score, level, lines, isPaused, nextPiece, onRestart }: Enhanced3DTetrisUIProps) => {
  return (
    <Enhanced3DErrorBoundary gameId="tetris">
      <group position={[0, 0, 0]}>
        {/* Score display as simple boxes */}
        <group position={[-15, 8, 0]}>
          <Box args={[2, 0.5, 0.1]}>
            <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
          </Box>
        </group>
        
        {/* Level display */}
        <group position={[-15, 5, 0]}>
          <Box args={[2, 0.5, 0.1]}>
            <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
          </Box>
        </group>
        
        {/* Lines display */}
        <group position={[-15, 2, 0]}>
          <Box args={[2, 0.5, 0.1]}>
            <meshBasicMaterial color="#ff00ff" transparent opacity={0.8} />
          </Box>
        </group>
        
        {/* Next piece preview placeholder */}
        <group position={[-15, -2, 0]}>
          <Box args={[2, 2, 0.1]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </Box>
        </group>
        
        {/* Pause overlay */}
        {isPaused && (
          <group position={[0, 0, 2]}>
            <Box args={[10, 6, 0.1]}>
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </Box>
          </group>
        )}
      </group>
    </Enhanced3DErrorBoundary>
  );
};