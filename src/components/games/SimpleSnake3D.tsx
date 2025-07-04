import { useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10, z: 0 }];
const INITIAL_DIRECTION = { x: 1, y: 0, z: 0 };

interface SimpleSnake3DProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

// Simple 3D cube component without complex features
const SimpleCube = ({ position, color, size = 0.8 }: any) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Simple 3D sphere for food
const SimpleSphere = ({ position, color }: any) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export const SimpleSnake3D = ({ onScoreChange, onGameEnd, onGameStart }: SimpleSnake3DProps = {}) => {
  console.log("SimpleSnake3D loaded!");
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
    if (head.x < -GRID_SIZE/2 || head.x >= GRID_SIZE/2 || 
        head.z < -GRID_SIZE/2 || head.z >= GRID_SIZE/2) {
      return true;
    }
    return snake.some(segment => segment.x === head.x && segment.z === head.z);
  }, [snake]);

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
      
      if (head.x === food.x && head.z === food.z) {
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
          <h2 className="text-2xl font-bold text-neon-green">3D Snake (Simple)</h2>
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

        <div className="h-[600px] bg-black rounded-lg overflow-hidden">
          <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Grid helper */}
            <gridHelper args={[GRID_SIZE, GRID_SIZE, "#333333", "#111111"]} />
            
            {/* Snake segments */}
            {snake.map((segment, index) => (
              <SimpleCube
                key={index}
                position={[segment.x, segment.y, segment.z]}
                color={index === 0 ? "#00ff41" : "#00cc33"}
              />
            ))}
            
            {/* Food */}
            <SimpleSphere position={[food.x, food.y, food.z]} color="#ff3366" />
          </Canvas>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause
        </div>
      </Card>
    </div>
  );
};