import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// Enhanced Ball Component with Trails
export const EnhancedBall3D = ({ 
  position, 
  radius = 0.3,
  glowing = false
}: { 
  position: [number, number, number];
  radius?: number;
  glowing?: boolean;
}) => {
  const ballRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ballRef.current) {
      ballRef.current.position.set(...position);
      ballRef.current.rotation.x = state.clock.elapsedTime * 4;
      ballRef.current.rotation.y = state.clock.elapsedTime * 3;
    }
    
    if (trailRef.current) {
      const trail = Math.sin(state.clock.elapsedTime * 8) * 0.2 + 0.8;
      trailRef.current.scale.setScalar(trail);
    }
  });

  return (
    <group ref={ballRef}>
      {/* Main ball */}
      <Sphere args={[radius, 16, 16]} castShadow>
        <meshStandardMaterial 
          color={glowing ? "#FFD700" : "#FF6B35"}
          metalness={0.8} 
          roughness={0.1}
          emissive={glowing ? "#FFD700" : "#FF6B35"}
          emissiveIntensity={glowing ? 0.5 : 0.3}
        />
      </Sphere>
      
      {/* Trail effect */}
      <group ref={trailRef}>
        <Sphere args={[radius * 1.2, 12, 12]}>
          <meshBasicMaterial 
            color="#FFD700" 
            transparent 
            opacity={0.3}
          />
        </Sphere>
      </group>
      
      {/* Core glow */}
      <Sphere args={[radius * 0.6, 8, 8]}>
        <meshBasicMaterial 
          color="#FFFFFF" 
          transparent 
          opacity={0.8}
        />
      </Sphere>
    </group>
  );
};

// Enhanced Paddle with Energy Effects
export const EnhancedPaddle3D = ({ 
  position, 
  size,
  powered = false
}: { 
  position: [number, number, number];
  size: [number, number, number];
  powered?: boolean;
}) => {
  const paddleRef = useRef<THREE.Group>(null);
  const energyRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (paddleRef.current) {
      paddleRef.current.position.set(...position);
      
      if (powered) {
        const glow = Math.sin(state.clock.elapsedTime * 5) * 0.1 + 1;
        paddleRef.current.scale.setScalar(glow);
      }
    }
    
    if (energyRef.current && powered) {
      energyRef.current.rotation.z = state.clock.elapsedTime * 3;
    }
  });

  return (
    <group ref={paddleRef}>
      {/* Main paddle body */}
      <Box args={size} castShadow receiveShadow>
        <meshStandardMaterial 
          color={powered ? "#00ff41" : "#4A90E2"}
          metalness={0.6} 
          roughness={0.2}
          emissive={powered ? "#004411" : "#1A4A8A"}
          emissiveIntensity={powered ? 0.4 : 0.2}
        />
      </Box>
      
      {/* Energy field when powered */}
      {powered && (
        <group ref={energyRef}>
          <Box args={[size[0] * 1.1, size[1] * 1.1, size[2] * 1.1]}>
            <meshBasicMaterial 
              color="#00ff41" 
              transparent 
              opacity={0.3}
            />
          </Box>
        </group>
      )}
      
      {/* Paddle surface details */}
      <Box args={[size[0] * 0.9, size[1] * 0.1, size[2] * 0.9]} position={[0, size[1] * 0.4, 0]}>
        <meshStandardMaterial 
          color="#87CEEB" 
          metalness={0.9} 
          roughness={0.1}
        />
      </Box>
      
      {/* Grip texture */}
      {Array.from({ length: 5 }, (_, i) => (
        <Box 
          key={i}
          args={[size[0] * 0.05, size[1] * 0.2, size[2] * 0.8]} 
          position={[(i - 2) * size[0] * 0.15, size[1] * 0.3, 0]}
        >
          <meshStandardMaterial color="#2E5B9A" />
        </Box>
      ))}
    </group>
  );
};

