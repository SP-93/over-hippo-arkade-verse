import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { globalWebGLManager } from '@/utils/webglContextManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface WebGLMonitorProps {
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

function WebGLMonitor({ onContextLost, onContextRestored }: WebGLMonitorProps) {
  const { gl } = useThree();
  const [contextStatus, setContextStatus] = useState<'ok' | 'lost' | 'error'>('ok');

  useEffect(() => {
    if (gl?.domElement) {
      globalWebGLManager.attachToCanvas(gl.domElement);
    }

    const handleContextLost = () => {
      console.warn('🔥 WebGL context lost in 3D game');
      setContextStatus('lost');
      toast.error('3D graphics context lost. Attempting recovery...');
      onContextLost?.();
    };

    const handleContextRestored = () => {
      console.log('✨ WebGL context restored in 3D game');
      setContextStatus('ok');
      toast.success('3D graphics context restored!');
      onContextRestored?.();
    };

    const handleWebGLError = (event: Event) => {
      console.error('❌ WebGL error:', event);
      setContextStatus('error');
    };

    window.addEventListener('webglContextLost', handleContextLost);
    window.addEventListener('webglContextRestored', handleContextRestored);
    
    if (gl?.domElement) {
      gl.domElement.addEventListener('webglcontextlost', handleContextLost);
      gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
    }

    return () => {
      window.removeEventListener('webglContextLost', handleContextLost);
      window.removeEventListener('webglContextRestored', handleContextRestored);
      
      if (gl?.domElement) {
        gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
        gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, [gl, onContextLost, onContextRestored]);

  if (contextStatus === 'lost') {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">3D Context Lost</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Recovering 3D graphics...
          </p>
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </Card>
      </div>
    );
  }

  if (contextStatus === 'error') {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">3D Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            3D graphics error occurred.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Game
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}

interface Enhanced3DCanvasProps {
  children: React.ReactNode;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  className?: string;
}

export const Enhanced3DCanvas = ({ 
  children, 
  onContextLost, 
  onContextRestored,
  className = "w-full h-96"
}: Enhanced3DCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderingError, setRenderingError] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalWebGLError = (event: ErrorEvent) => {
      if (event.message.includes('WebGL') || event.message.includes('THREE')) {
        console.error('🚨 Global WebGL/Three.js error:', event);
        setRenderingError('3D rendering error occurred');
      }
    };

    window.addEventListener('error', handleGlobalWebGLError);
    return () => window.removeEventListener('error', handleGlobalWebGLError);
  }, []);

  if (renderingError) {
    return (
      <Card className={`${className} flex items-center justify-center bg-gradient-card border-destructive`}>
        <div className="text-center p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">3D Rendering Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{renderingError}</p>
          <Button 
            onClick={() => {
              setRenderingError(null);
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 5, 10], fov: 60 }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          console.log('🎮 3D Canvas created successfully');
          // Attach WebGL manager to the canvas
          globalWebGLManager.attachToCanvas(gl.domElement);
        }}
        onError={(error) => {
          console.error('❌ Canvas error:', error);
          setRenderingError('Failed to initialize 3D canvas');
        }}
      >
        <WebGLMonitor 
          onContextLost={onContextLost}
          onContextRestored={onContextRestored}
        />
        {children}
      </Canvas>
    </div>
  );
};