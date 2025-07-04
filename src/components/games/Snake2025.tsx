import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Zap, Trophy } from "lucide-react";

const GRID_SIZE = 25;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 12, y: 12 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

interface Snake2025Props {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'double' | 'magnet' | 'shield';
  duration: number;
}

export const Snake2025 = ({ onScoreChange, onGameEnd, onGameStart }: Snake2025Props = {}) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 20, y: 15 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [combo, setCombo] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<{[key: string]: number}>({});
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const powerUpSpawnRef = useRef<NodeJS.Timeout>();
  const particleEffectsRef = useRef<any>();
  
  const { handleGameStart } = useGameManager();

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

  const spawnPowerUp = useCallback(() => {
    if (powerUps.length >= 2) return; // Max 2 power-ups at once
    
    const types: PowerUp['type'][] = ['speed', 'double', 'magnet', 'shield'];
    let newPowerUp;
    
    do {
      newPowerUp = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        type: types[Math.floor(Math.random() * types.length)],
        duration: 300 // 5 seconds at 60fps
      };
    } while (
      snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
      (newPowerUp.x === food.x && newPowerUp.y === food.y)
    );
    
    setPowerUps(prev => [...prev, newPowerUp]);
  }, [snake, food, powerUps.length]);

  const activatePowerUp = useCallback((type: PowerUp['type']) => {
    setActivePowerUps(prev => ({ ...prev, [type]: 180 })); // 3 seconds
    
    switch (type) {
      case 'speed':
        setSpeed(prev => Math.max(50, prev - 30));
        toast.success("⚡ Speed Boost!", { duration: 1000 });
        break;
      case 'double':
        toast.success("💰 Double Points!", { duration: 1000 });
        break;
      case 'magnet':
        toast.success("🧲 Food Magnet!", { duration: 1000 });
        break;
      case 'shield':
        toast.success("🛡️ Shield Active!", { duration: 1000 });
        break;
    }
  }, []);

  const checkCollision = useCallback((head: any) => {
    // Shield power-up protection
    if (activePowerUps.shield > 0) return false;
    
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake, activePowerUps.shield]);

  const moveSnake = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;
      
      if (checkCollision(head)) {
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd?.();
        
        // Explosion effect at collision point
        if (particleEffectsRef.current) {
          particleEffectsRef.current.createExplosion(
            head.x * CELL_SIZE + CELL_SIZE / 2,
            head.y * CELL_SIZE + CELL_SIZE / 2,
            20
          );
        }
        
        toast.error(`💥 Game Over! Final Score: ${score.toLocaleString()}`);
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        let points = 10;
        
        // Double points power-up
        if (activePowerUps.double > 0) points *= 2;
        
        // Combo system
        const newCombo = combo + 1;
        const comboMultiplier = Math.floor(newCombo / 5) + 1;
        points *= comboMultiplier;
        
        const newScore = score + points;
        setScore(newScore);
        setCombo(newCombo);
        onScoreChange?.(newScore);
        setFood(generateFood());
        
        // Particle effects
        if (particleEffectsRef.current) {
          particleEffectsRef.current.createScoreEffect(
            head.x * CELL_SIZE + CELL_SIZE / 2,
            head.y * CELL_SIZE + CELL_SIZE / 2,
            points
          );
        }
        
        // Speed increase
        setSpeed(prev => Math.max(50, prev - 2));
        
        toast.success(`+${points} Points! ${newCombo > 4 ? `Combo x${comboMultiplier}!` : ''}`, { 
          duration: 800 
        });
      } else {
        newSnake.pop();
        setCombo(0); // Reset combo if no food eaten
      }
      
      // Trail effect for snake head
      if (particleEffectsRef.current && Math.random() < 0.3) {
        particleEffectsRef.current.createTrail(
          head.x * CELL_SIZE + CELL_SIZE / 2,
          head.y * CELL_SIZE + CELL_SIZE / 2,
          { x: -direction.x, y: -direction.y }
        );
      }
      
      return newSnake;
    });

    // Check power-up collisions
    setPowerUps(prev => prev.filter(powerUp => {
      const head = snake[0];
      if (head.x === powerUp.x && head.y === powerUp.y) {
        activatePowerUp(powerUp.type);
        
        // Power-up collection effect
        if (particleEffectsRef.current) {
          particleEffectsRef.current.createExplosion(
            powerUp.x * CELL_SIZE + CELL_SIZE / 2,
            powerUp.y * CELL_SIZE + CELL_SIZE / 2,
            8
          );
        }
        
        return false;
      }
      return true;
    }));

    // Update active power-ups
    setActivePowerUps(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key]--;
        if (updated[key] <= 0) {
          delete updated[key];
          // Reset speed when speed boost ends
          if (key === 'speed') {
            setSpeed(150);
          }
        }
      });
      return updated;
    });

  }, [direction, food, isPlaying, isPaused, gameOver, checkCollision, generateFood, score, combo, snake, activePowerUps, onScoreChange, onGameEnd, activatePowerUp]);

  // Game loops
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, gameOver, speed, moveSnake]);

  // Power-up spawn timer
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      powerUpSpawnRef.current = setInterval(spawnPowerUp, 8000); // Every 8 seconds
    } else {
      if (powerUpSpawnRef.current) clearInterval(powerUpSpawnRef.current);
    }
    
    return () => {
      if (powerUpSpawnRef.current) clearInterval(powerUpSpawnRef.current);
    };
  }, [isPlaying, isPaused, gameOver, spawnPowerUp]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPlaying, isPaused, gameOver]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('snake')) return;
    
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 20, y: 15 });
    setScore(0);
    setCombo(0);
    setSpeed(150);
    setPowerUps([]);
    setActivePowerUps({});
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 glass-card animate-liquid-glow relative overflow-hidden">
        <div className="absolute inset-0 animate-neon-wave opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black neon-electric font-orbitron animate-cyber-pulse">
              SNAKE 2025
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black neon-quantum">
                  {score.toLocaleString()}
                </div>
                {combo > 4 && (
                  <div className="text-sm neon-cyber animate-pulse">
                    COMBO x{Math.floor(combo / 5) + 1}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mb-6">
            <Button
              onClick={startGame}
              variant="default"
              disabled={isPlaying && !gameOver}
              className="liquid-glass neon-electric font-bold animate-glass-shimmer hover:scale-105"
            >
              {gameOver ? <RotateCcw className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {gameOver ? 'RESTART' : 'START'}
            </Button>
            
            {isPlaying && !gameOver && (
              <Button 
                onClick={pauseGame} 
                variant="secondary"
                className="liquid-glass neon-cyber font-bold"
              >
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'RESUME' : 'PAUSE'}
              </Button>
            )}
          </div>

          {/* Active Power-ups Display */}
          {Object.keys(activePowerUps).length > 0 && (
            <div className="flex gap-2 mb-4">
              {Object.entries(activePowerUps).map(([type, duration]) => (
                <div key={type} className="glass-card p-2 rounded-lg border neon-quantum text-sm">
                  {type === 'speed' && <Zap className="h-4 w-4 inline mr-1" />}
                  {type === 'double' && <Trophy className="h-4 w-4 inline mr-1" />}
                  {type.toUpperCase()} {Math.ceil(duration / 60)}s
                </div>
              ))}
            </div>
          )}

          <div 
            className="relative mx-auto border-2 border-neon-electric rounded-xl overflow-hidden shadow-quantum"
            style={{ 
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
              background: 'radial-gradient(circle at center, rgba(0, 245, 255, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)'
            }}
          >
            {/* Particle Canvas */}
            <ParticleCanvas 
              width={GRID_SIZE * CELL_SIZE} 
              height={GRID_SIZE * CELL_SIZE}
              onReady={(effects) => { particleEffectsRef.current = effects; }}
            />
            
            {/* Game Grid */}
            <div className="absolute inset-0 grid" style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
            }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
                const snakeBodyIndex = snake.findIndex(segment => segment.x === x && segment.y === y);
                const isSnakeBody = snakeBodyIndex > 0;
                const isFood = food.x === x && food.y === y;
                const powerUp = powerUps.find(p => p.x === x && p.y === y);
                
                return (
                  <div
                    key={index}
                    className={`relative transition-all duration-200 ${
                      isSnakeHead ? 'animate-liquid-glow' : ''
                    } ${
                      isSnakeBody ? 'animate-particle-float' : ''
                    } ${
                      isFood ? 'animate-cyber-pulse' : ''
                    }`}
                    style={{
                      background: isSnakeHead 
                        ? 'var(--gradient-cyber)'
                        : isSnakeBody 
                        ? `linear-gradient(135deg, hsl(var(--neon-electric)), hsl(var(--neon-cyber)))`
                        : isFood 
                        ? 'var(--gradient-plasma)'
                        : powerUp
                        ? 'var(--gradient-liquid)'
                        : 'transparent',
                      boxShadow: isSnakeHead 
                        ? '0 0 20px hsl(var(--neon-electric)), inset 0 0 10px rgba(255,255,255,0.3)'
                        : isSnakeBody 
                        ? '0 0 10px hsl(var(--neon-cyber))'
                        : isFood 
                        ? '0 0 15px hsl(var(--neon-fusion)), 0 0 30px hsl(var(--neon-plasma))'
                        : powerUp
                        ? '0 0 12px hsl(var(--neon-quantum))'
                        : 'none',
                      borderRadius: isSnakeHead || isFood || powerUp ? '6px' : isSnakeBody ? '4px' : '0',
                      transform: isSnakeHead 
                        ? 'scale(1.1)' 
                        : isFood 
                        ? 'scale(1.05)' 
                        : 'scale(1)',
                      border: (isSnakeHead || isSnakeBody || isFood || powerUp) 
                        ? '1px solid rgba(255,255,255,0.3)' 
                        : 'none'
                    }}
                  >
                    {powerUp && (
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        {powerUp.type === 'speed' && '⚡'}
                        {powerUp.type === 'double' && '💰'}
                        {powerUp.type === 'magnet' && '🧲'}
                        {powerUp.type === 'shield' && '🛡️'}
                      </div>
                    )}
                    
                    {isSnakeHead && activePowerUps.shield > 0 && (
                      <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm neon-plasma font-exo2 font-semibold">
              🎮 WASD / Arrow Keys • SPACE to Pause
            </div>
            <div className="text-xs text-white/60 font-exo2">
              ✨ Collect power-ups for special abilities ✨
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};