import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

interface HD2006SnakeProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const HD2006Snake = ({ onScoreChange, onGameEnd, onGameStart }: HD2006SnakeProps = {}) => {
  console.log("HD2006Snake loaded - Xbox 360/PS3 era graphics!");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(200);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  
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

  const checkCollision = useCallback((head: any) => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
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
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd?.();
        toast.error("Game Over! Final Score: " + score);
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood());
        setSpeed(prev => Math.max(80, prev - 3));
        toast.success("+10 Points!");
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, isPlaying, isPaused, gameOver, checkCollision, generateFood, score, onScoreChange, onGameEnd]);

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      // Prevent page scrolling during gameplay
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
    setFood({ x: 15, y: 15 });
    setScore(0);
    setSpeed(200);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  // Create HD grid cells with 2006 effects
  const gridCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
      const isSnakeBody = snake.some((segment, index) => index > 0 && segment.x === x && segment.y === y);
      const isFood = food.x === x && food.y === y;
      
      gridCells.push(
        <div
          key={`${x}-${y}`}
          className={`
            relative group transition-all duration-300 ease-out
            ${isSnakeHead ? 'animate-hd-glow animate-depth-float' : ''}
            ${isSnakeBody ? 'animate-metal-shine' : ''}
            ${isFood ? 'animate-hd-glow animate-bounce' : ''}
          `}
          style={{
            width: '24px',
            height: '24px',
            perspective: '100px',
            transformStyle: 'preserve-3d',
            // Snake Head - 2006 HD Chrome effect
            ...(isSnakeHead && {
              background: 'linear-gradient(145deg, #00ff88 0%, #00cc66 25%, #ffffff 50%, #00ff88 75%, #004422 100%)',
              borderRadius: '4px',
              transform: 'perspective(200px) rotateX(25deg) rotateY(15deg) translateZ(12px)',
              boxShadow: `
                0 0 25px rgba(0, 255, 136, 0.8),
                0 0 50px rgba(0, 255, 136, 0.4),
                0 12px 24px rgba(0, 0, 0, 0.6),
                inset 0 4px 8px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.2)
              `,
              border: '2px solid rgba(255, 255, 255, 0.4)',
              position: 'relative',
              overflow: 'hidden'
            }),
            // Snake Body - Metallic segments
            ...(isSnakeBody && {
              background: 'linear-gradient(135deg, #00cc55 0%, #008844 30%, #ffffff 50%, #00aa33 70%, #004411 100%)',
              borderRadius: '3px',
              transform: 'perspective(150px) rotateX(20deg) rotateY(10deg) translateZ(8px)',
              boxShadow: `
                0 0 15px rgba(0, 204, 85, 0.6),
                0 8px 16px rgba(0, 0, 0, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.2),
                inset 0 -1px 2px rgba(0, 0, 0, 0.1)
              `,
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }),
            // Food - Glowing energy orb
            ...(isFood && {
              background: 'radial-gradient(circle, #ff6600 0%, #ff3300 30%, #ffffff 50%, #ff6600 70%, #cc2200 100%)',
              borderRadius: '50%',
              transform: 'perspective(200px) rotateX(30deg) rotateY(20deg) translateZ(16px)',
              boxShadow: `
                0 0 30px rgba(255, 102, 0, 0.9),
                0 0 60px rgba(255, 102, 0, 0.5),
                0 0 90px rgba(255, 102, 0, 0.3),
                0 16px 32px rgba(0, 0, 0, 0.7),
                inset 0 4px 8px rgba(255, 255, 255, 0.4)
              `,
              border: '3px solid rgba(255, 255, 255, 0.6)',
              position: 'relative'
            }),
            // Empty cells - Dark with subtle glow
            ...(!isSnakeHead && !isSnakeBody && !isFood && {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              borderRadius: '2px',
              transform: 'perspective(100px) rotateX(5deg) rotateY(5deg) translateZ(2px)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(100, 100, 150, 0.2)',
              transition: 'all 0.3s ease'
            })
          }}
        >
          {/* HD lighting effects */}
          {isSnakeHead && (
            <>
              <div 
                className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-sm"
                style={{ clipPath: 'polygon(0 0, 70% 0, 30% 70%, 0 100%)' }}
              />
              <div 
                className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm"
              />
            </>
          )}
          
          {isFood && (
            <>
              <div 
                className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent rounded-full"
                style={{ clipPath: 'circle(40% at 30% 30%)' }}
              />
              <div 
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
              />
            </>
          )}
          
          {isSnakeBody && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-sm"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'metal-shine 2s ease-in-out infinite'
              }}
            />
          )}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-2 border-neon-green shadow-hd-glow font-orbitron">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green animate-text-glow">
            HD SNAKE 2006
          </h2>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-arcade-gold via-neon-yellow to-arcade-gold">
            {score.toLocaleString()}
          </div>
        </div>
        
        <div className="flex gap-3 mb-6">
          <Button
            onClick={startGame}
            variant="arcade"
            disabled={isPlaying && !gameOver}
            className="font-exo2 font-bold text-lg px-6 py-3 shadow-hd-metal animate-depth-float"
          >
            {gameOver ? '🎮 RESTART' : '▶️ START'}
          </Button>
          
          {isPlaying && !gameOver && (
            <Button 
              onClick={pauseGame} 
              variant="secondary"
              className="font-exo2 font-bold text-lg px-6 py-3 shadow-hd-metal"
            >
              {isPaused ? '▶️ RESUME' : '⏸️ PAUSE'}
            </Button>
          )}
        </div>

        <div 
          className="mx-auto rounded-xl overflow-hidden shadow-hd-depth"
          style={{ 
            width: 'fit-content',
            background: 'radial-gradient(circle at center, #000033 0%, #000011 100%)',
            padding: '20px',
            perspective: '1200px',
            transform: 'rotateX(10deg) rotateY(2deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div
            className="grid gap-1 rounded-lg overflow-hidden shadow-2xl"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              transform: 'translateZ(10px)',
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(45deg, #000022 25%, transparent 25%), linear-gradient(-45deg, #000022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000022 75%), linear-gradient(-45deg, transparent 75%, #000022 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
          >
            {gridCells}
          </div>
        </div>
        
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-neon-cyan font-exo2 font-semibold">
            🎮 WASD / Arrow Keys • SPACE to Pause
          </div>
          <div className="text-xs text-hd-silver font-exo2">
            ✨ Enhanced with 2006 HD Gaming Technology ✨
          </div>
        </div>
      </Card>
    </div>
  );
};