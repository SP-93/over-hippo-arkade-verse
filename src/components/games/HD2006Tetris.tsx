import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// HD Tetris pieces with 2006 style colors
const PIECES = {
  I: { blocks: [[0,0],[1,0],[2,0],[3,0]], color: "#00ffff", name: "CYAN" },
  O: { blocks: [[0,0],[1,0],[0,1],[1,1]], color: "#ffff00", name: "GOLD" },
  T: { blocks: [[1,0],[0,1],[1,1],[2,1]], color: "#ff00ff", name: "MAGENTA" },
  S: { blocks: [[1,0],[2,0],[0,1],[1,1]], color: "#00ff00", name: "LIME" },
  Z: { blocks: [[0,0],[1,0],[1,1],[2,1]], color: "#ff0000", name: "CRIMSON" },
  J: { blocks: [[0,0],[0,1],[1,1],[2,1]], color: "#0080ff", name: "AZURE" },
  L: { blocks: [[2,0],[0,1],[1,1],[2,1]], color: "#ff8000", name: "AMBER" }
};

interface HD2006TetrisProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const HD2006Tetris = ({ onScoreChange, onGameEnd, onGameStart }: HD2006TetrisProps = {}) => {
  console.log("HD2006Tetris loaded - Next-gen block stacking!");
  
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
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [dropTime, setDropTime] = useState(800);
  const [combo, setCombo] = useState(0);
  
  const { handleGameStart } = useGameManager();

  const getRandomPiece = useCallback(() => {
    const pieceKeys = Object.keys(PIECES) as Array<keyof typeof PIECES>;
    const randomKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    return PIECES[randomKey];
  }, []);

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
      // Line clear effects
      const filteredBoard = newBoard.filter((_, index) => !completedLines.includes(index));
      const newEmptyLines = Array(completedLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
      setBoard([...newEmptyLines, ...filteredBoard]);
      
      const newLines = lines + completedLines.length;
      const newCombo = combo + completedLines.length;
      setLines(newLines);
      setCombo(newCombo);
      
      // HD scoring system
      const baseScore = completedLines.length * 100 * level;
      const comboBonus = newCombo * 50;
      const totalScore = score + baseScore + comboBonus;
      setScore(totalScore);
      onScoreChange?.(totalScore);
      
      setLevel(Math.floor(newLines / 10) + 1);
      setDropTime(Math.max(50, 800 - (level * 60)));
      
      // HD feedback
      const lineNames = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS!"];
      toast.success(`${lineNames[completedLines.length]} +${baseScore + comboBonus}! ${newCombo > 1 ? `COMBO x${newCombo}` : ''}`);
    } else {
      setCombo(0);
    }
    
    // Spawn new piece
    const newPiece = getRandomPiece();
    const newPosition = { x: 4, y: 0 };
    
