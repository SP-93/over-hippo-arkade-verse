import { useEffect, useState } from 'react';
import hippoCharacter from '@/assets/hippo-character.png';
import hippoFloat from '@/assets/hippo-float.png';

interface TetrisBackgroundProps {
  score: number;
  level: number;
  lines: number;
}

export const TetrisBackground = ({ score, level, lines }: TetrisBackgroundProps) => {
  const [hippos, setHippos] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    type: 'character' | 'float'; 
    delay: number;
    celebration: boolean;
  }>>([]);

  useEffect(() => {
    // Create hippos based on score and level
    const numHippos = Math.min(2 + Math.floor(level / 2), 6);
    const newHippos = Array.from({ length: numHippos }, (_, i) => ({
      id: i,
      x: -100 - (i * 50),
      y: 10 + (i * 15) % 80,
      type: (i % 2 === 0 ? 'character' : 'float') as 'character' | 'float',
      delay: i * 3,
      celebration: false
    }));
    setHippos(newHippos);
  }, [level]);

  // Trigger celebration when lines are cleared
  useEffect(() => {
    if (lines > 0 && lines % 5 === 0) {
      setHippos(prev => prev.map(hippo => ({ ...hippo, celebration: true })));
      setTimeout(() => {
        setHippos(prev => prev.map(hippo => ({ ...hippo, celebration: false })));
      }, 2000);
    }
  }, [lines]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
      {hippos.map((hippo) => (
        <div
          key={hippo.id}
          className={`absolute transition-all duration-500 ${
            hippo.celebration ? 'animate-bounce scale-125' : 'animate-drift'
          }`}
          style={{
            left: `${hippo.x}px`,
            top: `${hippo.y}%`,
            animationDelay: `${hippo.delay}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        >
          <img
            src={hippo.type === 'character' ? hippoCharacter : hippoFloat}
            alt="Hippo character"
            className={`w-12 h-12 ${hippo.type === 'float' ? 'animate-float' : ''} ${
              hippo.celebration ? 'drop-shadow-xl' : 'drop-shadow-lg'
            }`}
            style={{
              filter: hippo.celebration 
                ? 'drop-shadow(0 0 20px hsl(var(--primary))) brightness(1.2)'
                : 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))',
              animationDelay: hippo.type === 'float' ? `${hippo.delay * 0.5}s` : undefined,
            }}
          />
        </div>
      ))}
      
      {/* Floating score particles */}
      {score > 0 && Array.from({ length: Math.min(Math.floor(score / 1000), 8) }).map((_, i) => (
        <div
          key={`score-particle-${i}`}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Subtle interactive grid background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'gradient-shift 10s ease infinite'
          }}
        />
      </div>
    </div>
  );
};