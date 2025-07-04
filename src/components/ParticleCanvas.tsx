import { useRef, useEffect } from 'react';
import { useParticleSystem } from '@/hooks/useParticleSystem';

interface ParticleCanvasProps {
  width: number;
  height: number;
  className?: string;
  onReady?: (effects: {
    createExplosion: (x: number, y: number, count?: number) => void;
    createTrail: (x: number, y: number, direction: { x: number; y: number }) => void;
    createScoreEffect: (x: number, y: number, points: number) => void;
  }) => void;
}

export const ParticleCanvas = ({ width, height, className = '', onReady }: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, createExplosion, createTrail, createScoreEffect } = useParticleSystem();

  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
      onReady?.({ createExplosion, createTrail, createScoreEffect });
    }
  }, [setCanvas, createExplosion, createTrail, createScoreEffect, onReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};