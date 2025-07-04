import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

interface PseudoSnake3DProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const PseudoSnake3D = ({ onScoreChange, onGameEnd, onGameStart }: PseudoSnake3DProps = {}) => {
  console.log("PseudoSnake3D loaded - CSS 3D version!");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(300);
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
        toast.error("Game Over!");
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood());
        setSpeed(prev => Math.max(100, prev - 5));
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
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
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
    setSpeed(300);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  // Create grid cells
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
            w-6 h-6 border border-gray-800 relative
            ${isSnakeHead ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-400/50 transform rotate-3d animate-pulse' : ''}
            ${isSnakeBody ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-md shadow-green-500/30 transform rotate-3d' : ''}
            ${isFood ? 'bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg shadow-red-400/50 animate-bounce transform rotate-3d' : ''}
            ${!isSnakeHead && !isSnakeBody && !isFood ? 'bg-gray-900 hover:bg-gray-800' : ''}
          `}
          style={{
            transform: isSnakeHead ? 'perspective(100px) rotateX(15deg) rotateY(15deg) translateZ(8px)' :
                      isSnakeBody ? 'perspective(100px) rotateX(10deg) rotateY(10deg) translateZ(4px)' :
                      isFood ? 'perspective(100px) rotateX(20deg) rotateY(20deg) translateZ(12px)' :
                      'perspective(100px) rotateX(5deg) rotateY(5deg)',
            boxShadow: isSnakeHead ? '0 8px 16px rgba(74, 222, 128, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' :
                      isSnakeBody ? '0 4px 8px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255,255,255,0.1)' :
                      isFood ? '0 8px 16px rgba(248, 113, 113, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' :
                      '0 2px 4px rgba(0,0,0,0.3)',
            background: isSnakeHead ? 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)' :
                       isSnakeBody ? 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)' :
                       isFood ? 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)' :
                       'linear-gradient(135deg, #1f2937, #111827, #030712)'
          }}
        >
          {isSnakeHead && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-sm" />
          )}
          {isFood && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
          )}
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Snake (CSS)</h2>
          <div className="text-lg font-bold text-arcade-gold">Score: {score}</div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={startGame}
            variant="arcade"
            disabled={isPlaying && !gameOver}
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
          
          {isPlaying && !gameOver && (
            <Button onClick={pauseGame} variant="secondary">
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>

        <div 
          className="bg-black rounded-lg p-4 mx-auto"
          style={{ 
            width: 'fit-content',
            perspective: '1200px',
            transform: 'rotateX(15deg) rotateY(5deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div
            className="grid gap-0 shadow-2xl rounded-lg overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              transform: 'translateZ(20px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {gridCells}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause • CSS 3D Nintendo Style!
        </div>
      </Card>
    </div>
  );
};