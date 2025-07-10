import { ReactNode, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Game3DFallback } from "@/components/Game3DFallback";
import { webglDetector } from "@/utils/webglDetector";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldUse3D, setShouldUse3D] = useState(false);
  const [performanceSettings, setPerformanceSettings] = useState(webglDetector.getRecommendedSettings());
  
  // Monitor performance
  const performanceMetrics = usePerformanceMonitor(gameId);

  // Progressive Enhancement: Check WebGL support and capabilities
  useEffect(() => {
    const initializeEngine = () => {
      try {
        console.log(`🎮 Initializing 3D engine for game: ${gameId}`);
        
        const capabilities = webglDetector.detect();
        const canUse3D = webglDetector.shouldUse3D();
        
        console.log(`🔍 WebGL capabilities:`, capabilities);
        console.log(`🎯 3D engine enabled: ${canUse3D}`);
        
        setShouldUse3D(canUse3D);
        setPerformanceSettings(webglDetector.getRecommendedSettings());
        
        if (!canUse3D) {
          console.log(`⚠️ Falling back to 2D mode for ${gameId}`);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error(`❌ 3D engine initialization failed for ${gameId}:`, error);
        setShouldUse3D(false);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeEngine, 100);
    return () => clearTimeout(timer);
  }, [retryCount, gameId]);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    }
  }, [retryCount]);

  const handleBackToArcade = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Handle Canvas errors
  const handleCanvasError = useCallback((error: any) => {
    console.error('Canvas error:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <Game3DFallback loading={true} />;
  }

  if (hasError || !shouldUse3D) {
    return (
      <Game3DFallback 
        error={hasError} 
        retryCount={retryCount}
        onRetry={handleRetry}
        onBackToArcade={handleBackToArcade}
        fallbackMode={!shouldUse3D}
      />
    );
  }
  
  const getLighting = () => {
    switch (lighting) {
      case 'arcade':
        return (
          <>
            <ambientLight intensity={0.8} color="#5C94FC" />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1.0} 
              color="#FFD700"
            />
            <pointLight position={[0, 8, 0]} intensity={0.6} color="#00ff41" />
          </>
        );
      
      case 'atmospheric':
        return (
          <>
            <ambientLight intensity={0.6} color="#4a5568" />
            <directionalLight 
              position={[20, 20, 10]} 
              intensity={0.8} 
              color="#f7fafc"
            />
          </>
        );
      
      case 'retro':
        return (
          <>
            <ambientLight intensity={0.9} color="#ff6b9d" />
            <directionalLight position={[0, 10, 0]} intensity={1.2} color="#45cafc" />
          </>
        );
      
      default:
        return (
          <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
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
        key={`${gameId}-3d-canvas-${retryCount}`}
        camera={{ 
          position: camera.position, 
          fov: camera.fov || 75,
          near: camera.near || 0.1,
          far: camera.far || 1000
        }}
        onCreated={({ gl, scene, camera }) => {
          try {
            console.log(`🎯 3D Canvas created for ${gameId} with settings:`, performanceSettings);
            
            // Apply performance-based settings
            gl.setPixelRatio(Math.min(window.devicePixelRatio, performanceSettings.renderScale));
            gl.shadowMap.enabled = performanceSettings.shadows;
            gl.toneMapping = THREE.NoToneMapping;
            
            // Antialias is set in canvas properties, not renderer
            // The gl.antialias property is read-only
            
            scene.background = new THREE.Color('#000814');
            
            console.log(`✅ 3D Engine initialized for ${gameId} - Performance level: ${webglDetector.detect().performanceLevel}`);
            console.log(`📊 FPS: ${performanceMetrics.fps}, Memory: ${performanceMetrics.memoryUsage}MB`);
            
            onRendererReady?.(gl);
            setIsLoading(false);
          } catch (error) {
            console.error(`❌ 3D Canvas creation failed for ${gameId}:`, error);
            handleCanvasError(error);
          }
        }}
        onError={handleCanvasError}
        gl={{ 
          antialias: performanceSettings.antialias,
          alpha: false,
          powerPreference: performanceSettings.renderScale > 0.8 ? "high-performance" : "default",
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false
        }}
        dpr={1} // Fixed DPR instead of array
        fallback={<Game3DFallback loading={true} />}
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