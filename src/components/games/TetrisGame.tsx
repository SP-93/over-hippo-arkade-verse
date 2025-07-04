import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, RotateCw, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { TetrisBackground } from "@/components/TetrisBackground";

interface TetrisGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TETRIS_PIECES = [
  { name: 'I', shape: [[1,1,1,1]], color: 'hsl(180 100% 50%)' },
  { name: 'O', shape: [[1,1],[1,1]], color: 'hsl(60 100% 50%)' },
  { name: 'T', shape: [[0,1,0],[1,1,1]], color: 'hsl(300 100% 50%)' },
  { name: 'S', shape: [[0,1,1],[1,1,0]], color: 'hsl(120 100% 50%)' },
  { name: 'Z', shape: [[1,1,0],[0,1,1]], color: 'hsl(0 100% 50%)' },
  { name: 'J', shape: [[1,0,0],[1,1,1]], color: 'hsl(240 100% 50%)' },
  { name: 'L', shape: [[0,0,1],[1,1,1]], color: 'hsl(30 100% 50%)' }
];

export const TetrisGame = ({ onScoreChange, onGameEnd, onGameStart }: TetrisGameProps) => {
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [dropTime, setDropTime] = useState(1000);
  const [combo, setCombo] = useState(0);
  const [comboDisplay, setComboDisplay] = useState('');

  // Combo messages
  const getComboMessage = (linesCleared: number) => {
    switch(linesCleared) {
      case 1: return 'Single!';
      case 2: return 'Double! x2';
      case 3: return 'Triple! x3';
      case 4: return 'TETRIS! x4';
      default: return '';
    }
  };

  const getRandomPiece = useCallback(() => {
    const piece = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    return {
      ...piece,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0
    };
  }, []);

  const isValidMove = useCallback((piece: any, newX: number, newY: number, newShape?: number[][]) => {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (
            boardX < 0 || 
            boardX >= BOARD_WIDTH || 
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && board[boardY][boardX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  const rotatePiece = useCallback((piece: any) => {
    const rotated = piece.shape[0].map((_: any, index: number) =>
      piece.shape.map((row: number[]) => row[index]).reverse()
    );
    return rotated;
  }, []);

  const clearLines = useCallback(() => {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const clearedLines = BOARD_HEIGHT - newBoard.length;
    
    if (clearedLines > 0) {
      const emptyRows = Array(clearedLines).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
      const updatedBoard = [...emptyRows, ...newBoard];
      setBoard(updatedBoard);
      
      // Enhanced scoring with combo system
      let basePoints = 0;
      let multiplier = 1;
      
      switch(clearedLines) {
        case 1:
          basePoints = 100;
          multiplier = 1;
          break;
        case 2:
          basePoints = 300; // Double bonus
          multiplier = 2;
          break;
        case 3:
          basePoints = 500; // Triple bonus
          multiplier = 3;
          break;
        case 4:
          basePoints = 800; // TETRIS bonus
          multiplier = 4;
          break;
      }
      
      const points = basePoints * level * multiplier;
      const newScore = score + points;
      const newLines = lines + clearedLines;
      
      setScore(newScore);
      setLines(newLines);
      setCombo(clearedLines);
      setComboDisplay(getComboMessage(clearedLines));
      onScoreChange(newScore);
      
      // Clear combo message after 2 seconds
      setTimeout(() => {
        setComboDisplay('');
      }, 2000);
      
      if (newLines >= level * 10) {
        setLevel(prev => prev + 1);
        setDropTime(prev => Math.max(50, prev - 50));
      }
    } else {
      setCombo(0);
    }
  }, [board, score, level, lines, onScoreChange]);

  const placePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = [...board];
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }
    setBoard(newBoard);
    
    // Check game over
    if (currentPiece.y <= 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd(score);
      return;
    }
    
    setCurrentPiece(getRandomPiece());
    clearLines();
  }, [currentPiece, board, score, onGameEnd, getRandomPiece, clearLines]);

  const movePiece = useCallback((deltaX: number, deltaY: number) => {
    if (!currentPiece || isPaused || gameOver) return;
    
    const newX = currentPiece.x + deltaX;
    const newY = currentPiece.y + deltaY;
    
    if (isValidMove(currentPiece, newX, newY)) {
      setCurrentPiece(prev => ({...prev, x: newX, y: newY}));
    } else if (deltaY > 0) {
      placePiece();
    }
  }, [currentPiece, isPaused, gameOver, isValidMove, placePiece]);

  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    
    const rotated = rotatePiece(currentPiece);
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotated)) {
      setCurrentPiece(prev => ({...prev, shape: rotated}));
    }
  }, [currentPiece, isPaused, gameOver, rotatePiece, isValidMove]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotatePieceHandler();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, gameOver, movePiece, rotatePieceHandler]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        movePiece(0, 1);
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

  const startGame = () => {
    if (onGameStart && !onGameStart()) {
      return; // Don't start if chip consumption failed
    }
    
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(1000);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-6 h-6 border border-border/30 ${
              cell ? 'shadow-neon' : 'bg-muted/20'
            }`}
            style={{ backgroundColor: cell || 'transparent' }}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 relative">
      {/* Interactive Background */}
      <TetrisBackground score={score} level={level} lines={lines} />
      
      {/* Game Board */}
      <Card className="flex-1 p-6 bg-gradient-card border-neon-blue backdrop-glass hover-lift relative z-10">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-neon-blue animate-text-glow drop-shadow-lg">🟦 Tetris Master</h3>
          
          {/* Combo Display */}
          {comboDisplay && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 animate-zoom-in">
              <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xl font-bold shadow-neon-strong animate-bounce">
                {comboDisplay}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-background/90 to-background/70 p-6 rounded-xl border-2 border-neon-blue shadow-intense backdrop-blur-sm">
            <div className="flex flex-col bg-gradient-to-br from-background/60 to-background/40 p-3 rounded-lg border border-primary/30">
              {renderBoard()}
            </div>
          </div>

          <div className="flex gap-2">
            {!isPlaying ? (
              <Button onClick={startGame} variant="default" className="animate-neon-pulse">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={pauseGame} variant="secondary">
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}
          </div>

          {gameOver && (
            <div className="text-center space-y-2 animate-zoom-in">
              <h3 className="text-xl font-bold text-danger-red">Game Over!</h3>
              <p className="text-muted-foreground">Final Score: {score.toLocaleString()}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Game Info */}
      <div className="w-full lg:w-64 space-y-4">
        <Card className="p-4 bg-gradient-card border-neon-blue">
          <h4 className="font-bold text-neon-blue mb-2">Score</h4>
          <p className="text-2xl font-bold text-arcade-gold">{score.toLocaleString()}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-green">
          <h4 className="font-bold text-neon-green mb-2">Level</h4>
          <p className="text-xl font-bold">{level}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-pink">
          <h4 className="font-bold text-neon-pink mb-2">Lines</h4>
          <p className="text-xl font-bold">{lines}</p>
        </Card>

        {/* Mobile Controls - Fixed Position */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-arcade-gold backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => movePiece(-1, 0)}
                className="h-12 w-12 border-arcade-gold text-arcade-gold hover:bg-arcade-gold/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={rotatePieceHandler}
                className="h-12 w-12 border-primary text-primary hover:bg-primary/20"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => movePiece(1, 0)}
                className="h-12 w-12 border-arcade-gold text-arcade-gold hover:bg-arcade-gold/20"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => movePiece(0, 1)}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
              <div></div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Arrow keys: Move pieces</p>
            <p>• Up arrow/Space: Rotate</p>
            <p>• Down arrow: Drop faster</p>
            <p>• Clear lines to score points</p>
            <p>• Level increases every 10 lines</p>
          </div>
        </Card>
      </div>
    </div>
  );
};