import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const GRID_SIZE = 21;
const CELL_SIZE = 20;

interface PacMan2DProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

// Jungle-themed maze (1 = wall, 2 = dot, 3 = power pellet, 0 = empty)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,0,0,0,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,1,1,1,1,1,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
  [1,3,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,3,1],
  [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const PacMan2D = ({ onScoreChange, onGameEnd, onGameStart }: PacMan2DProps = {}) => {
  console.log("PacMan2D loaded - Jungle theme Canvas 2D version!");
  
  const [pacmanPosition, setPacmanPosition] = useState({ x: 10, y: 15 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [maze, setMaze] = useState(MAZE.map(row => [...row]));
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(true);
  const [powerMode, setPowerMode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();

  const { 
    currentLives, 
    chipManager, 
    hasGameStarted, 
    loseLife, 
    handleGameStart: gameStart 
  } = useGameManager();

  // Ghost positions (simple AI)
  const [ghosts, setGhosts] = useState([
    { x: 9, y: 9, color: "#ff4444", dx: 1, dy: 0 },
    { x: 10, y: 9, color: "#ff88ff", dx: -1, dy: 0 },
    { x: 11, y: 9, color: "#44ffff", dx: 0, dy: 1 },
    { x: 12, y: 9, color: "#ffaa44", dx: 0, dy: -1 }
  ]);

  const drawJungleBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Jungle gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a4d1a'); // Dark green at top
    gradient.addColorStop(0.5, '#2d5f2d'); // Medium green
    gradient.addColorStop(1, '#0f2f0f'); // Very dark green at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add jungle texture with vine patterns
    ctx.strokeStyle = 'rgba(50, 100, 50, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = (i * 30) % width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 15, height/3, x, height/2);
      ctx.quadraticCurveTo(x - 15, 2*height/3, x, height);
      ctx.stroke();
    }
  }, []);

  const drawMaze = useCallback((ctx: CanvasRenderingContext2D) => {
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        if (cell === 1) {
          // Jungle wall with leaf texture
          const wallGradient = ctx.createLinearGradient(pixelX, pixelY, pixelX + CELL_SIZE, pixelY + CELL_SIZE);
          wallGradient.addColorStop(0, '#4d8c4d');
          wallGradient.addColorStop(0.5, '#66a066');
          wallGradient.addColorStop(1, '#3d7a3d');
          ctx.fillStyle = wallGradient;
          ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
          
          // Add leaf pattern
          ctx.fillStyle = 'rgba(100, 150, 100, 0.5)';
          ctx.beginPath();
          ctx.ellipse(pixelX + CELL_SIZE/2, pixelY + CELL_SIZE/2, CELL_SIZE/3, CELL_SIZE/4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Wall border
          ctx.strokeStyle = '#2d5f2d';
          ctx.lineWidth = 1;
          ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
        } else if (cell === 2) {
          // Golden berries instead of dots
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE/2, pixelY + CELL_SIZE/2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (cell === 3) {
          // Large power fruit
          ctx.fillStyle = '#ff6b47';
          ctx.shadowColor = '#ff6b47';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE/2, pixelY + CELL_SIZE/2, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Fruit highlight
          ctx.fillStyle = '#ffaa88';
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE/2 - 3, pixelY + CELL_SIZE/2 - 3, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });
  }, [maze]);

  const drawPacman = useCallback((ctx: CanvasRenderingContext2D) => {
    const pixelX = pacmanPosition.x * CELL_SIZE + CELL_SIZE/2;
    const pixelY = pacmanPosition.y * CELL_SIZE + CELL_SIZE/2;
    
    // Pac-Man glow
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffff00';
    
    if (mouthOpen) {
      // Pac-Man with mouth open
      ctx.beginPath();
      
      // Determine mouth direction based on movement
      let startAngle = 0.2 * Math.PI;
      let endAngle = 1.8 * Math.PI;
      
      if (direction.x > 0) { // Moving right
        startAngle = 0.2 * Math.PI;
        endAngle = 1.8 * Math.PI;
      } else if (direction.x < 0) { // Moving left
        startAngle = 1.2 * Math.PI;
        endAngle = 0.8 * Math.PI;
      } else if (direction.y > 0) { // Moving down
        startAngle = 0.7 * Math.PI;
        endAngle = 0.3 * Math.PI;
      } else if (direction.y < 0) { // Moving up
        startAngle = 1.7 * Math.PI;
        endAngle = 1.3 * Math.PI;
      }
      
      ctx.arc(pixelX, pixelY, CELL_SIZE/2 - 2, startAngle, endAngle);
      ctx.lineTo(pixelX, pixelY);
    } else {
      // Closed mouth
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, CELL_SIZE/2 - 2, 0, Math.PI * 2);
    }
    
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [pacmanPosition, direction, mouthOpen]);

  const drawGhosts = useCallback((ctx: CanvasRenderingContext2D) => {
    ghosts.forEach(ghost => {
      const pixelX = ghost.x * CELL_SIZE + CELL_SIZE/2;
      const pixelY = ghost.y * CELL_SIZE + CELL_SIZE/2;
      
      // Ghost glow
      ctx.shadowColor = ghost.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = powerMode ? '#4444ff' : ghost.color;
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(pixelX, pixelY - 2, CELL_SIZE/2 - 2, Math.PI, 0);
      ctx.lineTo(pixelX + CELL_SIZE/2 - 2, pixelY + CELL_SIZE/2 - 2);
      ctx.lineTo(pixelX + CELL_SIZE/4, pixelY + CELL_SIZE/2 - 6);
      ctx.lineTo(pixelX, pixelY + CELL_SIZE/2 - 2);
      ctx.lineTo(pixelX - CELL_SIZE/4, pixelY + CELL_SIZE/2 - 6);
      ctx.lineTo(pixelX - CELL_SIZE/2 + 2, pixelY + CELL_SIZE/2 - 2);
      ctx.closePath();
      ctx.fill();
      
      // Ghost eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(pixelX - 4, pixelY - 4, 3, 0, Math.PI * 2);
      ctx.arc(pixelX + 4, pixelY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = powerMode ? 'white' : 'black';
      ctx.beginPath();
      ctx.arc(pixelX - 4, pixelY - 4, 1, 0, Math.PI * 2);
      ctx.arc(pixelX + 4, pixelY - 4, 1, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [ghosts, powerMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawJungleBackground(ctx, canvas.width, canvas.height);
    drawMaze(ctx);
    drawPacman(ctx);
    drawGhosts(ctx);
    
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
      
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`SCORE: ${score}`, canvas.width/2, canvas.height/2 + 20);
    }
    
    if (isPaused && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffff44';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    }
  }, [pacmanPosition, ghosts, maze, gameOver, isPaused, score, drawJungleBackground, drawMaze, drawPacman, drawGhosts]);

  // Animation loop
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

  // Mouth animation
  useEffect(() => {
    const mouthTimer = setInterval(() => {
      if (isPlaying && !isPaused) {
        setMouthOpen(prev => !prev);
      }
    }, 200);
    
    return () => clearInterval(mouthTimer);
  }, [isPlaying, isPaused]);

  const movePacman = useCallback(() => {
    if (!isPlaying || isPaused || gameOver || (direction.x === 0 && direction.y === 0)) return;

    setPacmanPosition(current => {
      const newX = current.x + direction.x;
      const newZ = current.y + direction.y;
      
      // Check boundaries
      if (newX < 0 || newX >= GRID_SIZE || newZ < 0 || newZ >= GRID_SIZE) {
        return current;
      }
      
      // Check walls
      if (maze[newZ][newX] === 1) {
        return current;
      }
      
      // Check ghost collision
      const ghostCollision = ghosts.some(ghost => ghost.x === newX && ghost.y === newZ);
      if (ghostCollision && !powerMode) {
        if (!loseLife()) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd?.();
          toast.error("Game Over! Sve živote ste izgubili!");
        } else {
          // Reset position but keep playing
          return { x: 10, y: 15 };
        }
        return current;
      }
      
      // Eat dots/pellets
      if (maze[newZ][newX] === 2 || maze[newZ][newX] === 3) {
        const points = maze[newZ][newX] === 3 ? 50 : 10;
        const newScore = score + points;
        setScore(newScore);
        onScoreChange?.(newScore);
        
        if (maze[newZ][newX] === 3) {
          setPowerMode(true);
          setTimeout(() => setPowerMode(false), 10000);
        }
        
        setMaze(currentMaze => {
          const newMaze = currentMaze.map(row => [...row]);
          newMaze[newZ][newX] = 0;
          return newMaze;
        });
        
        // Check win condition
        const remainingDots = maze.flat().filter(cell => cell === 2 || cell === 3).length;
        if (remainingDots <= 1) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd?.();
          toast.success("You Win! Level Complete!");
        }
      }
      
      return { x: newX, y: newZ };
    });
  }, [direction, maze, isPlaying, isPaused, gameOver, score, ghosts, powerMode, onScoreChange, onGameEnd, loseLife]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(movePacman, 150);
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
  }, [isPlaying, isPaused, gameOver, movePacman]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          setDirection({ x: 1, y: 0 });
          break;
        case ' ' :
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, isPaused]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!gameStart('pacman')) return;
    
    setPacmanPosition({ x: 10, y: 15 });
    setDirection({ x: 0, y: 0 });
    setMaze(MAZE.map(row => [...row]));
    setScore(0);
    setPowerMode(false);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-arcade-gold">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-arcade-gold">Jungle Pac-Man 2D</h2>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-neon-green">Score: {score}</div>
            <div className="text-lg font-bold text-red-500">Lives: {currentLives}</div>
          </div>
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
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="w-full h-auto bg-black rounded-lg border-2 border-arcade-gold"
            style={{
              maxWidth: '500px',
              maxHeight: '500px',
              imageRendering: 'pixelated'
            }}
          />
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause • Collect golden berries • Avoid jungle spirits!
        </div>
      </Card>
    </div>
  );
};
