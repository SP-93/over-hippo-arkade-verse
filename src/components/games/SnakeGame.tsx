import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface SnakeGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number; // Number of chips consumed for this game session
}

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export const SnakeGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: SnakeGameProps) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [bonusFood, setBonusFood] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(2); // 1 chip = 2 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [bonusTimer, setBonusTimer] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const bonusTimerRef = useRef<NodeJS.Timeout>();

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (isPaused || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd(score);
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        onGameEnd(score);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange(newScore);
        setFood(generateFood());
        
        // Increase speed every 5 points
        if (newScore % 50 === 0) {
          setSpeed(prev => Math.max(50, prev - 10));
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, score, isPaused, gameOver, onScoreChange, onGameEnd, generateFood]);

  const changeDirection = useCallback((newDirection: { x: number; y: number }) => {
    if (!isPlaying || isPaused || gameOver) return;
    
    // Prevent reverse direction
    if (newDirection.x === -direction.x && newDirection.y === -direction.y) return;
    
    setDirection(newDirection);
  }, [direction, isPlaying, isPaused, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, isPlaying, isPaused, gameOver]);

  // Generate bonus food every 2 minutes
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      bonusTimerRef.current = setInterval(() => {
        if (!bonusFood.active) {
          const newBonusFood = generateFood();
          setBonusFood({ ...newBonusFood, active: true });
          setTimeout(() => {
            setBonusFood(prev => ({ ...prev, active: false }));
          }, 10000); // 10 seconds timeout
        }
      }, 120000); // 2 minutes
    }
    return () => {
      if (bonusTimerRef.current) clearInterval(bonusTimerRef.current);
    };
  }, [isPlaying, isPaused, gameOver, bonusFood.active, generateFood]);

  // Main game loop - dodano!
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        moveSnake();
      }, speed);
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

  const handleCollision = useCallback(() => {
    if (lives > 1) {
      setLives(prev => prev - 1);
      setSnake(INITIAL_SNAKE);
      setDirection(INITIAL_DIRECTION);
    } else {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd(score);
    }
  }, [lives, score, onGameEnd]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) {
      return; // Don't start if chip consumption failed
    }
    
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 15, y: 15 });
    setScore(0);
    setSpeed(150);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const renderBoard = () => {
    const board = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        let cellType = 'empty';
        
        const snakeSegmentIndex = snake.findIndex(segment => segment.x === x && segment.y === y);
        if (snakeSegmentIndex !== -1) {
          cellType = snakeSegmentIndex === 0 ? 'head' : 'body';
        } else if (food.x === x && food.y === y) {
          cellType = 'food';
        }

        board.push(
          <div
            key={`${x}-${y}`}
            className={`w-6 h-6 border border-border/10 relative overflow-hidden ${
              cellType === 'empty' ? 'bg-gradient-to-br from-muted/5 to-muted/10' : ''
            }`}
            style={{
              background: cellType === 'empty' 
                ? 'linear-gradient(135deg, hsl(var(--muted) / 0.05), hsl(var(--muted) / 0.1))'
                : 'transparent'
            }}
          >
            {cellType === 'head' && (
              <div 
                className="w-full h-full relative overflow-hidden rounded-sm"
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                  boxShadow: '0 0 8px hsl(var(--neon-green))',
                }}
              >
                <div className="absolute inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-sm"></div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
              </div>
            )}
            {cellType === 'body' && (
              <div 
                className="w-full h-full rounded-sm"
                style={{
                  background: 'linear-gradient(135deg, #00dd77, #00aa55)',
                  boxShadow: '0 0 4px hsl(var(--primary))',
                }}
              >
                <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-sm"></div>
              </div>
            )}
            {cellType === 'food' && (
              <div 
                className="w-full h-full rounded-full animate-bounce relative"
                style={{
                  background: 'linear-gradient(135deg, #ff4444, #cc2222)',
                  boxShadow: '0 0 12px hsl(var(--arcade-gold))',
                }}
              >
                <div className="absolute inset-1 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-white/80 rounded-full"></div>
              </div>
            )}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Board */}
      <Card className="flex-1 p-6 bg-gradient-card border-neon-green backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-neon-green animate-text-glow drop-shadow-lg">🐍 Snake Adventure</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-neon-green shadow-intense backdrop-blur-sm">
            <div 
              className="grid gap-0 bg-gradient-to-br from-background/40 to-background/20 p-3 rounded-lg border border-primary/30"
              style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
            >
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
              <p className="text-sm text-muted-foreground">Snake Length: {snake.length}</p>
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
          <h4 className="font-bold text-neon-green mb-2">Length</h4>
          <p className="text-xl font-bold">{snake.length}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-pink">
          <h4 className="font-bold text-neon-pink mb-2">Speed</h4>
          <p className="text-xl font-bold">{Math.round((200 - speed) / 2)}%</p>
        </Card>

        {/* Mobile Controls - Fixed Position */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-neon-green backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-3">
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => changeDirection({ x: 0, y: -1 })}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <div></div>
              
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => changeDirection({ x: -1, y: 0 })}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => changeDirection({ x: 1, y: 0 })}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => changeDirection({ x: 0, y: 1 })}
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
            <p>• Arrow keys: Change direction</p>
            <p>• Eat food to grow and score</p>
            <p>• Avoid walls and yourself</p>
            <p>• Speed increases with score</p>
            <p>• Each food = 10 points</p>
          </div>
        </Card>
      </div>
    </div>
  );
};