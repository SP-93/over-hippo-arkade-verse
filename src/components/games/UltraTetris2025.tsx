import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

interface UltraTetris2025Props {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;  
  onGameStart?: () => boolean;
}

// Modern neon Tetris pieces with glow colors
const PIECES = {
  I: { blocks: [[0,0],[1,0],[2,0],[3,0]], color: "#00ffff", glow: "#40ffff" },
  O: { blocks: [[0,0],[1,0],[0,1],[1,1]], color: "#ffff00", glow: "#ffff80" },
  T: { blocks: [[1,0],[0,1],[1,1],[2,1]], color: "#ff00ff", glow: "#ff80ff" },
  S: { blocks: [[1,0],[2,0],[0,1],[1,1]], color: "#00ff00", glow: "#80ff80" },
  Z: { blocks: [[0,0],[1,0],[1,1],[2,1]], color: "#ff0000", glow: "#ff8080" },
  J: { blocks: [[0,0],[0,1],[1,1],[2,1]], color: "#0080ff", glow: "#80c0ff" },
  L: { blocks: [[2,0],[0,1],[1,1],[2,1]], color: "#ff8000", glow: "#ffb080" }
};

class LineParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  hue: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 15;
    this.vy = Math.random() * -10 - 5;
    this.life = 1;
    this.maxLife = 40 + Math.random() * 20;
    this.size = 3 + Math.random() * 5;
    this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
    this.hue = Math.random() * 360;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.vx *= 0.98;
    this.life -= 1;
    this.hue += 3;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
    ctx.shadowBlur = 15;
    ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

