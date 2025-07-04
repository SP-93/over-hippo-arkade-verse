import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

interface Tetris3DPseudoProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;  
  onGameStart?: () => boolean;
}

// Tetris pieces
const PIECES = {
  I: { blocks: [[0,0],[1,0],[2,0],[3,0]], color: "#00ffff" },
  O: { blocks: [[0,0],[1,0],[0,1],[1,1]], color: "#ffff00" },
  T: { blocks: [[1,0],[0,1],[1,1],[2,1]], color: "#800080" },
  S: { blocks: [[1,0],[2,0],[0,1],[1,1]], color: "#00ff00" },
  Z: { blocks: [[0,0],[1,0],[1,1],[2,1]], color: "#ff0000" },
  J: { blocks: [[0,0],[0,1],[1,1],[2,1]], color: "#0000ff" },
  L: { blocks: [[2,0],[0,1],[1,1],[2,1]], color: "#ffa500" }
};

export const Tetris3DPseudo = ({ onScoreChange, onGameEnd, onGameStart }: Tetris3DPseudoProps = {}) => {
  console.log("Tetris3DPseudo loaded - CSS 3D version active!");
  const [board, setBoard] = useState<(string | null)[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 4, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [dropTime, setDropTime] = useState(500);
  
  const { handleGameStart } = useGameManager();

  const getRandomPiece = useCallback(() => {
    const pieceKeys = Object.keys(PIECES) as Array<keyof typeof PIECES>;
    const randomKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    return PIECES[randomKey];
  }, []);

  const draw3DBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#2e0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cellSize = 28;
    const offsetX = 50;
    const offsetY = 20;
    
    // Draw 3D board outline
    ctx.strokeStyle = '#4444ff';
    ctx.lineWidth = 2;
    
    // Main board outline
    ctx.strokeRect(offsetX, offsetY, BOARD_WIDTH * cellSize, BOARD_HEIGHT * cellSize);
    
    // 3D depth lines
    const depth = 15;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX + depth, offsetY - depth);
    ctx.lineTo(offsetX + BOARD_WIDTH * cellSize + depth, offsetY - depth);
    ctx.lineTo(offsetX + BOARD_WIDTH * cellSize, offsetY);
    
    ctx.moveTo(offsetX + BOARD_WIDTH * cellSize, offsetY);
    ctx.lineTo(offsetX + BOARD_WIDTH * cellSize + depth, offsetY - depth);
    ctx.lineTo(offsetX + BOARD_WIDTH * cellSize + depth, offsetY + BOARD_HEIGHT * cellSize - depth);
    ctx.lineTo(offsetX + BOARD_WIDTH * cellSize, offsetY + BOARD_HEIGHT * cellSize);
    ctx.stroke();
    
    // Draw placed blocks with 3D effect
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawBlock(ctx, offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cell, false);
        }
      });
    });
    
    // Draw current piece with 3D effect and glow
    if (currentPiece) {
      currentPiece.blocks.forEach(([px, py]: [number, number]) => {
        const x = currentPosition.x + px;
        const y = currentPosition.y + py;
        if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
          drawBlock(ctx, offsetX + x * cellSize, offsetY + y * cellSize, cellSize, currentPiece.color, true);
        }
      });
    }
    
  }, [board, currentPiece, currentPosition]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isActive: boolean) => {
    const depth = 8;
    
    // Main face
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    
    // Top face (3D effect)
    ctx.fillStyle = lightenColor(color, 40);
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + depth, y - depth + 1);
    ctx.lineTo(x + size + depth - 1, y - depth + 1);
    ctx.lineTo(x + size - 1, y + 1);
    ctx.closePath();
    ctx.fill();
    
    // Right face (3D effect)
    ctx.fillStyle = darkenColor(color, 30);
    ctx.beginPath();
    ctx.moveTo(x + size - 1, y + 1);
    ctx.lineTo(x + size + depth - 1, y - depth + 1);
    ctx.lineTo(x + size + depth - 1, y + size - depth - 1);
    ctx.lineTo(x + size - 1, y + size - 1);
    ctx.closePath();
    ctx.fill();
    
    // Glow effect for active pieces
    if (isActive) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
      ctx.shadowBlur = 0;
    }
    
    // Border
    ctx.strokeStyle = lightenColor(color, 60);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  };

  const lightenColor = (color: string, percent: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const darkenColor = (color: string, percent: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const checkCollision = useCallback((piece: any, position: { x: number; y: number }) => {
    return piece.blocks.some(([x, y]: [number, number]) => {
      const newX = position.x + x;
      const newY = position.y + y;
      
      return (
        newX < 0 || 
        newX >= BOARD_WIDTH || 
        newY >= BOARD_HEIGHT ||
        (newY >= 0 && board[newY][newX] !== null)
      );
    });
  }, [board]);

  const placePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    
    currentPiece.blocks.forEach(([x, y]: [number, number]) => {
      const newX = currentPosition.x + x;
      const newY = currentPosition.y + y;
      
      if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
        newBoard[newY][newX] = currentPiece.color;
      }
    });
    
    setBoard(newBoard);
    
    // Check for completed lines
    const completedLines: number[] = [];
    newBoard.forEach((row, index) => {
      if (row.every(cell => cell !== null)) {
        completedLines.push(index);
      }
    });
    
    if (completedLines.length > 0) {
      const filteredBoard = newBoard.filter((_, index) => !completedLines.includes(index));
      const newEmptyLines = Array(completedLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
      setBoard([...newEmptyLines, ...filteredBoard]);
      
      const newLines = lines + completedLines.length;
      setLines(newLines);
      const newScore = score + completedLines.length * 100 * level;
      setScore(newScore);
      onScoreChange?.(newScore);
      setLevel(Math.floor(newLines / 10) + 1);
      setDropTime(Math.max(50, 500 - (level * 50)));
      
      toast.success(`${completedLines.length} line${completedLines.length > 1 ? 's' : ''} cleared!`);
    }
    
    const newPiece = getRandomPiece();
    const newPosition = { x: 4, y: 0 };
    
    if (checkCollision(newPiece, newPosition)) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over!");
    } else {
      setCurrentPiece(newPiece);
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, board, lines, level, getRandomPiece, checkCollision, score, onScoreChange, onGameEnd]);

  const movePiece = useCallback((direction: { x: number; y: number }) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPosition = {
      x: currentPosition.x + direction.x,
      y: currentPosition.y + direction.y
    };
    
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    } else if (direction.y > 0) {
      placePiece();
    }
  }, [currentPiece, currentPosition, gameOver, isPaused, checkCollision, placePiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotatedBlocks = currentPiece.blocks.map(([x, y]: [number, number]) => [-y, x]);
    const rotatedPiece = { ...currentPiece, blocks: rotatedBlocks };
    
    if (!checkCollision(rotatedPiece, currentPosition)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, currentPosition, gameOver, isPaused, checkCollision]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        movePiece({ x: 0, y: 1 });
      }, dropTime);
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
  }, [isPlaying, isPaused, gameOver, dropTime, movePiece]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          movePiece({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          movePiece({ x: 1, y: 0 });
          break;
        case 'ArrowDown':
        case 's':
          movePiece({ x: 0, y: 1 });
          break;
        case 'ArrowUp':
        case 'w':
          rotatePiece();
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, isPaused, movePiece, rotatePiece]);

  useEffect(() => {
    draw3DBoard();
  }, [draw3DBoard]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('tetris')) return;
    
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(getRandomPiece());
    setCurrentPosition({ x: 4, y: 0 });
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(500);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-blue">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-blue">3D Tetris</h2>
          <div className="flex gap-4 text-sm">
            <div className="text-arcade-gold">Score: {score}</div>
            <div className="text-neon-green">Level: {level}</div>
            <div className="text-neon-pink">Lines: {lines}</div>
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
            width={400}
            height={600}
            className="w-full h-[600px] bg-black rounded-lg border-2 border-neon-blue/30"
            style={{
              maxWidth: '400px',
              maxHeight: '600px',
              transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
              filter: 'drop-shadow(0 20px 40px rgba(68, 68, 255, 0.4))'
            }}
          />
          {isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-4xl font-bold text-neon-blue animate-pulse">PAUSED</div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • W/↑ to rotate • Space to pause
        </div>
      </Card>
    </div>
  );
};