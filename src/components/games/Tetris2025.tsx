import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Music, Zap } from "lucide-react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Modern Tetris pieces with enhanced designs
const PIECES = {
  I: { shape: [[1,1,1,1]], color: '#00f5ff', name: 'Cyan Laser' },
  O: { shape: [[1,1],[1,1]], color: '#ffd700', name: 'Gold Block' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#ff00ff', name: 'Magenta Cross' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#00ff88', name: 'Green Wave' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#ff4444', name: 'Red Bolt' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#4488ff', name: 'Blue Hook' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#ff8800', name: 'Orange Stick' }
};

interface Tetris2025Props {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  color: string;
  name: string;
  position: Position;
  rotation: number;
}

export const Tetris2025 = ({ onScoreChange, onGameEnd, onGameStart }: Tetris2025Props = {}) => {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState(1000);
  const [combo, setCombo] = useState(0);
  const [beatSync, setBeatSync] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const particleEffectsRef = useRef<any>();
  const audioContextRef = useRef<AudioContext>();
  
  const { handleGameStart } = useGameManager();

  // Create piece
  const createPiece = useCallback((type?: keyof typeof PIECES): Piece => {
    const pieceType = type || (Object.keys(PIECES) as (keyof typeof PIECES)[])[
      Math.floor(Math.random() * Object.keys(PIECES).length)
    ];
    const piece = PIECES[pieceType];
    
    return {
      shape: piece.shape,
      color: piece.color,
      name: piece.name,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
      rotation: 0
    };
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  // Check collision
  const checkCollision = useCallback((piece: Piece, board: (string | null)[][], offset: Position = { x: 0, y: 0 }): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x + offset.x;
          const newY = piece.position.y + y + offset.y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece: Piece, board: (string | null)[][]): (string | null)[][] => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    
    return newBoard;
  }, []);

  // Clear lines
  const clearLines = useCallback((board: (string | null)[][]): { newBoard: (string | null)[][], linesCleared: number } => {
    const linesToClear: number[] = [];
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y].every(cell => cell !== null)) {
        linesToClear.push(y);
      }
    }
    
    if (linesToClear.length === 0) {
      return { newBoard: board, linesCleared: 0 };
    }
    
    // Create particle effects for cleared lines
    if (particleEffectsRef.current) {
      linesToClear.forEach(lineY => {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          particleEffectsRef.current.createExplosion(
            x * CELL_SIZE + CELL_SIZE / 2,
            lineY * CELL_SIZE + CELL_SIZE / 2,
            5
          );
        }
      });
    }
    
    const newBoard = board.filter((_, index) => !linesToClear.includes(index));
    const emptyLines = Array(linesToClear.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    
    return { newBoard: [...emptyLines, ...newBoard], linesCleared: linesToClear.length };
  }, []);

  // Calculate score
  const calculateScore = useCallback((linesCleared: number, level: number, combo: number): number => {
    const baseScores = [0, 100, 300, 500, 800]; // Single, Double, Triple, Tetris
    let score = baseScores[linesCleared] * level;
    
    // Combo bonus
    if (combo > 0) {
      score += combo * 50 * level;
    }
    
    // Perfect clear bonus
    if (linesCleared === 4) {
      score *= 1.5; // Tetris bonus
      setBeatSync(true);
      setTimeout(() => setBeatSync(false), 500);
    }
    
    return Math.floor(score);
  }, []);

  // Move piece
  const movePiece = useCallback((direction: 'left' | 'right' | 'down' | 'rotate') => {
    if (!currentPiece || !isPlaying || isPaused || gameOver) return false;
    
    let newPiece = { ...currentPiece };
    let offset: Position = { x: 0, y: 0 };
    
    switch (direction) {
      case 'left':
        offset.x = -1;
        break;
      case 'right':
        offset.x = 1;
        break;
      case 'down':
        offset.y = 1;
        break;
      case 'rotate':
        newPiece = rotatePiece(currentPiece);
        break;
    }
    
    if (direction !== 'rotate') {
      newPiece.position.x += offset.x;
      newPiece.position.y += offset.y;
    }
    
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
      
      // Trail effect
      if (particleEffectsRef.current && Math.random() < 0.2) {
        particleEffectsRef.current.createTrail(
          newPiece.position.x * CELL_SIZE + CELL_SIZE / 2,
          newPiece.position.y * CELL_SIZE + CELL_SIZE / 2,
          { x: -offset.x, y: -offset.y }
        );
      }
      
      return true;
    }
    
    // If moving down failed, place the piece
    if (direction === 'down') {
      const newBoard = placePiece(currentPiece, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      
      if (linesCleared > 0) {
        const newCombo = combo + 1;
        const points = calculateScore(linesCleared, level, newCombo);
        const newScore = score + points;
        const newLines = lines + linesCleared;
        
        setScore(newScore);
        setLines(newLines);
        setCombo(newCombo);
        setLevel(Math.floor(newLines / 10) + 1);
        setDropTime(Math.max(50, 1000 - (level * 50)));
        
        onScoreChange?.(newScore);
        
        // Score effect
        if (particleEffectsRef.current) {
          particleEffectsRef.current.createScoreEffect(
            BOARD_WIDTH * CELL_SIZE / 2,
            BOARD_HEIGHT * CELL_SIZE / 2,
            points
          );
        }
        
        const lineNames = ['', 'Single!', 'Double!', 'Triple!', 'TETRIS!'];
        toast.success(`${lineNames[linesCleared]} +${points.toLocaleString()} points`, { 
          duration: 1500 
        });
      } else {
        setCombo(0);
      }
      
      // Spawn next piece
      setCurrentPiece(nextPiece);
      setNextPiece(createPiece());
      
      // Check game over
      if (nextPiece && checkCollision(nextPiece, clearedBoard)) {
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd?.();
        
        // Game over explosion
        if (particleEffectsRef.current) {
          particleEffectsRef.current.createExplosion(
            BOARD_WIDTH * CELL_SIZE / 2,
            CELL_SIZE * 3,
            25
          );
        }
        
        toast.error(`💥 Game Over! Final Score: ${score.toLocaleString()}`);
      }
    }
    
    return false;
  }, [currentPiece, board, isPlaying, isPaused, gameOver, rotatePiece, checkCollision, placePiece, clearLines, calculateScore, score, lines, level, combo, nextPiece, createPiece, onScoreChange, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        movePiece('down');
      }, dropTime);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, gameOver, dropTime, movePiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePiece('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePiece('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePiece('down');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePiece('rotate');
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, isPlaying, gameOver, isPaused]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('tetris')) return;
    
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    const firstPiece = createPiece();
    const secondPiece = createPiece();
    
    setBoard(newBoard);
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setDropTime(1000);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  // Render current piece on board
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board with stronger visual distinction
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              // Mark falling pieces with special prefix for stronger visual
              displayBoard[boardY][boardX] = `falling:${currentPiece.color}`;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  return (
    <div className="space-y-6">
      <Card className={`p-6 glass-card animate-liquid-glow relative overflow-hidden ${beatSync ? 'animate-cyber-pulse' : ''}`}>
        <div className="absolute inset-0 animate-neon-wave opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black neon-cyber font-orbitron animate-particle-float">
              TETRIS 2025
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black neon-quantum">
                  {score.toLocaleString()}
                </div>
                {combo > 0 && (
                  <div className="text-sm neon-electric animate-pulse">
                    COMBO x{combo}
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
              className="liquid-glass neon-cyber font-bold animate-glass-shimmer hover:scale-105"
            >
              {gameOver ? <RotateCcw className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {gameOver ? 'RESTART' : 'START'}
            </Button>
            
            {isPlaying && !gameOver && (
              <Button 
                onClick={pauseGame} 
                variant="secondary"
                className="liquid-glass neon-quantum font-bold"
              >
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'RESUME' : 'PAUSE'}
              </Button>
            )}
          </div>

          <div className="flex gap-6 justify-center">
            {/* Game Board */}
            <div 
              className="relative border-2 border-neon-electric rounded-xl overflow-hidden shadow-quantum"
              style={{ 
                width: BOARD_WIDTH * CELL_SIZE,
                height: BOARD_HEIGHT * CELL_SIZE,
                background: 'radial-gradient(circle at center, rgba(0, 245, 255, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)'
              }}
            >
              {/* Particle Canvas */}
              <ParticleCanvas 
                width={BOARD_WIDTH * CELL_SIZE} 
                height={BOARD_HEIGHT * CELL_SIZE}
                onReady={(effects) => { particleEffectsRef.current = effects; }}
              />
              
              {/* Game Grid */}
              <div className="absolute inset-0 grid" style={{ 
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
              }}>
                {renderBoard().map((row, y) => 
                  row.map((cell, x) => {
                    const isFalling = cell && typeof cell === 'string' && cell.startsWith('falling:');
                    const actualColor = isFalling ? cell.replace('falling:', '') : cell;
                    
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`border transition-all duration-200 ${
                          cell ? 'animate-liquid-glow' : ''
                        } ${isFalling ? 'border-white/40 animate-pulse' : 'border-white/10'}`}
                        style={{
                          background: cell 
                            ? isFalling
                              ? `linear-gradient(135deg, ${actualColor}, ${actualColor})`
                              : `linear-gradient(135deg, ${actualColor}, ${actualColor}aa)`
                            : 'transparent',
                          boxShadow: cell 
                            ? isFalling
                              ? `0 0 20px ${actualColor}, inset 0 0 10px rgba(255,255,255,0.5), 0 0 5px rgba(255,255,255,0.8)`
                              : `0 0 10px ${actualColor}, inset 0 0 5px rgba(255,255,255,0.3)`
                            : 'none',
                          borderRadius: cell ? '2px' : '0'
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Next Piece & Stats */}
            <div className="space-y-4">
              {/* Next Piece */}
              <Card className="p-4 glass-card border-neon-quantum">
                <h4 className="font-bold neon-quantum mb-2">Next</h4>
                {nextPiece && (
                  <div className="grid gap-1" style={{
                    gridTemplateColumns: `repeat(4, 20px)`,
                    gridTemplateRows: `repeat(4, 20px)`
                  }}>
                    {Array(16).fill(null).map((_, index) => {
                      const x = index % 4;
                      const y = Math.floor(index / 4);
                      const inShape = y < nextPiece.shape.length && 
                                     x < nextPiece.shape[y].length && 
                                     nextPiece.shape[y][x];
                      
                      return (
                        <div
                          key={index}
                          className="w-5 h-5 border border-white/10 rounded-sm"
                          style={{
                            background: inShape 
                              ? `linear-gradient(135deg, ${nextPiece.color}, ${nextPiece.color}aa)`
                              : 'transparent',
                            boxShadow: inShape 
                              ? `0 0 8px ${nextPiece.color}`
                              : 'none'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Stats */}
              <Card className="p-4 glass-card border-neon-electric">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm neon-electric">Lines</div>
                    <div className="text-xl font-bold">{lines}</div>
                  </div>
                  <div>
                    <div className="text-sm neon-plasma">Level</div>
                    <div className="text-xl font-bold">{level}</div>
                  </div>
                  {combo > 0 && (
                    <div>
                      <div className="text-sm neon-quantum">Combo</div>
                      <div className="text-xl font-bold animate-pulse">{combo}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm neon-plasma font-exo2 font-semibold">
              🎮 WASD / Arrow Keys • W/↑ to Rotate • SPACE to Pause
            </div>
            <div className="text-xs text-white/60 font-exo2">
              ✨ Clear lines for combos and beat-sync effects ✨
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};