export const UltraTetris2025 = ({ onScoreChange, onGameEnd, onGameStart }: UltraTetris2025Props = {}) => {
  console.log("UltraTetris2025 loaded - Ultra modern neon version active!");
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
  const [particles, setParticles] = useState<LineParticle[]>([]);
  const [nextPiece, setNextPiece] = useState<any>(null);
  const [combo, setCombo] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();
  const [dropTime, setDropTime] = useState(500);
  
  const { handleGameStart } = useGameManager();

  const getRandomPiece = useCallback(() => {
    const pieceKeys = Object.keys(PIECES) as Array<keyof typeof PIECES>;
    const randomKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    return PIECES[randomKey];
  }, []);

  const createLineExplosion = useCallback((y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const cellSize = 30;
    const offsetX = (canvas.width - BOARD_WIDTH * cellSize) / 2;
    const newParticles: LineParticle[] = [];
    
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let i = 0; i < 8; i++) {
        newParticles.push(new LineParticle(
          offsetX + x * cellSize + cellSize/2,
          y * cellSize + cellSize/2
        ));
      }
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const drawNeonBlock = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    color: string, 
    glowColor: string,
    isActive: boolean = false,
    alpha: number = 1
  ) => {
    // Multiple glow layers for depth
    for (let i = 4; i >= 0; i--) {
      const glowSize = i * 3;
      const glowAlpha = (5 - i) / 5 * alpha * (isActive ? 1.5 : 1);
      
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15 + glowSize;
      ctx.globalAlpha = glowAlpha * 0.8;
      ctx.fillStyle = glowColor;
      ctx.fillRect(x - glowSize/2, y - glowSize/2, size + glowSize, size + glowSize);
    }
    
    // Main block with gradient
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, glowColor);
    gradient.addColorStop(1, color);
    
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // Inner highlight
    if (isActive) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
    }
    
    // Border glow
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellSize = 30;
    const offsetX = (canvas.width - BOARD_WIDTH * cellSize) / 2;
    const offsetY = 20;
    
    // Space theme background with stars and nebula
    const time = Date.now() * 0.001;
    
    // Deep space gradient
    const bgGradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/3, 0,
      canvas.width/2, canvas.height/3, canvas.width
    );
    bgGradient.addColorStop(0, '#1a0033');
    bgGradient.addColorStop(0.3, '#0d0420');
    bgGradient.addColorStop(0.7, '#050115');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animated stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 47 + time * 10) % canvas.width;
      const y = (i * 73 + Math.sin(time + i) * 20) % canvas.height;
      const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.sin(i + time) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Nebula effect
    const nebulaGradient = ctx.createRadialGradient(
      canvas.width * 0.8, canvas.height * 0.3, 0,
      canvas.width * 0.8, canvas.height * 0.3, canvas.width * 0.4
    );
    nebulaGradient.addColorStop(0, 'rgba(138, 43, 226, 0.1)');
    nebulaGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.05)');
    nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Board outline with pulsing glow
    const pulse = 1 + Math.sin(time * 3) * 0.3;
    ctx.strokeStyle = `rgba(0, 255, 200, ${0.5 * pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 255, 200, 0.8)';
    ctx.shadowBlur = 20;
    ctx.strokeRect(offsetX - 5, offsetY - 5, BOARD_WIDTH * cellSize + 10, BOARD_HEIGHT * cellSize + 10);
    ctx.shadowBlur = 0;
    
    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * cellSize, offsetY);
      ctx.lineTo(offsetX + i * cellSize, offsetY + BOARD_HEIGHT * cellSize);
      ctx.stroke();
    }
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * cellSize);
      ctx.lineTo(offsetX + BOARD_WIDTH * cellSize, offsetY + i * cellSize);
      ctx.stroke();
    }
    
    // Draw placed blocks
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const piece = Object.values(PIECES).find(p => p.color === cell);
          if (piece) {
            drawNeonBlock(
              ctx,
              offsetX + x * cellSize,
              offsetY + y * cellSize,
              cellSize,
              piece.color,
              piece.glow
            );
          }
        }
      });
    });
    
    // Draw current piece with extra glow
    if (currentPiece) {
      currentPiece.blocks.forEach(([px, py]: [number, number]) => {
        const x = currentPosition.x + px;
        const y = currentPosition.y + py;
        if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
          drawNeonBlock(
            ctx,
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            cellSize,
            currentPiece.color,
            currentPiece.glow,
            true
          );
        }
      });
    }
    
    // Enhanced UI panels with space theme
    const panelWidth = 140;
    const panelHeight = 100;
    
    // NEXT piece panel
    if (nextPiece) {
      const nextX = offsetX + BOARD_WIDTH * cellSize + 20;
      const nextY = offsetY + 20;
      
      // Panel background with space theme
      const panelGradient = ctx.createLinearGradient(nextX, nextY, nextX + panelWidth, nextY + panelHeight);
      panelGradient.addColorStop(0, 'rgba(30, 30, 80, 0.9)');
      panelGradient.addColorStop(1, 'rgba(10, 10, 40, 0.9)');
      ctx.fillStyle = panelGradient;
      ctx.fillRect(nextX, nextY, panelWidth, panelHeight);
      
      // Panel border with glow
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.strokeRect(nextX, nextY, panelWidth, panelHeight);
      ctx.shadowBlur = 0;
      
      // Panel title
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 14px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', nextX + panelWidth/2, nextY + 20);
      
      // Next piece preview
      const previewOffsetX = nextX + panelWidth/2 - 30;
      const previewOffsetY = nextY + 40;
      nextPiece.blocks.forEach(([px, py]: [number, number]) => {
        drawNeonBlock(
          ctx,
          previewOffsetX + px * 15,
          previewOffsetY + py * 15,
          14,
          nextPiece.color,
          nextPiece.glow,
          false,
          0.9
        );
      });
    }
    
    // HOLD panel (placeholder for future feature)
    const holdX = offsetX - 160;
    const holdY = offsetY + 20;
    
    const holdPanelGradient = ctx.createLinearGradient(holdX, holdY, holdX + panelWidth, holdY + panelHeight);
    holdPanelGradient.addColorStop(0, 'rgba(80, 30, 30, 0.9)');
    holdPanelGradient.addColorStop(1, 'rgba(40, 10, 10, 0.9)');
    ctx.fillStyle = holdPanelGradient;
    ctx.fillRect(holdX, holdY, panelWidth, panelHeight);
    
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff6666';
    ctx.shadowBlur = 10;
    ctx.strokeRect(holdX, holdY, panelWidth, panelHeight);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 14px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', holdX + panelWidth/2, holdY + 20);
    
    // Stats panel
    const statsX = offsetX - 160;
    const statsY = offsetY + 140;
    const statsHeight = 180;
    
    const statsPanelGradient = ctx.createLinearGradient(statsX, statsY, statsX + panelWidth, statsY + statsHeight);
    statsPanelGradient.addColorStop(0, 'rgba(30, 80, 30, 0.9)');
    statsPanelGradient.addColorStop(1, 'rgba(10, 40, 10, 0.9)');
    ctx.fillStyle = statsPanelGradient;
    ctx.fillRect(statsX, statsY, panelWidth, statsHeight);
    
    ctx.strokeStyle = '#66ff66';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#66ff66';
    ctx.shadowBlur = 10;
    ctx.strokeRect(statsX, statsY, panelWidth, statsHeight);
    ctx.shadowBlur = 0;
    
    // Stats text
    ctx.fillStyle = '#66ff66';
    ctx.font = 'bold 12px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL', statsX + 10, statsY + 25);
    ctx.fillText(`${level}`, statsX + 10, statsY + 45);
    
    ctx.fillText('LINES', statsX + 10, statsY + 70);
    ctx.fillText(`${lines}`, statsX + 10, statsY + 90);
    
    ctx.fillText('SCORE', statsX + 10, statsY + 115);
    ctx.fillText(`${score}`, statsX + 10, statsY + 135);
    
    if (combo > 1) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('COMBO', statsX + 10, statsY + 160);
      ctx.fillText(`${combo}X`, statsX + 10, statsY + 175);
    }
    
    // Draw particles
    setParticles(prev => {
      return prev.map(p => {
        p.update();
        p.draw(ctx);
        return p;
      }).filter(p => !p.isDead());
    });
    
    // Combo display
    if (combo > 1) {
      ctx.save();
      ctx.fillStyle = `hsl(${combo * 30}, 100%, 60%)`;
      ctx.shadowColor = `hsl(${combo * 30}, 100%, 60%)`;
      ctx.shadowBlur = 20;
      ctx.font = `bold ${20 + combo * 2}px Orbitron, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${combo}X COMBO!`, canvas.width/2, 80);
      ctx.restore();
    }
    
    // Game over effect
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowColor = '#ff0040';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ff0040';
      ctx.font = 'bold 36px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
      
      ctx.shadowColor = '#00ff80';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00ff80';
      ctx.font = 'bold 18px Orbitron, monospace';
      ctx.fillText(`SCORE: ${score}`, canvas.width/2, canvas.height/2 + 20);
      ctx.fillText(`LEVEL: ${level}`, canvas.width/2, canvas.height/2 + 45);
      ctx.shadowBlur = 0;
    }
    
    if (isPaused && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
      ctx.shadowBlur = 0;
    }
  }, [board, currentPiece, currentPosition, nextPiece, particles, combo, gameOver, isPaused, score, level, drawNeonBlock]);

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
      // Create explosion effects
      completedLines.forEach(lineY => {
        createLineExplosion(lineY);
      });
      
      // Remove completed lines with flash effect
      setTimeout(() => {
        const filteredBoard = newBoard.filter((_, index) => !completedLines.includes(index));
        const newEmptyLines = Array(completedLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
        setBoard([...newEmptyLines, ...filteredBoard]);
      }, 200);
      
      const newLines = lines + completedLines.length;
      setLines(newLines);
      
      // Scoring with combo system
      const baseScore = [0, 100, 300, 500, 800][completedLines.length] || 1000;
      const comboMultiplier = Math.max(1, combo);
      const newScore = score + baseScore * level * comboMultiplier;
      setScore(newScore);
      onScoreChange?.(newScore);
      
      setCombo(prev => prev + completedLines.length);
      setLevel(Math.floor(newLines / 10) + 1);
      setDropTime(Math.max(50, 500 - (level * 30)));
      
      const lineNames = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
      toast.success(`${lineNames[completedLines.length]}! ${comboMultiplier}x Combo! +${baseScore * level * comboMultiplier}`);
    } else {
      setCombo(0);
    }
    
    // Spawn new piece
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomPiece());
    const newPosition = { x: 4, y: 0 };
    
    if (checkCollision(nextPiece, newPosition)) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over!");
    } else {
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, board, lines, level, score, combo, nextPiece, getRandomPiece, checkCollision, createLineExplosion, onScoreChange, onGameEnd]);

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

  // Animation loop
  const animate = useCallback(() => {
    drawBoard();
    animationRef.current = requestAnimationFrame(animate);
  }, [drawBoard]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

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
        case 'A':
          movePiece({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePiece({ x: 1, y: 0 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePiece({ x: 0, y: 1 });
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
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

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('tetris')) return;
    
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    const firstPiece = getRandomPiece();
    setCurrentPiece(firstPiece);
    setNextPiece(getRandomPiece());
    setCurrentPosition({ x: 4, y: 0 });
    setScore(0);
    setLevel(1);
    setLines(0);
    setCombo(0);
    setParticles([]);
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
          <h2 className="text-2xl font-bold text-neon-blue font-orbitron">ULTRA TETRIS 2025</h2>
          <div className="flex gap-4 text-sm font-orbitron">
            <div className="text-arcade-gold">SCORE: {score.toString().padStart(8, '0')}</div>
            <div className="text-neon-green">LEVEL: {level}</div>
            <div className="text-neon-pink">LINES: {lines}</div>
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

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={650}
            className="w-full h-[650px] bg-black rounded-lg border-2 border-neon-blue/50"
            style={{
              maxWidth: '500px',
              maxHeight: '650px',
              filter: 'contrast(1.2) brightness(1.1)',
              boxShadow: `
                0 0 30px rgba(68, 68, 255, 0.4),
                inset 0 0 30px rgba(68, 68, 255, 0.1)
              `
            }}
          />
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center font-orbitron">
          WASD or ARROW KEYS • W/↑ to ROTATE • SPACE to PAUSE • CLEAR LINES FOR COMBOS
        </div>
        
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-neon-blue/70 font-orbitron">
            <span>SPEED: {Math.round((600-dropTime)/5)}%</span>
            <span>COMBO: {combo}x</span>
            <span>PARTICLES: {particles.length}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};