import { useEffect, useState } from 'react';
import hippoCharacter from '@/assets/hippo-character.png';
import hippoFloat from '@/assets/hippo-float.png';

export const HippoBackground = () => {
  const [hippos, setHippos] = useState<Array<{ id: number; x: number; y: number; type: 'character' | 'float'; delay: number }>>([]);

  useEffect(() => {
    // Create multiple hippos with different positions and delays
    const initialHippos = [
      { id: 1, x: -100, y: 20, type: 'character' as const, delay: 0 },
      { id: 2, x: -200, y: 60, type: 'float' as const, delay: 5 },
      { id: 3, x: -150, y: 80, type: 'character' as const, delay: 10 },
      { id: 4, x: -250, y: 40, type: 'float' as const, delay: 15 },
    ];
    setHippos(initialHippos);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hippos.map((hippo) => (
        <div
          key={hippo.id}
          className="absolute animate-drift opacity-20 hover:opacity-40 transition-opacity duration-500"
          style={{
            left: `${hippo.x}px`,
            top: `${hippo.y}%`,
            animationDelay: `${hippo.delay}s`,
            animationDuration: `${20 + Math.random() * 10}s`,
          }}
        >
          <img
            src={hippo.type === 'character' ? hippoCharacter : hippoFloat}
            alt="Hippo character"
            className={`w-20 h-20 ${hippo.type === 'float' ? 'animate-float' : ''} filter drop-shadow-lg`}
            style={{
              filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))',
              animationDelay: hippo.type === 'float' ? `${hippo.delay * 0.5}s` : undefined,
            }}
          />
        </div>
      ))}
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
    </div>
  );
};