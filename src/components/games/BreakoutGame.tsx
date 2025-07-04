import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowLeft, ArrowRight } from "lucide-react";

interface BreakoutGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_SIZE = 8;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_ROWS = 8;
const BRICK_COLS = 10;

export const BreakoutGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: BreakoutGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // 1 chip = 3 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [level, setLevel] = useState(1);

  // Game objects
  const [paddle, setPaddle] = useState({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 });
  const [ball, setBall] = useState({ 
    x: CANVAS_WIDTH / 2, 
    y: CANVAS_HEIGHT - 50, 
    dx: 4, 
    dy: -4 
  });
  const [bricks, setBricks] = useState<Array<{ x: number; y: number; active: boolean; color: string; points: number }>>([]);

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const newBricks = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#ffaaa5'];
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + 5) + 35,
          y: row * (BRICK_HEIGHT + 5) + 50,
          active: true,
          color: colors[row],
          points: (BRICK_ROWS - row) * 10
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(230, 35%, 7%)');
    gradient.addColorStop(1, 'hsl(240, 30%, 12%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks with modern styling
    bricks.forEach(brick => {
      if (brick.active) {
        // Brick shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_WIDTH, BRICK_HEIGHT);
        
        // Brick gradient
        const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + BRICK_HEIGHT);
        brickGradient.addColorStop(0, brick.color);
        brickGradient.addColorStop(1, brick.color + '80');
        ctx.fillStyle = brickGradient;
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        
        // Brick highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, 3);
      }
    });

    // Draw paddle with neon effect
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + PADDLE_HEIGHT);
    paddleGradient.addColorStop(0, 'hsl(280, 100%, 60%)');
    paddleGradient.addColorStop(1, 'hsl(320, 100%, 60%)');
    ctx.fillStyle = paddleGradient;
    ctx.shadowColor = 'hsl(280, 100%, 60%)';
    ctx.shadowBlur = 15;
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.shadowBlur = 0;

    // Draw ball with glow effect
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
    const ballGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_SIZE);
    ballGradient.addColorStop(0, 'hsl(45, 100%, 60%)');
    ballGradient.addColorStop(1, 'hsl(45, 100%, 40%)');
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = 'hsl(45, 100%, 60%)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [paddle, ball, bricks]);

  // Game physics
  const updateGame = useCallback(() => {
    if (isPaused || gameOver || gameWon) return;

    setBall(prevBall => {
      let newBall = { ...prevBall };
      
      // Move ball
      newBall.x += newBall.dx;
      newBall.y += newBall.dy;

      // Wall collisions
      if (newBall.x <= BALL_SIZE || newBall.x >= CANVAS_WIDTH - BALL_SIZE) {
        newBall.dx = -newBall.dx;
      }
      if (newBall.y <= BALL_SIZE) {
        newBall.dy = -newBall.dy;
      }

      // Paddle collision
      if (
        newBall.y + BALL_SIZE >= paddle.y &&
        newBall.x >= paddle.x &&
        newBall.x <= paddle.x + PADDLE_WIDTH &&
        newBall.dy > 0
      ) {
        newBall.dy = -newBall.dy;
        // Add spin based on where ball hits paddle
        const hitPos = (newBall.x - paddle.x) / PADDLE_WIDTH;
        newBall.dx = (hitPos - 0.5) * 8;
      }

      // Bottom wall (lose life)
      if (newBall.y > CANVAS_HEIGHT) {
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        // Reset ball position
        newBall = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 };
      }

      return newBall;
    });

    // Brick collisions
    setBricks(prevBricks => {
      const newBricks = [...prevBricks];
      let scoreIncrease = 0;
      
      newBricks.forEach(brick => {
        if (brick.active &&
            ball.x + BALL_SIZE >= brick.x &&
            ball.x - BALL_SIZE <= brick.x + BRICK_WIDTH &&
            ball.y + BALL_SIZE >= brick.y &&
            ball.y - BALL_SIZE <= brick.y + BRICK_HEIGHT) {
          
          brick.active = false;
          scoreIncrease += brick.points;
          
          setBall(prevBall => ({ ...prevBall, dy: -prevBall.dy }));
        }
      });

      if (scoreIncrease > 0) {
        const newScore = score + scoreIncrease;
        setScore(newScore);
        onScoreChange(newScore);
      }

      // Check if all bricks are destroyed
      if (newBricks.every(brick => !brick.active)) {
        setGameWon(true);
        setIsPlaying(false);
        onGameEnd(score + scoreIncrease);
      }

      return newBricks;
    });
  }, [ball, paddle, bricks, score, isPaused, gameOver, gameWon, onScoreChange, onGameEnd]);

  // Paddle movement
  const movePaddle = useCallback((direction: 'left' | 'right') => {
    if (!isPlaying || isPaused || gameOver) return;
    
    setPaddle(prev => {
      let newX = prev.x;
      if (direction === 'left') {
        newX = Math.max(0, prev.x - 20);
      } else {
        newX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, prev.x + 20);
      }
      return { ...prev, x: newX };
    });
  }, [isPlaying, isPaused, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePaddle('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePaddle('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePaddle, isPlaying, isPaused, gameOver]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver && !gameWon) {
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 16); // ~60 FPS
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
  }, [isPlaying, isPaused, gameOver, gameWon, updateGame]);

  // Render loop
  useEffect(() => {
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [render]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) {
      return;
    }
    
    initializeBricks();
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameWon(false);
    setIsPlaying(true);
    setIsPaused(false);
    setPaddle({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 });
    setBall({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 });
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Canvas */}
      <Card className="flex-1 p-6 bg-gradient-card border-neon-pink backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-neon-pink animate-text-glow drop-shadow-lg">🧱 Breakout Arena</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-neon-pink shadow-intense backdrop-blur-sm">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-primary/30 rounded-lg bg-gradient-to-br from-background/40 to-background/20"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
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

          {(gameOver || gameWon) && (
            <div className="text-center space-y-2 animate-zoom-in">
              <h3 className="text-xl font-bold text-neon-pink">
                {gameWon ? 'Level Complete!' : 'Game Over!'}
              </h3>
              <p className="text-muted-foreground">Final Score: {score.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Level: {level}</p>
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
          <h4 className="font-bold text-neon-green mb-2">Lives</h4>
          <p className="text-xl font-bold">{lives}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-pink">
          <h4 className="font-bold text-neon-pink mb-2">Level</h4>
          <p className="text-xl font-bold">{level}</p>
        </Card>

        {/* Mobile Controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-neon-pink backdrop-blur-sm">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => movePaddle('left')}
                className="h-12 w-12 border-neon-pink text-neon-pink hover:bg-neon-pink/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => movePaddle('right')}
                className="h-12 w-12 border-neon-pink text-neon-pink hover:bg-neon-pink/20"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Arrow keys: Move paddle</p>
            <p>• Break all bricks to win</p>
            <p>• Don't let ball fall off screen</p>
            <p>• Higher rows = more points</p>
            <p>• 3 lives per game</p>
          </div>
        </Card>
      </div>
    </div>
  );
};