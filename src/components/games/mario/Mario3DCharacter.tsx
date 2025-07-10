import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Mario3DPlayer } from "./types";

interface Mario3DCharacterProps {
  player: Mario3DPlayer;
  animation: string;
}

export const Mario3DCharacter = ({ player, animation }: Mario3DCharacterProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const hatRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.copy(player.position);
      
      // Enhanced animations
      if (animation === "jump") {
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.2;
      } else if (animation === "run") {
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8) * 0.1;
        if (bodyRef.current) {
          bodyRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 12) * 0.05);
        }
      } else {
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.z = 0;
        if (bodyRef.current) {
          bodyRef.current.scale.setScalar(1);
        }
      }
    }
  });

  const getBodyColor = () => {
    switch (player.powerUp) {
      case 'big': return "#DC143C";
      case 'fire': return "#FF6347";
      default: return "#0066CC";
    }
  };

  const getSize = () => {
    return player.powerUp === 'small' ? 0.8 : 1.2;
  };

  const size = getSize();

  return (
    <group ref={meshRef}>
      {/* Mario's body - rounded cylinder */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[size * 0.4, size * 0.5, size * 0.8, 16]} />
        <meshStandardMaterial 
          color={getBodyColor()}
          metalness={0.1}
          roughness={0.3}
          emissive={getBodyColor()}
          emissiveIntensity={0.05}
        />
      </mesh>
      
      {/* Mario's head - sphere */}
      <mesh position={[0, size * 0.6, 0]} castShadow receiveShadow>
        <sphereGeometry args={[size * 0.35, 16, 16]} />
        <meshStandardMaterial 
          color="#FFDBAC"
          metalness={0}
          roughness={0.4}
        />
      </mesh>
      
      {/* Mario's hat - cone + cylinder */}
      <group ref={hatRef}>
        <mesh position={[0, size * 0.85, 0]} castShadow>
          <cylinderGeometry args={[size * 0.4, size * 0.4, size * 0.2, 16]} />
          <meshStandardMaterial 
            color="#DC143C"
            metalness={0.2}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, size * 0.95, size * 0.2]} castShadow>
          <sphereGeometry args={[size * 0.15, 8, 8]} />
          <meshStandardMaterial 
            color="#FFD700"
            metalness={0.8}
            roughness={0.1}
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      
      {/* Mario's mustache */}
      <mesh position={[0, size * 0.45, size * 0.3]} castShadow>
        <boxGeometry args={[size * 0.3, size * 0.1, size * 0.1]} />
        <meshStandardMaterial 
          color="#8B4513"
          metalness={0}
          roughness={0.8}
        />
      </mesh>
      
      {/* Mario's overalls straps */}
      <mesh position={[0, size * 0.2, 0]} castShadow>
        <boxGeometry args={[size * 0.6, size * 0.1, size * 0.4]} />
        <meshStandardMaterial 
          color="#4169E1"
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      
      {/* Power-up glow effect */}
      {player.powerUp !== 'small' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[size * 0.8, 16, 16]} />
          <meshBasicMaterial 
            color={player.powerUp === 'fire' ? "#FF6347" : "#FFD700"}
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
};