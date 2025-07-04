import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ChevronUp, ChevronDown } from "lucide-react";

interface FlipperGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const GRAVITY = 0.3;
const BALL_RADIUS = 8;
const FLIPPER_LENGTH = 60;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Flipper {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  length: number;
  isLeft: boolean;
}

interface Bumper {
  x: number;
  y: number;
  radius: number;
  points: number;
  hit: boolean;
}

export const FlipperGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: FlipperGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(3); // 1 chip = 3 balls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  // Game objects
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH - 30,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    active: false
  });

  const [flippers, setFlippers] = useState<Flipper[]>([
    { x: 120, y: CANVAS_HEIGHT - 80, angle: 0.3, targetAngle: 0.3, length: FLIPPER_LENGTH, isLeft: true },
    { x: 280, y: CANVAS_HEIGHT - 80, angle: -0.3, targetAngle: -0.3, length: FLIPPER_LENGTH, isLeft: false }
  ]);

  const [bumpers] = useState<Bumper[]>([
    { x: 100, y: 150, radius: 25, points: 100, hit: false },
    { x: 200, y: 120, radius: 25, points: 100, hit: false },
    { x: 300, y: 150, radius: 25, points: 100, hit: false },
    { x: 150, y: 220, radius: 20, points: 200, hit: false },
    { x: 250, y: 220, radius: 20, points: 200, hit: false },
    { x: 200, y: 300, radius: 15, points: 500, hit: false }
  ]);

  const [leftFlipperActive, setLeftFlipperActive] = useState(false);
  const [rightFlipperActive, setRightFlipperActive] = useState(false);

  // Launch ball
  const launchBall = useCallback(() => {
    if (!ball.active && balls > 0) {
      setBall(prev => ({
        ...prev,
        x: CANVAS_WIDTH - 30,
        y: CANVAS_HEIGHT - 200,
        vx: -8 - Math.random() * 4,
        vy: -15 - Math.random() * 5,
        active: true
      }));
    }
  }, [ball.active, balls]);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(230, 35%, 7%)');
    gradient.addColorStop(0.3, 'hsl(240, 30%, 12%)');
    gradient.addColorStop(1, 'hsl(250, 25%, 15%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw playfield borders
    ctx.strokeStyle = 'hsl(280, 100%, 60%)';
    ctx.shadowColor = 'hsl(280, 100%, 60%)';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - 20, 20);
    ctx.lineTo(20, 20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw plunger lane
    ctx.strokeStyle = 'hsl(200, 100%, 60%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH - 50, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - 50, CANVAS_HEIGHT - 300);
    ctx.stroke();

    // Draw bumpers
    bumpers.forEach(bumper => {
      const hitGlow = bumper.hit ? 20 : 5;
      ctx.shadowColor = 'hsl(320, 100%, 60%)';
      ctx.shadowBlur = hitGlow;
      
      const bumperGradient = ctx.createRadialGradient(
        bumper.x, bumper.y, 0,
        bumper.x, bumper.y, bumper.radius
      );
      bumperGradient.addColorStop(0, 'hsl(320, 100%, 70%)');
      bumperGradient.addColorStop(1, 'hsl(320, 100%, 40%)');
      
      ctx.fillStyle = bumperGradient;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Bumper highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(bumper.x - 5, bumper.y - 5, bumper.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw flippers
    flippers.forEach(flipper => {
      ctx.save();
      ctx.translate(flipper.x, flipper.y);
      ctx.rotate(flipper.angle);
      
      // Flipper shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-5, -5, flipper.length + 2, 12);
      
      // Flipper gradient
      const flipperGradient = ctx.createLinearGradient(0, -5, 0, 5);
      flipperGradient.addColorStop(0, 'hsl(45, 100%, 70%)');
      flipperGradient.addColorStop(1, 'hsl(45, 100%, 50%)');
      ctx.fillStyle = flipperGradient;
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, -5, flipper.length, 10);
      
      // Flipper highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, -5, flipper.length, 3);
      
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Draw ball
    if (ball.active) {
      ctx.shadowColor = 'hsl(160, 100%, 50%)';
      ctx.shadowBlur = 15;
      
      const ballGradient = ctx.createRadialGradient(
        ball.x - 3, ball.y - 3, 0,
        ball.x, ball.y, BALL_RADIUS
      );
      ballGradient.addColorStop(0, 'hsl(160, 100%, 70%)');
      ballGradient.addColorStop(1, 'hsl(160, 100%, 40%)');
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(ball.x - 3, ball.y - 3, BALL_RADIUS * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw score multiplier indicator
    if (multiplier > 1) {
      ctx.fillStyle = 'hsl(45, 100%, 60%)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${multiplier}X`, CANVAS_WIDTH / 2, 50);
    }

  }, [ball, flippers, bumpers, multiplier]);

  // Ball physics
  const updateBall = useCallback(() => {
    if (!ball.active || isPaused || gameOver) return;

    setBall(prevBall => {
      let newBall = { ...prevBall };
      
      // Apply gravity
      newBall.vy += GRAVITY;
      
      // Update position
      newBall.x += newBall.vx;
      newBall.y += newBall.vy;

      // Wall collisions
      if (newBall.x - BALL_RADIUS <= 20 || newBall.x + BALL_RADIUS >= CANVAS_WIDTH - 20) {
        newBall.vx = -newBall.vx * 0.8;
        newBall.x = Math.max(20 + BALL_RADIUS, Math.min(CANVAS_WIDTH - 20 - BALL_RADIUS, newBall.x));
      }
      
      if (newBall.y - BALL_RADIUS <= 20) {
        newBall.vy = -newBall.vy * 0.8;
        newBall.y = 20 + BALL_RADIUS;
      }

      // Ball lost (bottom)
      if (newBall.y > CANVAS_HEIGHT + BALL_RADIUS) {
        setBalls(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        setMultiplier(1);
        return { ...newBall, active: false };
      }

      // Bumper collisions
      bumpers.forEach(bumper => {
        const dx = newBall.x - bumper.x;
        const dy = newBall.y - bumper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < BALL_RADIUS + bumper.radius) {
          // Reflect ball
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy) + 2;
          newBall.vx = Math.cos(angle) * speed;
          newBall.vy = Math.sin(angle) * speed;
          
          // Move ball outside bumper
          const overlap = (BALL_RADIUS + bumper.radius) - distance;
          newBall.x += Math.cos(angle) * overlap;
          newBall.y += Math.sin(angle) * overlap;
          
          // Add score
          const points = bumper.points * multiplier;
          setScore(prev => {
            const newScore = prev + points;
            onScoreChange(newScore);
            return newScore;
          });
          
          // Increase multiplier
          setMultiplier(prev => Math.min(prev + 0.5, 5));
          
          // Mark bumper as hit for visual effect
          bumper.hit = true;
          setTimeout(() => { bumper.hit = false; }, 200);
        }
      });

      // Flipper collisions
      flippers.forEach(flipper => {
        const cos = Math.cos(flipper.angle);
        const sin = Math.sin(flipper.angle);
        
        // Transform ball position to flipper's local coordinates
        const localX = (newBall.x - flipper.x) * cos + (newBall.y - flipper.y) * sin;
        const localY = -(newBall.x - flipper.x) * sin + (newBall.y - flipper.y) * cos;
        
        if (localX >= 0 && localX <= flipper.length && Math.abs(localY) <= BALL_RADIUS + 5) {
          // Ball hit flipper
          const flipperSpeed = flipper.isLeft && leftFlipperActive || !flipper.isLeft && rightFlipperActive ? 12 : 6;
          const angle = flipper.angle + (flipper.isLeft ? -Math.PI/4 : Math.PI/4);
          
          newBall.vx = Math.cos(angle) * flipperSpeed;
          newBall.vy = Math.sin(angle) * flipperSpeed;
          
          // Move ball away from flipper
          newBall.y = flipper.y - BALL_RADIUS - 10;
        }
      });

      return newBall;
    });
  }, [ball, flippers, bumpers, leftFlipperActive, rightFlipperActive, score, multiplier, isPaused, gameOver, onScoreChange, onGameEnd]);

  // Update flippers
  const updateFlippers = useCallback(() => {
    setFlippers(prev => prev.map(flipper => {
      const isActive = flipper.isLeft ? leftFlipperActive : rightFlipperActive;
      const targetAngle = flipper.isLeft 
        ? (isActive ? -0.3 : 0.3)
        : (isActive ? 0.3 : -0.3);
      
      return {
        ...flipper,
        angle: flipper.angle + (targetAngle - flipper.angle) * 0.3
      };
    }));
  }, [leftFlipperActive, rightFlipperActive]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          setLeftFlipperActive(true);
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          setRightFlipperActive(true);
          break;
        case ' ':
          e.preventDefault();
          launchBall();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          setLeftFlipperActive(false);
          break;
        case 'd':
        case 'arrowright':
          setRightFlipperActive(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, gameOver, launchBall]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        updateBall();
        updateFlippers();
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
  }, [isPlaying, isPaused, gameOver, updateBall, updateFlippers]);

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
    
    setScore(0);
    setBalls(3);
    setMultiplier(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setBall({
      x: CANVAS_WIDTH - 30,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      active: false
    });
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Canvas */}
      <Card className="flex-1 p-6 bg-gradient-card border-arcade-gold backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-arcade-gold animate-text-glow drop-shadow-lg">⚡ Neon Pinball</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-arcade-gold shadow-intense backdrop-blur-sm">
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

          {gameOver && (
            <div className="text-center space-y-2 animate-zoom-in">
              <h3 className="text-xl font-bold text-danger-red">Game Over!</h3>
              <p className="text-muted-foreground">Final Score: {score.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Max Multiplier: {multiplier}X</p>
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
          <h4 className="font-bold text-neon-green mb-2">Balls Left</h4>
          <p className="text-xl font-bold">{balls}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-pink">
          <h4 className="font-bold text-neon-pink mb-2">Multiplier</h4>
          <p className="text-xl font-bold">{multiplier}X</p>
        </Card>

        {/* Mobile Controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-arcade-gold backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setLeftFlipperActive(true)}
                onTouchEnd={() => setLeftFlipperActive(false)}
                className="h-12 border-arcade-gold text-arcade-gold hover:bg-arcade-gold/20"
              >
                <ChevronUp className="h-5 w-5 transform -rotate-45" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={launchBall}
                className="h-12 border-arcade-gold text-arcade-gold hover:bg-arcade-gold/20"
              >
                Launch
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setRightFlipperActive(true)}
                onTouchEnd={() => setRightFlipperActive(false)}
                className="h-12 border-arcade-gold text-arcade-gold hover:bg-arcade-gold/20"
              >
                <ChevronUp className="h-5 w-5 transform rotate-45" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• A/← Left flipper</p>
            <p>• D/→ Right flipper</p>
            <p>• Spacebar: Launch ball</p>
            <p>• Hit bumpers for points</p>
            <p>• Build multiplier combos</p>
          </div>
        </Card>
      </div>
    </div>
  );
};