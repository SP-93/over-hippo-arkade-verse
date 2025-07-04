import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameManager } from "@/hooks/useGameManager";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { toast } from "sonner";

const GRID_SIZE = 25;
const INITIAL_SNAKE = [{ x: 12, y: 12 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

interface UltraSnake2025Props {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  hue: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.life = 1;
    this.maxLife = 30 + Math.random() * 30;
    this.size = 2 + Math.random() * 4;
    this.color = color;
    this.hue = Math.random() * 360;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= 1;
    this.hue += 2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

export const UltraSnake2025 = ({ onScoreChange, onGameEnd, onGameStart }: UltraSnake2025Props = {}) => {
  console.log("UltraSnake2025 loaded - Modern neon version active!");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 18, y: 18 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentHue, setCurrentHue] = useState(200);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();
  
  const { 
    playerChips, 
    currentLives, 
    chipManager, 
    hasGameStarted, 
    loseLife, 
    handleGameStart, 
    gameStatus 
  } = useGameManager();

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const createParticleExplosion = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push(new Particle(x, y, color));
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const drawNeonGrid = useCallback((ctx: CanvasRenderingContext2D, cellSize: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 255, 200, 0.3)';
    ctx.shadowBlur = 2;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * cellSize;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, GRID_SIZE * cellSize);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(GRID_SIZE * cellSize, pos);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }, []);

  const drawGlowingSnake = useCallback((ctx: CanvasRenderingContext2D, cellSize: number) => {
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const isHead = index === 0;
      
      // Main body with gradient
      const gradient = ctx.createRadialGradient(
        x + cellSize/2, y + cellSize/2, 0,
        x + cellSize/2, y + cellSize/2, cellSize/2
      );
      
      if (isHead) {
        gradient.addColorStop(0, `hsl(${currentHue}, 100%, 80%)`);
        gradient.addColorStop(0.7, `hsl(${currentHue}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${currentHue}, 100%, 20%)`);
      } else {
        const alpha = 1 - (index / snake.length) * 0.5;
        gradient.addColorStop(0, `hsla(${currentHue}, 100%, 60%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${currentHue}, 100%, 30%, ${alpha})`);
      }
      
      // Outer glow
      ctx.shadowColor = `hsl(${currentHue}, 100%, 50%)`;
      ctx.shadowBlur = isHead ? 25 : 15;
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      // Inner highlight for head
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `hsla(${currentHue}, 100%, 90%, 0.8)`;
        ctx.fillRect(x + cellSize/3, y + cellSize/3, cellSize/3, cellSize/3);
      }
    });
    ctx.shadowBlur = 0;
  }, [snake, currentHue]);

  const drawPulsatingFood = useCallback((ctx: CanvasRenderingContext2D, cellSize: number) => {
    const x = food.x * cellSize;
    const y = food.y * cellSize;
    const time = Date.now() * 0.005;
    const pulse = 1 + Math.sin(time * 3) * 0.3;
    const size = (cellSize * 0.8) * pulse;
    const offset = (cellSize - size) / 2;
    
    // Multiple glow layers
    for (let i = 3; i >= 0; i--) {
      const layerSize = size + i * 4;
      const layerOffset = (cellSize - layerSize) / 2;
      const alpha = (4 - i) / 4;
      
      ctx.shadowColor = `hsla(${(currentHue + 180) % 360}, 100%, 50%, ${alpha})`;
      ctx.shadowBlur = 20 + i * 5;
      ctx.fillStyle = `hsla(${(currentHue + 180) % 360}, 100%, 60%, ${alpha})`;
      
      ctx.beginPath();
      ctx.arc(x + cellSize/2, y + cellSize/2, layerSize/2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }, [food, currentHue]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellSize = Math.min(canvas.width, canvas.height) / GRID_SIZE;
    
    // Desert/Nature theme background
    const time = Date.now() * 0.0005;
    
    // Sky gradient (desert sunset theme)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
    skyGradient.addColorStop(0, `hsl(${45 + Math.sin(time) * 10}, 70%, 60%)`); // Sunset orange
    skyGradient.addColorStop(0.6, `hsl(${25 + Math.sin(time) * 5}, 60%, 45%)`); // Deep orange
    skyGradient.addColorStop(1, `hsl(${10}, 50%, 30%)`); // Dark red-brown
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
    
    // Ground gradient (sandy desert)
    const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
    groundGradient.addColorStop(0, `hsl(45, 60%, 70%)`); // Light sand
    groundGradient.addColorStop(0.5, `hsl(40, 50%, 60%)`); // Medium sand
    groundGradient.addColorStop(1, `hsl(35, 40%, 45%)`); // Dark sand
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);
    
    // Add floating sand particles
    ctx.fillStyle = 'rgba(255, 220, 150, 0.3)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 37 + time * 20) % canvas.width;
      const y = canvas.height * 0.4 + Math.sin(time * 2 + i) * 30;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.sin(i + time * 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add cacti silhouettes
    ctx.fillStyle = 'rgba(50, 80, 40, 0.6)';
    for (let i = 0; i < 8; i++) {
      const x = (i * 80 + 40) % canvas.width;
      const y = canvas.height * 0.3;
      const height = 40 + Math.sin(i) * 20;
      
      // Cactus body
      ctx.fillRect(x - 8, y, 16, height);
      
      // Cactus arms
      if (i % 2 === 0) {
        ctx.fillRect(x - 20, y + height * 0.3, 12, 20);
        ctx.fillRect(x + 8, y + height * 0.6, 12, 15);
      }
    }
    
    drawNeonGrid(ctx, cellSize);
    drawGlowingSnake(ctx, cellSize);
    drawPulsatingFood(ctx, cellSize);
    
    // Update and draw particles
    setParticles(prev => {
      const updated = prev.map(p => {
        p.update();
        p.draw(ctx);
        return p;
      }).filter(p => !p.isDead());
      return updated;
    });
    
    // Game over effect
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowColor = '#ff0040';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ff0040';
      ctx.font = 'bold 48px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
      
      ctx.shadowColor = '#00ff80';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00ff80';
      ctx.font = 'bold 24px Orbitron, monospace';
      ctx.fillText(`SCORE: ${score}`, canvas.width/2, canvas.height/2 + 30);
      ctx.shadowBlur = 0;
    }
    
    if (isPaused && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 36px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
      ctx.shadowBlur = 0;
    }
  }, [snake, food, currentHue, particles, gameOver, isPaused, score, drawNeonGrid, drawGlowingSnake, drawPulsatingFood]);

  const checkCollision = useCallback((head: any) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Self collision
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;
      
      if (checkCollision(head)) {
        if (!loseLife()) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd?.();
          // Explosion effect on death
          const canvas = canvasRef.current;
          if (canvas) {
            const cellSize = Math.min(canvas.width, canvas.height) / GRID_SIZE;
            createParticleExplosion(
              head.x * cellSize + cellSize/2,
              head.y * cellSize + cellSize/2,
              `hsl(${currentHue}, 100%, 50%)`
            );
          }
          toast.error("Game Over! Sve živote ste izgubili!");
        } else {
          // Reset snake position but keep game running
          setSnake(INITIAL_SNAKE);
          setDirection(INITIAL_DIRECTION);
          setFood({ x: 18, y: 18 });
        }
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood());
        setSpeed(prev => Math.max(80, prev - 3));
        setCurrentHue(prev => (prev + 30) % 360);
        
        // Food eat particle effect
        const canvas = canvasRef.current;
        if (canvas) {
          const cellSize = Math.min(canvas.width, canvas.height) / GRID_SIZE;
          createParticleExplosion(
            food.x * cellSize + cellSize/2,
            food.y * cellSize + cellSize/2,
            `hsl(${(currentHue + 180) % 360}, 100%, 50%)`
          );
        }
        
        toast.success(`Score: ${newScore}! Speed boost!`);
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, isPlaying, isPaused, gameOver, checkCollision, generateFood, score, onScoreChange, onGameEnd, currentHue, createParticleExplosion]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, gameOver, speed, moveSnake]);

  // Animation loop for smooth rendering
  const animate = useCallback(() => {
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Enhanced keyboard controls with page scroll prevention
  const handleKeyPress = useCallback((keyCode: string) => {
    if (!isPlaying || isPaused || gameOver) return;
    
    switch (keyCode) {
      case 'ArrowUp':
      case 'KeyW':
        if (direction.y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (direction.y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'KeyA':
        if (direction.x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (direction.x !== -1) setDirection({ x: 1, y: 0 });
        break;
      case 'Space':
        setIsPaused(!isPaused);
        break;
    }
  }, [isPlaying, isPaused, gameOver, direction]);

  useKeyboardControls(handleKeyPress, isPlaying && !gameOver);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('snake')) return;
    
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 18, y: 18 });
    setScore(0);
    setSpeed(200);
    setCurrentHue(200);
    setParticles([]);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green font-orbitron">ULTRA SNAKE 2025</h2>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-arcade-gold font-orbitron">SCORE: {score.toString().padStart(4, '0')}</div>
            <div className="text-lg font-bold text-red-500 font-orbitron">LIVES: {currentLives}</div>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={startGame}
            variant="arcade"
            disabled={isPlaying && !gameOver}
            className="font-orbitron"
          >
            {gameOver ? 'RESTART' : 'START GAME'}
          </Button>
          
          {isPlaying && !gameOver && (
            <Button onClick={pauseGame} variant="secondary" className="font-orbitron">
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Button>
          )}
        </div>

        <div className="flex justify-center">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="bg-black rounded-lg border-4 border-neon-green shadow-[0_0_40px_rgba(0,255,0,0.6)]"
              style={{
                imageRendering: 'pixelated',
                filter: 'contrast(1.3) brightness(1.2) saturate(1.4)',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #0a2a0a 50%, #1a4d1a 100%)'
              }}
            />
            <div className="absolute -top-2 -left-2 -right-2 -bottom-2 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-lg opacity-30 animate-pulse-border"></div>
            <div className="absolute top-2 left-2 text-xs font-orbitron text-neon-green/70">128-BIT NEON ENGINE</div>
            <div className="absolute top-2 right-2 text-xs font-orbitron text-arcade-gold/70">SPEED: {Math.round((300-speed)/2)}%</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center font-orbitron">
          WASD or ARROW KEYS • SPACE to PAUSE • COLLECT NEON ORBS • AVOID WALLS & SELF
        </div>
        
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-neon-green/70 font-orbitron">
            <span>SPEED: {Math.round((300-speed)/2)}%</span>
            <span>LENGTH: {snake.length}</span>
            <span>PARTICLES: {particles.length}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};