import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'trail' | 'score' | 'glow';
}

interface ParticleSystemConfig {
  maxParticles: number;
  gravity: number;
  fadeSpeed: number;
}

export const useParticleSystem = (config: ParticleSystemConfig = {
  maxParticles: 100,
  gravity: 0.1,
  fadeSpeed: 0.02
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  const createParticle = useCallback((
    x: number, 
    y: number, 
    type: Particle['type'],
    options: Partial<Particle> = {}
  ) => {
    const colors = {
      explosion: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffeaa7'],
      trail: ['#00f5ff', '#ff00ff', '#00ffff'],
      score: ['#ffd700', '#ffff00', '#ffa500'],
      glow: ['#e0aaff', '#c77dff', '#9d4edd']
    };

    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      maxLife: Math.random() * 60 + 30,
      size: Math.random() * 4 + 2,
      color: colors[type][Math.floor(Math.random() * colors[type].length)],
      type,
      ...options
    };

    if (particlesRef.current.length < config.maxParticles) {
      particlesRef.current.push(particle);
    }
  }, [config.maxParticles]);

  const createExplosion = useCallback((x: number, y: number, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 6 + 2;
      createParticle(x, y, 'explosion', {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3
      });
    }
  }, [createParticle]);

  const createTrail = useCallback((x: number, y: number, direction: { x: number; y: number }) => {
    createParticle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, 'trail', {
      vx: direction.x * 0.5 + (Math.random() - 0.5) * 2,
      vy: direction.y * 0.5 + (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      maxLife: 20
    });
  }, [createParticle]);

  const createScoreEffect = useCallback((x: number, y: number, points: number) => {
    const count = Math.min(points / 10, 10);
    for (let i = 0; i < count; i++) {
      createParticle(x, y, 'score', {
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 6 - 2,
        size: Math.random() * 4 + 2,
        maxLife: 40
      });
    }
  }, [createParticle]);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += config.gravity;
      particle.life -= config.fadeSpeed;

      // Particle-specific behavior
      if (particle.type === 'trail') {
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      } else if (particle.type === 'explosion') {
        particle.vx *= 0.95;
        particle.vy *= 0.95;
      }

      // Draw particle
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.save();
      
      // Glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      
      // Draw particle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner bright core
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      return particle.life > 0;
    });
  }, [config.gravity, config.fadeSpeed]);

  const animate = useCallback(() => {
    updateParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const setCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return {
    setCanvas,
    createExplosion,
    createTrail,
    createScoreEffect,
    createParticle
  };
};