// Enhanced Brick with Damage States
export const EnhancedBrick3D = ({ 
  position, 
  size, 
  color, 
  health, 
  maxHealth,
  destroyed = false
}: { 
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  health: number;
  maxHealth: number;
  destroyed?: boolean;
}) => {
  const brickRef = useRef<THREE.Group>(null);
  const damageRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (brickRef.current && !destroyed) {
      const healthRatio = health / maxHealth;
      const damage = 1 - healthRatio;
      
      // Shake when damaged
      if (damage > 0.5) {
        brickRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 20) * damage * 0.1;
        brickRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 15) * damage * 0.1;
      } else {
        brickRef.current.position.set(...position);
      }
      
      brickRef.current.rotation.x = damage * Math.sin(state.clock.elapsedTime * 10) * 0.1;
      brickRef.current.rotation.z = damage * Math.cos(state.clock.elapsedTime * 8) * 0.1;
    }
    
    if (damageRef.current) {
      damageRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  if (destroyed) return null;

  const healthRatio = health / maxHealth;
  const opacity = Math.max(0.3, healthRatio);

  return (
    <group ref={brickRef}>
      {/* Main brick */}
      <Box args={size} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color}
          metalness={0.3} 
          roughness={0.4}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </Box>
      
      {/* Damage cracks */}
      {healthRatio < 0.7 && (
        <group ref={damageRef}>
          <Box args={[size[0] * 1.02, size[1] * 1.02, size[2] * 1.02]}>
            <meshBasicMaterial color="#000000" transparent opacity={0.2} />
          </Box>
          
          {/* Crack lines */}
          {Array.from({ length: Math.floor((1 - healthRatio) * 5) }, (_, i) => (
            <Box 
              key={i}
              args={[size[0] * 0.8, 0.02, 0.02]} 
              position={[
                0, 
                (Math.random() - 0.5) * size[1], 
                size[2] * 0.51
              ]}
              rotation={[0, 0, Math.random() * Math.PI]}
            >
              <meshBasicMaterial color="#333333" />
            </Box>
          ))}
        </group>
      )}
      
      {/* Sparks when heavily damaged */}
      {healthRatio < 0.3 && (
        <group>
          {Array.from({ length: 3 }, (_, i) => (
            <Sphere 
              key={i}
              args={[0.02, 4, 4]} 
              position={[
                (Math.random() - 0.5) * size[0],
                (Math.random() - 0.5) * size[1],
                size[2] * 0.6
              ]}
            >
              <meshStandardMaterial 
                color="#FFD23F" 
                emissive="#FFD23F" 
                emissiveIntensity={1}
              />
            </Sphere>
          ))}
        </group>
      )}
      
      {/* Metallic edge details */}
      {[
        { pos: [size[0] * 0.5, 0, 0], rot: [0, 0, Math.PI / 2] },
        { pos: [-size[0] * 0.5, 0, 0], rot: [0, 0, Math.PI / 2] },
        { pos: [0, size[1] * 0.5, 0], rot: [Math.PI / 2, 0, 0] },
        { pos: [0, -size[1] * 0.5, 0], rot: [Math.PI / 2, 0, 0] }
      ].map((edge, i) => (
        <Cylinder 
          key={i}
          args={[0.02, 0.02, size[2], 8]} 
          position={edge.pos as [number, number, number]}
          rotation={edge.rot as [number, number, number]}
        >
          <meshStandardMaterial color="#888888" metalness={0.9} />
        </Cylinder>
      ))}
    </group>
  );
};

