import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCw, Zap } from "lucide-react";

interface AsteroidsGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface Ship {
  x: number;
  y: number;
  angle: number;
  velocity: { x: number; y: number };
  thrust: boolean;
}

interface Asteroid {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  size: number;
  angle: number;
  rotationSpeed: number;
  points: number;
}

interface Bullet {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  life: number;
}

export const AsteroidsGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: AsteroidsGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // 1 chip = 3 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  // Game objects
  const [ship, setShip] = useState<Ship>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    angle: 0,
    velocity: { x: 0, y: 0 },
    thrust: false
  });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Initialize asteroids for level
  const initializeAsteroids = useCallback((level: number) => {
    const newAsteroids: Asteroid[] = [];
    const asteroidCount = Math.min(4 + level * 2, 12);
    
    for (let i = 0; i < asteroidCount; i++) {
      let x, y;
      // Spawn away from ship
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (
        Math.sqrt((x - CANVAS_WIDTH / 2) ** 2 + (y - CANVAS_HEIGHT / 2) ** 2) < 100
      );

      newAsteroids.push({
        x,
        y,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        },
        size: 40 + Math.random() * 20,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        points: 100
      });
    }
    setAsteroids(newAsteroids);
  }, []);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
    );
    gradient.addColorStop(0, 'hsl(230, 35%, 7%)');
    gradient.addColorStop(1, 'hsl(220, 40%, 4%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 53) % CANVAS_HEIGHT;
      const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    // Ship body with neon effect
    ctx.strokeStyle = 'hsl(200, 100%, 60%)';
    ctx.shadowColor = 'hsl(200, 100%, 60%)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.stroke();

    // Thrust effect
    if (ship.thrust) {
      ctx.fillStyle = 'hsl(45, 100%, 60%)';
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-15, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw asteroids
    asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.angle);
      
      // Asteroid with rough edges
      ctx.strokeStyle = 'hsl(320, 100%, 60%)';
      ctx.shadowColor = 'hsl(320, 100%, 60%)';
      ctx.shadowBlur = 5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sides = 8;
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const radius = asteroid.size + Math.sin(angle * 3) * 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = 'hsl(45, 100%, 60%)';
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

  }, [ship, asteroids, bullets]);

  // Game physics
  const updateGame = useCallback(() => {
    if (isPaused || gameOver) return;

    // Update ship
    setShip(prevShip => {
      let newShip = { ...prevShip };
      
      // Rotation
      if (keys['ArrowLeft']) newShip.angle -= 0.15;
      if (keys['ArrowRight']) newShip.angle += 0.15;
      
      // Thrust
      newShip.thrust = keys['ArrowUp'] || keys[' '];
      if (newShip.thrust) {
        newShip.velocity.x += Math.cos(newShip.angle) * 0.5;
        newShip.velocity.y += Math.sin(newShip.angle) * 0.5;
      }
      
      // Apply friction
      newShip.velocity.x *= 0.98;
      newShip.velocity.y *= 0.98;
      
      // Move ship
      newShip.x += newShip.velocity.x;
      newShip.y += newShip.velocity.y;
      
      // Wrap around screen
      if (newShip.x < 0) newShip.x = CANVAS_WIDTH;
      if (newShip.x > CANVAS_WIDTH) newShip.x = 0;
      if (newShip.y < 0) newShip.y = CANVAS_HEIGHT;
      if (newShip.y > CANVAS_HEIGHT) newShip.y = 0;
      
      return newShip;
    });

    // Update asteroids
    setAsteroids(prevAsteroids => 
      prevAsteroids.map(asteroid => ({
        ...asteroid,
        x: (asteroid.x + asteroid.velocity.x + CANVAS_WIDTH) % CANVAS_WIDTH,
        y: (asteroid.y + asteroid.velocity.y + CANVAS_HEIGHT) % CANVAS_HEIGHT,
        angle: asteroid.angle + asteroid.rotationSpeed
      }))
    );

    // Update bullets
    setBullets(prevBullets => 
      prevBullets
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.velocity.x,
          y: bullet.y + bullet.velocity.y,
          life: bullet.life - 1
        }))
        .filter(bullet => bullet.life > 0 && 
                bullet.x >= 0 && bullet.x <= CANVAS_WIDTH &&
                bullet.y >= 0 && bullet.y <= CANVAS_HEIGHT)
    );

    // Check collisions
    // Ship-asteroid collision
    asteroids.forEach(asteroid => {
      const dx = ship.x - asteroid.x;
      const dy = ship.y - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < asteroid.size + 10) {
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        // Respawn ship
        setShip(prev => ({
          ...prev,
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          velocity: { x: 0, y: 0 }
        }));
      }
    });

    // Bullet-asteroid collision
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets];
      
      setAsteroids(prevAsteroids => {
        const remainingAsteroids = [...prevAsteroids];
        let scoreIncrease = 0;
        
        for (let i = remainingBullets.length - 1; i >= 0; i--) {
          const bullet = remainingBullets[i];
          
          for (let j = remainingAsteroids.length - 1; j >= 0; j--) {
            const asteroid = remainingAsteroids[j];
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size + 2) {
              scoreIncrease += asteroid.points;
              remainingBullets.splice(i, 1);
              remainingAsteroids.splice(j, 1);
              
              // Split large asteroids
              if (asteroid.size > 20) {
                const newSize = asteroid.size / 2;
                for (let k = 0; k < 2; k++) {
                  remainingAsteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    velocity: {
                      x: (Math.random() - 0.5) * 6,
                      y: (Math.random() - 0.5) * 6
                    },
                    size: newSize,
                    angle: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    points: asteroid.points / 2
                  });
                }
              }
              break;
            }
          }
        }
        
        if (scoreIncrease > 0) {
          const newScore = score + scoreIncrease;
          setScore(newScore);
          onScoreChange(newScore);
        }
        
        // Check if level complete
        if (remainingAsteroids.length === 0) {
          setLevel(prev => prev + 1);
          setTimeout(() => initializeAsteroids(level + 1), 1000);
        }
        
        return remainingAsteroids;
      });
      
      return remainingBullets;
    });

  }, [ship, asteroids, bullets, keys, score, level, isPaused, gameOver, onScoreChange, onGameEnd, initializeAsteroids]);

  // Shoot bullet
  const shoot = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;
    
    setBullets(prev => [
      ...prev,
      {
        x: ship.x + Math.cos(ship.angle) * 15,
        y: ship.y + Math.sin(ship.angle) * 15,
        velocity: {
          x: Math.cos(ship.angle) * 8,
          y: Math.sin(ship.angle) * 8
        },
        life: 120
      }
    ]);
  }, [ship, isPlaying, isPaused, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
      if (e.key === ' ') {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shoot]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
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
  }, [isPlaying, isPaused, gameOver, updateGame]);

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
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setShip({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: 0,
      velocity: { x: 0, y: 0 },
      thrust: false
    });
    setBullets([]);
    initializeAsteroids(1);
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
          <h3 className="text-2xl font-bold text-arcade-gold animate-text-glow drop-shadow-lg">🚀 Asteroids Command</h3>
          
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
              <p className="text-sm text-muted-foreground">Level Reached: {level}</p>
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
          <Card className="p-3 bg-gradient-card/95 border-arcade-gold backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowLeft': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowLeft': false }))}
                className="h-10 text-xs border-arcade-gold text-arcade-gold"
              >
                <RotateCw className="h-4 w-4 transform -scale-x-100" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={shoot}
                className="h-10 text-xs border-arcade-gold text-arcade-gold"
              >
                <Zap className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowRight': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowRight': false }))}
                className="h-10 text-xs border-arcade-gold text-arcade-gold"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowUp': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowUp': false }))}
                className="h-10 text-xs border-arcade-gold text-arcade-gold"
              >
                🚀
              </Button>
              <div></div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Arrow keys: Rotate & thrust</p>
            <p>• Spacebar: Shoot</p>
            <p>• Destroy all asteroids</p>
            <p>• Large asteroids split in two</p>
            <p>• Avoid asteroid collisions</p>
          </div>
        </Card>
      </div>
    </div>
  );
};