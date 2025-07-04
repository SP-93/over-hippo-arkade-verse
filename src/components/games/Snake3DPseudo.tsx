import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

interface Snake3DPseudoProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const Snake3DPseudo = ({ onScoreChange, onGameEnd, onGameStart }: Snake3DPseudoProps = {}) => {
  console.log("Snake3DPseudo loaded - CSS 3D version active!");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(300);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const draw3DEffect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cellSize = Math.min(canvas.width, canvas.height) / GRID_SIZE;
    const offsetX = (canvas.width - GRID_SIZE * cellSize) / 2;
    const offsetY = (canvas.height - GRID_SIZE * cellSize) / 2;
    
    // Draw 3D grid
    ctx.strokeStyle = '#333366';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines with perspective
      const x = offsetX + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x + 5, offsetY - 5); // 3D depth
      ctx.lineTo(x + 5, offsetY + GRID_SIZE * cellSize - 5);
      ctx.lineTo(x, offsetY + GRID_SIZE * cellSize);
      ctx.stroke();
      
      // Horizontal lines with perspective
      const y = offsetY + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + 5, y - 5); // 3D depth
      ctx.lineTo(offsetX + GRID_SIZE * cellSize + 5, y - 5);
      ctx.lineTo(offsetX + GRID_SIZE * cellSize, y);
      ctx.stroke();
    }
    
    // Draw snake with 3D effect
    snake.forEach((segment, index) => {
      const x = offsetX + segment.x * cellSize;
      const y = offsetY + segment.y * cellSize;
      const isHead = index === 0;
      
      // Main cube face
      ctx.fillStyle = isHead ? '#00ff41' : '#00cc33';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      // Top face (3D effect)
      ctx.fillStyle = isHead ? '#66ff88' : '#66dd66';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + 7, y - 3);
      ctx.lineTo(x + cellSize + 3, y - 3);
      ctx.lineTo(x + cellSize - 2, y + 2);
      ctx.closePath();
      ctx.fill();
      
      // Right face (3D effect)
      ctx.fillStyle = isHead ? '#00dd33' : '#00aa22';
      ctx.beginPath();
      ctx.moveTo(x + cellSize - 2, y + 2);
      ctx.lineTo(x + cellSize + 3, y - 3);
      ctx.lineTo(x + cellSize + 3, y + cellSize - 7);
      ctx.lineTo(x + cellSize - 2, y + cellSize - 2);
      ctx.closePath();
      ctx.fill();
      
      // Glow effect for head
      if (isHead) {
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cellSize/3, y + cellSize/3, cellSize/3, cellSize/3);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw food with 3D effect and animation
    const foodX = offsetX + food.x * cellSize;
    const foodY = offsetY + food.y * cellSize;
    const time = Date.now() * 0.005;
    const bounce = Math.sin(time) * 3;
    
    // Food main sphere
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(foodX + cellSize/2, foodY + cellSize/2 + bounce, cellSize/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Food highlight
    ctx.fillStyle = '#ff6699';
    ctx.beginPath();
    ctx.arc(foodX + cellSize/2 - 3, foodY + cellSize/2 - 3 + bounce, cellSize/6, 0, Math.PI * 2);
    ctx.fill();
    
    // Food glow
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(foodX + cellSize/2, foodY + cellSize/2 + bounce, cellSize/4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
  }, [snake, food]);

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
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd?.();
        toast.error("Game Over!");
        return currentSnake;
      }
      
      newSnake.unshift(head);
      
      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange?.(newScore);
        setFood(generateFood());
        setSpeed(prev => Math.max(100, prev - 5));
        toast.success(`Score: ${newScore}!`);
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

  useEffect(() => {
    draw3DEffect();
  }, [draw3DEffect]);

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

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full h-[600px] bg-black rounded-lg border-2 border-neon-green/30"
            style={{
              maxWidth: '600px',
              maxHeight: '600px',
              transform: 'perspective(1000px) rotateX(10deg)',
              filter: 'drop-shadow(0 20px 40px rgba(0, 255, 65, 0.3))'
            }}
          />
          {isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-4xl font-bold text-neon-green animate-pulse">PAUSED</div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause
        </div>
      </Card>
    </div>
  );
};