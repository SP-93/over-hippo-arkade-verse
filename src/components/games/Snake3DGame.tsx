import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { use3DDefensive } from "@/hooks/use3DDefensive";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { EnhancedSnakeSegment, EnhancedFood, SnakeTrail, GameBoundaries } from "./snake/EnhancedSnake3DComponents";
import * as THREE from "three";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10, z: 0 }];
const INITIAL_DIRECTION = { x: 1, y: 0, z: 0 };

interface Snake3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

interface SnakeSegmentProps {
  position: [number, number, number];
  isHead?: boolean;
}

// Legacy components replaced with enhanced versions

export const Snake3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Snake3DGameProps = {}) => {
  console.log("Snake3DGame loaded - real 3D version active!");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 0, z: 15 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(300);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  
  const { handleGameStart } = useGameManager();
  const { safeVector3, safeSetPosition, safeGetProperty, isValidVector3 } = use3DDefensive();

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE/2,
        y: 0,
        z: Math.floor(Math.random() * GRID_SIZE) - GRID_SIZE/2
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.z === newFood.z));
    return newFood;
  }, [snake]);

  const checkCollision = useCallback((head: any) => {
    try {
      // Wall collision - safe property access
      const headX = safeGetProperty(head, 'x', 0);
      const headZ = safeGetProperty(head, 'z', 0);
      
      if (headX < -GRID_SIZE/2 || headX >= GRID_SIZE/2 || 
          headZ < -GRID_SIZE/2 || headZ >= GRID_SIZE/2) {
        return true;
      }
      
      // Self collision - safe iteration
      return snake.some(segment => {
        try {
          const segX = safeGetProperty(segment, 'x', 0);
          const segZ = safeGetProperty(segment, 'z', 0);
          return segX === headX && segZ === headZ;
        } catch (error) {
          console.warn('⚠️ Collision check segment error:', error);
          return false;
        }
      });
    } catch (error) {
      console.warn('⚠️ Collision check failed:', error);
      return false;
    }
  }, [snake, safeGetProperty]);

  const moveSnake = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.z += direction.z;
      
      if (checkCollision(head)) {
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd?.();
        toast.error("Game Over!");
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      // Check food collision
      if (head.x === food.x && head.z === food.z) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood());
        // Increase speed slightly
        setSpeed(prev => Math.max(100, prev - 5));
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, isPlaying, isPaused, gameOver, checkCollision, generateFood]);

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
          if (direction.z !== 1) setDirection({ x: 0, y: 0, z: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.z !== -1) setDirection({ x: 0, y: 0, z: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x !== 1) setDirection({ x: -1, y: 0, z: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x !== -1) setDirection({ x: 1, y: 0, z: 0 });
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
    setFood({ x: 5, y: 0, z: 5 });
    setScore(0);
    setSpeed(300);
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
          <h2 className="text-2xl font-bold text-neon-green">3D Snake</h2>
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

        <Game3DEngine
          gameId="snake-3d"
          camera={{ position: [15, 15, 15], fov: 50 }}
          lighting="arcade"
          environment="abstract"
          enableOrbitControls={true}
        >
          <GameBoundaries size={GRID_SIZE} />
          
          {/* Snake segments */}
          {snake.map((segment, index) => (
            <EnhancedSnakeSegment
              key={index}
              position={[segment.x, segment.y, segment.z]}
              isHead={index === 0}
            />
          ))}
          
          {/* Snake trail */}
          <SnakeTrail positions={snake.slice(1, 6).map(seg => [seg.x, seg.y, seg.z])} />
          
          {/* Food */}
          <EnhancedFood position={[food.x, food.y, food.z]} />
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause • Mouse to rotate camera
        </div>
      </Card>
    </div>
  );
};