// Enhanced Power-up with Animation
export const EnhancedPowerUp3D = ({ 
  position, 
  type, 
  collected = false
}: { 
  position: [number, number, number];
  type: 'multi-ball' | 'big-paddle' | 'slow-ball' | 'extra-life';
  collected?: boolean;
}) => {
  const powerUpRef = useRef<THREE.Group>(null);
  const iconRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (powerUpRef.current && !collected) {
      powerUpRef.current.position.set(...position);
      powerUpRef.current.rotation.y = state.clock.elapsedTime * 3;
      
      const float = Math.sin(state.clock.elapsedTime * 4) * 0.2;
      powerUpRef.current.position.y = position[1] + float;
      
      const scale = Math.sin(state.clock.elapsedTime * 5) * 0.2 + 1;
      powerUpRef.current.scale.setScalar(scale);
    }
    
    if (iconRef.current) {
      iconRef.current.rotation.x = state.clock.elapsedTime * 2;
    }
  });

  if (collected) return null;

  const getColor = () => {
    switch (type) {
      case 'multi-ball': return "#ff3366";
      case 'big-paddle': return "#33ff66";
      case 'slow-ball': return "#3366ff";
      case 'extra-life': return "#ff6633";
      default: return "#ffffff";
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'multi-ball':
        return (
          <group>
            <Sphere args={[0.1, 8, 8]} position={[-0.1, 0, 0]}>
              <meshBasicMaterial color="#ffffff" />
            </Sphere>
            <Sphere args={[0.1, 8, 8]} position={[0.1, 0, 0]}>
              <meshBasicMaterial color="#ffffff" />
            </Sphere>
          </group>
        );
      case 'big-paddle':
        return (
          <Box args={[0.4, 0.05, 0.1]}>
            <meshBasicMaterial color="#ffffff" />
          </Box>
        );
      case 'slow-ball':
        return (
          <group>
            <Sphere args={[0.08, 8, 8]}>
              <meshBasicMaterial color="#ffffff" />
            </Sphere>
            {Array.from({ length: 4 }, (_, i) => (
              <Box 
                key={i}
                args={[0.02, 0.15, 0.02]} 
                position={[
                  Math.cos(i * Math.PI / 2) * 0.15,
                  0,
                  Math.sin(i * Math.PI / 2) * 0.15
                ]}
              >
                <meshBasicMaterial color="#ffffff" />
              </Box>
            ))}
          </group>
        );
      case 'extra-life':
        return (
          <group>
            <Sphere args={[0.1, 8, 8]} position={[0, 0.05, 0]}>
              <meshBasicMaterial color="#ff0000" />
            </Sphere>
            <Box args={[0.15, 0.08, 0.05]} position={[0, -0.05, 0]}>
              <meshBasicMaterial color="#ff0000" />
            </Box>
          </group>
        );
      default:
        return <Sphere args={[0.1, 8, 8]}><meshBasicMaterial color="#ffffff" /></Sphere>;
    }
  };

  return (
    <group ref={powerUpRef}>
      {/* Main power-up sphere */}
      <Sphere args={[0.25, 12, 12]} castShadow>
        <meshStandardMaterial 
          color={getColor()}
          metalness={0.8} 
          roughness={0.1}
          emissive={getColor()}
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
        />
      </Sphere>
      
      {/* Icon inside */}
      <group ref={iconRef}>
        {getIcon()}
      </group>
      
      {/* Energy field */}
      <Sphere args={[0.35, 8, 8]}>
        <meshBasicMaterial 
          color={getColor()}
          transparent 
          opacity={0.2}
        />
      </Sphere>
      
      {/* Particle ring */}
      {Array.from({ length: 8 }, (_, i) => (
        <Sphere 
          key={i}
          args={[0.02, 4, 4]} 
          position={[
            Math.cos(i * Math.PI / 4) * 0.4,
            Math.sin(i * Math.PI / 4) * 0.4,
            0
          ]}
        >
              <meshStandardMaterial 
                color={getColor()}
                emissive={getColor()}
                emissiveIntensity={0.8}
              />
        </Sphere>
      ))}
    </group>
  );
};

// Destruction Effect
export const BrickDestructionEffect3D = ({ 
  position, 
  color 
}: { 
  position: [number, number, number];
  color: string;
}) => {
  const effectRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (effectRef.current) {
      const scale = Math.max(0, 2 - state.clock.elapsedTime * 2);
      effectRef.current.scale.setScalar(scale);
      effectRef.current.rotation.y = state.clock.elapsedTime * 5;
    }
  });

  return (
    <group ref={effectRef} position={position}>
      {/* Main explosion */}
      <Sphere args={[0.5, 12, 8]}>
        <meshBasicMaterial 
          color={color}
          transparent 
          opacity={0.8}
        />
      </Sphere>
      
      {/* Fragments */}
      {Array.from({ length: 12 }, (_, i) => (
        <Box 
          key={i}
          args={[0.1, 0.1, 0.1]} 
          position={[
            Math.cos(i * Math.PI / 6) * 2,
            Math.sin(i * Math.PI / 6) * 2,
            (Math.random() - 0.5) * 2
          ]}
        >
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </Box>
      ))}
    </group>
  );
};