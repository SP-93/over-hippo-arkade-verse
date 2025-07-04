import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, RotateCw, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface TetrisGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
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

export const TetrisGame = ({ onScoreChange, onGameEnd }: TetrisGameProps) => {
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
      
      const points = clearedLines === 4 ? 1000 : clearedLines * 100;
      const newScore = score + points * level;
      const newLines = lines + clearedLines;
      
      setScore(newScore);
      setLines(newLines);
      onScoreChange(newScore);
      
      if (newLines >= level * 10) {
        setLevel(prev => prev + 1);
        setDropTime(prev => Math.max(50, prev - 50));
      }
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
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Board */}
      <Card className="flex-1 p-6 bg-gradient-card border-primary">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-primary">Tetris</h3>
          
          <div className="bg-background/50 p-4 rounded-lg border-2 border-primary shadow-neon">
            <div className="flex flex-col">
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

        {/* Mobile Controls */}
        <Card className="p-4 bg-gradient-card border-arcade-gold lg:hidden">
          <h4 className="font-bold text-arcade-gold mb-4">Controls</h4>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => movePiece(-1, 0)}
              className="h-12"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={rotatePieceHandler}
              className="h-12"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => movePiece(1, 0)}
              className="h-12"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div></div>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => movePiece(0, 1)}
              className="h-12"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <div></div>
          </div>
        </Card>

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