    if (checkCollision(newPiece, newPosition)) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error(`GAME OVER! Final Score: ${score.toLocaleString()}`);
    } else {
      setCurrentPiece(newPiece);
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, board, lines, level, score, combo, getRandomPiece, checkCollision, onScoreChange, onGameEnd]);

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
      toast.success("ROTATED!");
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
      
      // Prevent page scrolling during gameplay
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
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
    setCurrentPiece(getRandomPiece());
    setCurrentPosition({ x: 4, y: 0 });
    setScore(0);
    setLevel(1);
    setLines(0);
    setCombo(0);
    setDropTime(800);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  // Render HD game board
  const renderBoard = () => {
    const cells = [];
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cellColor = board[y][x];
        const isCurrentPiece = currentPiece && currentPiece.blocks.some(([px, py]: [number, number]) => 
          currentPosition.x + px === x && currentPosition.y + py === y
        );
        
        const finalColor = isCurrentPiece ? currentPiece.color : cellColor;
        const isEmpty = !finalColor;
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className="relative transition-all duration-200 ease-out"
            style={{
              width: '24px',
              height: '24px',
              // HD Empty cells
              ...(isEmpty && {
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                border: '1px solid rgba(100, 100, 200, 0.2)',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'
              }),
              // HD Filled cells with chrome effect
              ...(!isEmpty && {
                background: `linear-gradient(145deg, 
                  ${finalColor}dd 0%, 
                  ${finalColor}ff 25%, 
                  #ffffff 40%, 
                  ${finalColor}ff 60%, 
                  ${finalColor}88 100%
                )`,
                border: `2px solid ${finalColor}aa`,
                borderRadius: '3px',
                boxShadow: `
                  0 0 20px ${finalColor}66,
                  0 4px 8px rgba(0, 0, 0, 0.4),
                  inset 0 2px 4px rgba(255, 255, 255, 0.3),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.2)
                `,
                transform: isCurrentPiece ? 'translateZ(4px) rotateX(5deg)' : 'translateZ(2px)',
                transformStyle: 'preserve-3d'
              })
            }}
          >
            {!isEmpty && (
              <>
                {/* HD Chrome reflection */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-sm"
                  style={{ clipPath: 'polygon(0 0, 60% 0, 20% 60%, 0 100%)' }}
                />
                {/* HD Highlight spot */}
                <div 
                  className="absolute top-1 left-1 w-2 h-2 bg-white/70 rounded-full blur-sm"
                />
                {/* Active piece glow */}
                {isCurrentPiece && (
                  <div 
                    className="absolute inset-0 animate-pulse rounded-sm"
                    style={{ 
                      background: `linear-gradient(45deg, transparent, ${finalColor}44, transparent)`,
                      animation: 'hd-glow 1s ease-in-out infinite'
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-2 border-neon-blue shadow-hd-glow font-orbitron">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue animate-text-glow">
            HD TETRIS 2006
          </h2>
          <div className="text-right">
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-arcade-gold via-neon-yellow to-arcade-gold">
              {score.toLocaleString()}
            </div>
            <div className="text-sm font-exo2 text-hd-silver">
              LV.{level} • {lines} LINES
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <div 
              className="mx-auto rounded-xl overflow-hidden shadow-hd-depth"
              style={{ 
                width: 'fit-content',
                background: 'radial-gradient(circle at center, #000055 0%, #000022 100%)',
                padding: '20px',
                perspective: '1000px',
                transform: 'rotateX(8deg) rotateY(2deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className="grid gap-1 rounded-lg overflow-hidden shadow-2xl"
                style={{
                  gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                  gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                  transform: 'translateZ(15px)',
                  transformStyle: 'preserve-3d',
                  background: 'linear-gradient(45deg, #000033 25%, transparent 25%), linear-gradient(-45deg, #000033 25%, transparent 25%)',
                  backgroundSize: '6px 6px'
                }}
              >
                {renderBoard()}
              </div>
            </div>
          </div>
          
          {/* Stats Panel */}
          <div className="space-y-4">
            <div className="bg-gradient-hd rounded-lg p-4 shadow-hd-metal">
              <h3 className="font-exo2 font-bold text-sm mb-2 text-gray-800">NEXT PIECE</h3>
              <div className="bg-black/20 rounded p-2 h-16 flex items-center justify-center">
                {currentPiece && (
                  <div className="text-xs font-exo2 text-hd-electric font-bold">
                    {currentPiece.name}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-hd rounded-lg p-4 shadow-hd-metal">
              <h3 className="font-exo2 font-bold text-sm mb-2 text-gray-800">STATS</h3>
              <div className="space-y-2 text-xs font-exo2 text-gray-700">
                <div className="flex justify-between">
                  <span>LEVEL:</span>
                  <span className="font-bold text-hd-electric">{level}</span>
                </div>
                <div className="flex justify-between">
                  <span>LINES:</span>
                  <span className="font-bold text-hd-electric">{lines}</span>
                </div>
                <div className="flex justify-between">
                  <span>COMBO:</span>
                  <span className="font-bold text-danger-red">{combo}x</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={startGame}
                variant="arcade"
                disabled={isPlaying && !gameOver}
                className="w-full font-exo2 font-bold text-sm shadow-hd-metal animate-depth-float"
              >
                {gameOver ? '🎮 RESTART' : '▶️ START'}
              </Button>
              
              {isPlaying && !gameOver && (
                <Button 
                  onClick={pauseGame} 
                  variant="secondary"
                  className="w-full font-exo2 font-bold text-sm shadow-hd-metal"
                >
                  {isPaused ? '▶️ RESUME' : '⏸️ PAUSE'}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-neon-cyan font-exo2 font-semibold">
            🎮 WASD/Arrows: Move • W/↑: Rotate • SPACE: Pause
          </div>
          <div className="text-xs text-hd-silver font-exo2">
            ✨ Powered by 2006 HD Block Technology ✨
          </div>
        </div>
      </Card>
    </div>
  );
};