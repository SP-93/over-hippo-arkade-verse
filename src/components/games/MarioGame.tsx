import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";

interface MarioGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 4;
const PLAYER_SIZE = 24;

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 'left' | 'right';
  animFrame: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'floating' | 'brick';
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animFrame: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  alive: boolean;
  type: 'goomba' | 'koopa';
  animFrame: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const MarioGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: MarioGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // 1 chip = 3 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [cameraX, setCameraX] = useState(0);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 'right',
    animFrame: 0
  });

  const [platforms] = useState<Platform[]>([
    // Ground platforms
    { x: 0, y: CANVAS_HEIGHT - 20, width: 1600, height: 20, type: 'ground' },
    
    // Floating platforms
    { x: 200, y: CANVAS_HEIGHT - 120, width: 100, height: 20, type: 'floating' },
    { x: 400, y: CANVAS_HEIGHT - 160, width: 120, height: 20, type: 'floating' },
    { x: 650, y: CANVAS_HEIGHT - 100, width: 80, height: 20, type: 'brick' },
    { x: 800, y: CANVAS_HEIGHT - 140, width: 100, height: 20, type: 'floating' },
    { x: 1000, y: CANVAS_HEIGHT - 180, width: 120, height: 20, type: 'brick' },
    { x: 1200, y: CANVAS_HEIGHT - 120, width: 100, height: 20, type: 'floating' },
    { x: 1400, y: CANVAS_HEIGHT - 200, width: 150, height: 20, type: 'floating' },
  ]);

  const [coins, setCoins] = useState<Coin[]>([
    { x: 250, y: CANVAS_HEIGHT - 160, collected: false, animFrame: 0 },
    { x: 450, y: CANVAS_HEIGHT - 200, collected: false, animFrame: 0 },
    { x: 680, y: CANVAS_HEIGHT - 140, collected: false, animFrame: 0 },
    { x: 850, y: CANVAS_HEIGHT - 180, collected: false, animFrame: 0 },
    { x: 1050, y: CANVAS_HEIGHT - 220, collected: false, animFrame: 0 },
    { x: 1250, y: CANVAS_HEIGHT - 160, collected: false, animFrame: 0 },
    { x: 1450, y: CANVAS_HEIGHT - 240, collected: false, animFrame: 0 },
  ]);

  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 300, y: CANVAS_HEIGHT - 60, vx: -1, width: 20, height: 20, alive: true, type: 'goomba', animFrame: 0 },
    { x: 500, y: CANVAS_HEIGHT - 60, vx: 1, width: 24, height: 24, alive: true, type: 'koopa', animFrame: 0 },
    { x: 750, y: CANVAS_HEIGHT - 60, vx: -1, width: 20, height: 20, alive: true, type: 'goomba', animFrame: 0 },
    { x: 1100, y: CANVAS_HEIGHT - 60, vx: 1, width: 24, height: 24, alive: true, type: 'koopa', animFrame: 0 },
    { x: 1300, y: CANVAS_HEIGHT - 60, vx: -1, width: 20, height: 20, alive: true, type: 'goomba', animFrame: 0 },
  ]);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Add particles
  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -8 - 2,
        life: 30 + Math.random() * 20,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(200, 100%, 70%)');
    gradient.addColorStop(1, 'hsl(200, 100%, 50%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    for (let i = 0; i < 5; i++) {
      const cloudX = (i * 300 + 100 - cameraX * 0.3) % (CANVAS_WIDTH + 200);
      const cloudY = 50 + Math.sin(i) * 30;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 25, cloudY, 35, 0, Math.PI * 2);
      ctx.arc(cloudX + 50, cloudY, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Save context for camera transform
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw platforms
    platforms.forEach(platform => {
      let platformGradient;
      switch (platform.type) {
        case 'ground':
          platformGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
          platformGradient.addColorStop(0, 'hsl(120, 50%, 40%)');
          platformGradient.addColorStop(1, 'hsl(120, 50%, 30%)');
          break;
        case 'floating':
          platformGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
          platformGradient.addColorStop(0, 'hsl(45, 100%, 60%)');
          platformGradient.addColorStop(1, 'hsl(45, 100%, 50%)');
          break;
        case 'brick':
          platformGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
          platformGradient.addColorStop(0, 'hsl(20, 80%, 60%)');
          platformGradient.addColorStop(1, 'hsl(20, 80%, 50%)');
          break;
      }

      ctx.fillStyle = platformGradient!;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(platform.x, platform.y, platform.width, 3);
    });
    ctx.shadowBlur = 0;

    // Draw coins
    coins.forEach(coin => {
      if (!coin.collected) {
        const rotation = (Date.now() * 0.005 + coin.animFrame) % (Math.PI * 2);
        
        ctx.save();
        ctx.translate(coin.x + 10, coin.y + 10);
        ctx.rotate(rotation);
        
        // Coin glow
        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 15;
        
        const coinGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        coinGradient.addColorStop(0, 'hsl(45, 100%, 70%)');
        coinGradient.addColorStop(1, 'hsl(45, 100%, 50%)');
        ctx.fillStyle = coinGradient;
        
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-3, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    });
    ctx.shadowBlur = 0;

    // Draw enemies
    enemies.forEach(enemy => {
      if (enemy.alive) {
        const bounceY = Math.sin(Date.now() * 0.01 + enemy.animFrame) * 2;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        
        let enemyGradient;
        if (enemy.type === 'goomba') {
          enemyGradient = ctx.createLinearGradient(0, enemy.y, 0, enemy.y + enemy.height);
          enemyGradient.addColorStop(0, 'hsl(30, 80%, 50%)');
          enemyGradient.addColorStop(1, 'hsl(30, 80%, 40%)');
        } else {
          enemyGradient = ctx.createLinearGradient(0, enemy.y, 0, enemy.y + enemy.height);
          enemyGradient.addColorStop(0, 'hsl(120, 60%, 50%)');
          enemyGradient.addColorStop(1, 'hsl(120, 60%, 40%)');
        }
        
        ctx.fillStyle = enemyGradient;
        ctx.fillRect(enemy.x, enemy.y + bounceY, enemy.width, enemy.height);
        
        // Enemy eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(enemy.x + 4, enemy.y + 4 + bounceY, 4, 4);
        ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 4 + bounceY, 4, 4);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 5, enemy.y + 5 + bounceY, 2, 2);
        ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 5 + bounceY, 2, 2);
      }
    });
    ctx.shadowBlur = 0;

    // Draw player (hippo character)
    const bounceY = player.grounded ? 0 : Math.sin(Date.now() * 0.02) * 1;
    
    ctx.save();
    ctx.translate(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
    if (player.facing === 'left') ctx.scale(-1, 1);
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-PLAYER_SIZE/2, PLAYER_SIZE/2 - 2, PLAYER_SIZE, 4);
    
    // Player body gradient
    const playerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_SIZE/2);
    playerGradient.addColorStop(0, 'hsl(280, 100%, 70%)');
    playerGradient.addColorStop(1, 'hsl(280, 100%, 50%)');
    ctx.fillStyle = playerGradient;
    ctx.shadowColor = 'hsl(280, 100%, 60%)';
    ctx.shadowBlur = 10;
    
    // Hippo body
    ctx.beginPath();
    ctx.arc(0, bounceY, PLAYER_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Hippo snout
    ctx.fillStyle = 'hsl(280, 100%, 60%)';
    ctx.fillRect(-PLAYER_SIZE/2 + 2, bounceY - 4, PLAYER_SIZE/3, 8);
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-4, bounceY - 6, 3, 0, Math.PI * 2);
    ctx.arc(4, bounceY - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-3, bounceY - 6, 1.5, 0, Math.PI * 2);
    ctx.arc(5, bounceY - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Nostrils
    ctx.fillStyle = 'hsl(280, 100%, 40%)';
    ctx.beginPath();
    ctx.arc(-PLAYER_SIZE/2 + 8, bounceY - 2, 1, 0, Math.PI * 2);
    ctx.arc(-PLAYER_SIZE/2 + 8, bounceY + 2, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 50;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Restore context
    ctx.restore();

    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${lives}`, 20, 30);
    ctx.fillText(`Level: ${level}`, 20, 50);

  }, [player, platforms, coins, enemies, particles, cameraX, lives, level]);

  // Collision detection
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Game physics
  const updateGame = useCallback(() => {
    if (isPaused || gameOver) return;

    // Update player
    setPlayer(prevPlayer => {
      let newPlayer = { ...prevPlayer };
      
      // Handle input
      if (keys['ArrowLeft'] || keys['a']) {
        newPlayer.vx = -PLAYER_SPEED;
        newPlayer.facing = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        newPlayer.vx = PLAYER_SPEED;
        newPlayer.facing = 'right';
      } else {
        newPlayer.vx *= 0.8; // Friction
      }
      
      if ((keys['ArrowUp'] || keys[' ']) && newPlayer.grounded) {
        newPlayer.vy = JUMP_FORCE;
        newPlayer.grounded = false;
      }
      
      // Apply gravity
      if (!newPlayer.grounded) {
        newPlayer.vy += GRAVITY;
      }
      
      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;
      
      // Platform collisions
      newPlayer.grounded = false;
      platforms.forEach(platform => {
        const playerRect = {
          x: newPlayer.x,
          y: newPlayer.y,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE
        };
        
        if (checkCollision(playerRect, platform)) {
          // Landing on top
          if (prevPlayer.y + PLAYER_SIZE <= platform.y && newPlayer.vy >= 0) {
            newPlayer.y = platform.y - PLAYER_SIZE;
            newPlayer.vy = 0;
            newPlayer.grounded = true;
          }
          // Hitting from below
          else if (prevPlayer.y >= platform.y + platform.height && newPlayer.vy <= 0) {
            newPlayer.y = platform.y + platform.height;
            newPlayer.vy = 0;
          }
          // Side collisions
          else if (newPlayer.vy === 0 || Math.abs(newPlayer.vy) < 2) {
            if (prevPlayer.x + PLAYER_SIZE <= platform.x) {
              newPlayer.x = platform.x - PLAYER_SIZE;
            } else if (prevPlayer.x >= platform.x + platform.width) {
              newPlayer.x = platform.x + platform.width;
            }
            newPlayer.vx = 0;
          }
        }
      });
      
      // World boundaries
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.y > CANVAS_HEIGHT) {
        // Player fell - lose life
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        // Reset position
        newPlayer.x = 100;
        newPlayer.y = CANVAS_HEIGHT - 100;
        newPlayer.vx = 0;
        newPlayer.vy = 0;
      }
      
      return newPlayer;
    });

    // Update camera
    setCameraX(prev => {
      const targetX = player.x - CANVAS_WIDTH / 2;
      const clampedX = Math.max(0, Math.min(targetX, 1600 - CANVAS_WIDTH));
      return prev + (clampedX - prev) * 0.1;
    });

    // Update enemies
    setEnemies(prevEnemies => 
      prevEnemies.map(enemy => {
        if (!enemy.alive) return enemy;
        
        let newEnemy = { ...enemy };
        newEnemy.x += newEnemy.vx;
        newEnemy.animFrame += 0.1;
        
        // Platform collision for enemies
        let onPlatform = false;
        platforms.forEach(platform => {
          const enemyRect = {
            x: newEnemy.x,
            y: newEnemy.y,
            width: newEnemy.width,
            height: newEnemy.height
          };
          
          if (checkCollision(enemyRect, platform)) {
            if (enemy.y + enemy.height <= platform.y + 5) {
              newEnemy.y = platform.y - newEnemy.height;
              onPlatform = true;
            }
          }
        });
        
        // Reverse direction at platform edges
        if (onPlatform) {
          const futureX = newEnemy.x + newEnemy.vx * 10;
          let futurePlatform = false;
          
          platforms.forEach(platform => {
            if (futureX >= platform.x && futureX + newEnemy.width <= platform.x + platform.width &&
                newEnemy.y + newEnemy.height >= platform.y - 5 &&
                newEnemy.y + newEnemy.height <= platform.y + platform.height) {
              futurePlatform = true;
            }
          });
          
          if (!futurePlatform) {
            newEnemy.vx = -newEnemy.vx;
          }
        }
        
        // Player collision
        const playerRect = {
          x: player.x,
          y: player.y,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE
        };
        
        const enemyRect = {
          x: newEnemy.x,
          y: newEnemy.y,
          width: newEnemy.width,
          height: newEnemy.height
        };
        
        if (checkCollision(playerRect, enemyRect)) {
          // Player jumping on enemy
          if (player.y + PLAYER_SIZE < newEnemy.y + 10 && player.vy > 0) {
            newEnemy.alive = false;
            const points = enemy.type === 'goomba' ? 100 : 200;
            setScore(prev => {
              const newScore = prev + points;
              onScoreChange(newScore);
              return newScore;
            });
            addParticles(newEnemy.x + newEnemy.width/2, newEnemy.y, 'hsl(45, 100%, 60%)', 6);
            
            // Bounce player
            setPlayer(prev => ({ ...prev, vy: -8 }));
          } else {
            // Player hit by enemy - lose life
            setLives(prev => {
              if (prev <= 1) {
                setGameOver(true);
                setIsPlaying(false);
                onGameEnd(score);
                return 0;
              }
              return prev - 1;
            });
            
            addParticles(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, 'hsl(0, 100%, 60%)', 8);
            
            // Reset player position
            setPlayer(prev => ({
              ...prev,
              x: 100,
              y: CANVAS_HEIGHT - 100,
              vx: 0,
              vy: 0
            }));
          }
        }
        
        return newEnemy;
      })
    );

    // Coin collection
    setCoins(prevCoins => 
      prevCoins.map(coin => {
        if (coin.collected) return coin;
        
        const playerRect = {
          x: player.x,
          y: player.y,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE
        };
        
        const coinRect = {
          x: coin.x,
          y: coin.y,
          width: 20,
          height: 20
        };
        
        if (checkCollision(playerRect, coinRect)) {
          setScore(prev => {
            const newScore = prev + 50;
            onScoreChange(newScore);
            return newScore;
          });
          
          addParticles(coin.x + 10, coin.y + 10, 'hsl(45, 100%, 60%)', 6);
          return { ...coin, collected: true };
        }
        
        return coin;
      })
    );

    // Update particles
    setParticles(prevParticles =>
      prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
    );

    // Check level completion
    if (coins.every(coin => coin.collected) && enemies.every(enemy => !enemy.alive)) {
      setLevel(prev => prev + 1);
      // Reset coins and enemies for next level
      setCoins(prevCoins => prevCoins.map(coin => ({ ...coin, collected: false })));
      setEnemies(prevEnemies => prevEnemies.map(enemy => ({ ...enemy, alive: true })));
    }

  }, [player, enemies, coins, platforms, keys, score, lives, level, isPaused, gameOver, checkCollision, addParticles, onScoreChange, onGameEnd]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
      e.preventDefault();
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
  }, []);

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
    setCameraX(0);
    setPlayer({
      x: 100,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 'right',
      animFrame: 0
    });
    setCoins(prevCoins => prevCoins.map(coin => ({ ...coin, collected: false })));
    setEnemies(prevEnemies => prevEnemies.map(enemy => ({ ...enemy, alive: true })));
    setParticles([]);
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Canvas */}
      <Card className="flex-1 p-6 bg-gradient-card border-neon-green backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-neon-green animate-text-glow drop-shadow-lg">🦛 Super Hippo Adventure</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-neon-green shadow-intense backdrop-blur-sm">
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
                Start Adventure
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
          <Card className="p-3 bg-gradient-card/95 border-neon-green backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowLeft': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowLeft': false }))}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowUp': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowUp': false }))}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowRight': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowRight': false }))}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
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
            <p>• Arrow keys/WASD: Move</p>
            <p>• Space/Up: Jump</p>
            <p>• Collect coins for points</p>
            <p>• Jump on enemies to defeat them</p>
            <p>• Complete levels to progress</p>
          </div>
        </Card>
      </div>
    </div>
  );
};