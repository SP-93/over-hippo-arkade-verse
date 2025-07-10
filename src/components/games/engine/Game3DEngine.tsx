import { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

interface Game3DEngineProps {
  children: ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  };
  lighting?: 'standard' | 'arcade' | 'atmospheric' | 'retro';
  environment?: 'city' | 'space' | 'forest' | 'abstract';
  enableOrbitControls?: boolean;
  gameId: string;
  onRendererReady?: (renderer: THREE.WebGLRenderer) => void;
}

const Game3DEngine = ({ 
  children, 
  camera = { position: [0, 0, 10], fov: 75 },
  lighting = 'arcade',
  environment = 'abstract',
  enableOrbitControls = true,
  gameId,
  onRendererReady
}: Game3DEngineProps) => {
  
  const getLighting = () => {
    switch (lighting) {
      case 'arcade':
        return (
          <>
            <ambientLight intensity={0.6} color="#5C94FC" />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1.2} 
              color="#FFD700"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[0, 8, 0]} intensity={0.8} color="#00ff41" />
            <pointLight position={[-10, 5, -10]} intensity={0.6} color="#ff3366" />
          </>
        );
      
      case 'atmospheric':
        return (
          <>
            <ambientLight intensity={0.4} color="#4a5568" />
            <directionalLight 
              position={[20, 20, 10]} 
              intensity={1} 
              color="#f7fafc"
              castShadow
            />
            <fog attach="fog" args={['#1a202c', 30, 100]} />
          </>
        );
      
      case 'retro':
        return (
          <>
            <ambientLight intensity={0.8} color="#ff6b9d" />
            <directionalLight position={[0, 10, 0]} intensity={1.5} color="#45cafc" />
            <pointLight position={[10, 0, 10]} intensity={0.7} color="#f093fb" />
            <pointLight position={[-10, 0, -10]} intensity={0.7} color="#45cafc" />
          </>
        );
      
      default:
        return (
          <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          </>
        );
    }
  };

  const getEnvironment = () => {
    switch (environment) {
      case 'city':
        return <Environment preset="city" />;
      case 'space':
        return <Environment preset="night" />;
      case 'forest':
        return <Environment preset="forest" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[600px] bg-black rounded-lg overflow-hidden border-2 border-neon-green shadow-lg shadow-neon-green/20">
      <Canvas
        key={`${gameId}-3d-canvas`}
        camera={{ 
          position: camera.position, 
          fov: camera.fov || 75,
          near: camera.near || 0.1,
          far: camera.far || 1000
        }}
        onCreated={({ gl, scene }) => {
          gl.setSize(600, 600);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
          
          scene.background = new THREE.Color('#000814');
          onRendererReady?.(gl);
        }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        shadows
        fallback={
          <div className="flex items-center justify-center h-full text-neon-green">
            Loading 3D Engine...
          </div>
        }
      >
        {getLighting()}
        {getEnvironment()}
        
        {children}
        
        {enableOrbitControls && (
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            maxPolarAngle={Math.PI * 0.75}
            minDistance={5}
            maxDistance={50}
          />
        )}
      </Canvas>
    </div>
  );
};

export default Game3DEngine;