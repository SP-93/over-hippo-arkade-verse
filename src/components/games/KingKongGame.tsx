import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";

interface KingKongGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const GRAVITY = 0.3;
const CLIMB_SPEED = 2;
const PLAYER_SIZE = 32;

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  climbing: boolean;
  facing: 'left' | 'right';
  health: number;
  invulnerable: number;
}

interface Obstacle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'barrel' | 'fire' | 'hammer';
  size: number;
  active: boolean;
  rotation: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ladder' | 'floor' | 'broken';
}

interface Boss {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  throwing: boolean;
  throwTimer: number;
  animFrame: number;
  defeated: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export const KingKongGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: KingKongGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // 1 chip = 3 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [cameraY, setCameraY] = useState(0);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    climbing: false,
    facing: 'right',
    health: 3,
    invulnerable: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Generate tower platforms
  const [platforms] = useState<Platform[]>(() => {
    const platformList: Platform[] = [];
    const towerHeight = 2000;
    
    // Ground floor
    platformList.push({ x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, type: 'floor' });
    
    // Generate tower levels
    for (let level = 1; level < 20; level++) {
      const y = CANVAS_HEIGHT - (level * 100);
      
      // Main platform
      platformList.push({ 
        x: 50, 
        y: y, 
        width: CANVAS_WIDTH - 100, 
        height: 15, 
        type: 'floor' 
      });
      
      // Ladders connecting levels
      if (level % 2 === 0) {
        // Left ladder
        platformList.push({ 
          x: 80, 
          y: y - 85, 
          width: 20, 
          height: 85, 
          type: 'ladder' 
        });
      } else {
        // Right ladder
        platformList.push({ 
          x: CANVAS_WIDTH - 100, 
          y: y - 85, 
          width: 20, 
          height: 85, 
          type: 'ladder' 
        });
      }
      
      // Some broken platforms for difficulty
      if (level > 5 && Math.random() < 0.3) {
        platformList.push({ 
          x: 200 + Math.random() * 200, 
          y: y - 40, 
          width: 80, 
          height: 10, 
          type: 'broken' 
        });
      }
    }
    
    return platformList;
  });

  const [boss] = useState<Boss>({
    x: CANVAS_WIDTH / 2 - 50,
    y: CANVAS_HEIGHT - 1900, // Top of tower
    health: 10,
    maxHealth: 10,
    throwing: false,
    throwTimer: 0,
    animFrame: 0,
    defeated: false
  });

  // Add particles effect
  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -8 - 2,
        life: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Spawn obstacles from boss
  const spawnObstacle = useCallback(() => {
    if (!boss.defeated && Math.random() < 0.02) {
      const newObstacle: Obstacle = {
        x: boss.x + 25,
        y: boss.y + 50,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        type: Math.random() < 0.7 ? 'barrel' : 'fire',
        size: 20,
        active: true,
        rotation: 0
      };
      setObstacles(prev => [...prev, newObstacle]);
    }
  }, [boss]);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with city background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(220, 40%, 15%)'); // Night sky
    gradient.addColorStop(0.7, 'hsl(240, 30%, 20%)');
    gradient.addColorStop(1, 'hsl(220, 50%, 10%)'); // Ground level
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw city lights in background
    for (let i = 0; i < 20; i++) {
      const x = (i * 50) % CANVAS_WIDTH;
      const y = CANVAS_HEIGHT - 200 + Math.sin(i) * 50;
      const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
      
      ctx.fillStyle = `hsl(45, 100%, ${30 + brightness * 30}%)`;
      ctx.fillRect(x, y, 4, 8);
      ctx.fillRect(x + 10, y + 20, 4, 8);
    }

    // Save context for camera transform
    ctx.save();
    ctx.translate(0, cameraY);

    // Draw platforms
    platforms.forEach(platform => {
      switch (platform.type) {
        case 'floor':
          // Steel beam platform
          const beamGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
          beamGradient.addColorStop(0, 'hsl(200, 20%, 60%)');
          beamGradient.addColorStop(1, 'hsl(200, 20%, 40%)');
          ctx.fillStyle = beamGradient;
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          
          // Rivets
          for (let i = 0; i < platform.width; i += 30) {
            ctx.fillStyle = 'hsl(200, 20%, 30%)';
            ctx.beginPath();
            ctx.arc(platform.x + i + 15, platform.y + platform.height/2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
          
        case 'ladder':
          // Ladder rungs
          ctx.fillStyle = 'hsl(30, 80%, 40%)';
          ctx.fillRect(platform.x, platform.y, 4, platform.height);
          ctx.fillRect(platform.x + 16, platform.y, 4, platform.height);
          
          for (let i = 0; i < platform.height; i += 15) {
            ctx.fillRect(platform.x, platform.y + i, platform.width, 4);
          }
          break;
          
        case 'broken':
          // Broken platform
          ctx.fillStyle = 'hsl(20, 60%, 30%)';
          ctx.fillRect(platform.x, platform.y, platform.width * 0.7, platform.height);
          ctx.fillRect(platform.x + platform.width * 0.8, platform.y, platform.width * 0.2, platform.height);
          break;
      }
    });

    // Draw boss (King Kong)
    if (!boss.defeated) {
      const bossSize = 100;
      const bounceY = Math.sin(Date.now() * 0.005) * 5;
      
      // Boss shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(boss.x - 10, boss.y + bossSize + 5, bossSize + 20, 10);
      
      // Boss body
      const bossGradient = ctx.createRadialGradient(
        boss.x + bossSize/2, boss.y + bossSize/2, 0,
        boss.x + bossSize/2, boss.y + bossSize/2, bossSize/2
      );
      bossGradient.addColorStop(0, 'hsl(30, 50%, 30%)');
      bossGradient.addColorStop(1, 'hsl(30, 50%, 20%)');
      
      ctx.fillStyle = bossGradient;
      ctx.shadowColor = 'hsl(0, 100%, 30%)';
      ctx.shadowBlur = 15;
      ctx.fillRect(boss.x, boss.y + bounceY, bossSize, bossSize);
      
      // Boss arms
      ctx.fillStyle = 'hsl(30, 50%, 25%)';
      ctx.fillRect(boss.x - 30, boss.y + 20 + bounceY, 25, 40);
      ctx.fillRect(boss.x + bossSize + 5, boss.y + 20 + bounceY, 25, 40);
      
      // Boss eyes (glowing red)
      ctx.fillStyle = 'hsl(0, 100%, 50%)';
      ctx.shadowColor = 'hsl(0, 100%, 50%)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(boss.x + 25, boss.y + 25 + bounceY, 8, 0, Math.PI * 2);
      ctx.arc(boss.x + 75, boss.y + 25 + bounceY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Boss health bar
      const healthBarWidth = 100;
      const healthPercent = boss.health / boss.maxHealth;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(boss.x, boss.y - 20, healthBarWidth, 8);
      
      ctx.fillStyle = healthPercent > 0.5 ? 'hsl(120, 100%, 50%)' : 
                     healthPercent > 0.25 ? 'hsl(60, 100%, 50%)' : 'hsl(0, 100%, 50%)';
      ctx.fillRect(boss.x, boss.y - 20, healthBarWidth * healthPercent, 8);
    }
    ctx.shadowBlur = 0;

    // Draw obstacles
    obstacles.forEach(obstacle => {
      if (!obstacle.active) return;
      
      ctx.save();
      ctx.translate(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2);
      ctx.rotate(obstacle.rotation);
      
      switch (obstacle.type) {
        case 'barrel':
          // Spinning barrel
          const barrelGradient = ctx.createLinearGradient(-obstacle.size/2, 0, obstacle.size/2, 0);
          barrelGradient.addColorStop(0, 'hsl(30, 80%, 40%)');
          barrelGradient.addColorStop(0.5, 'hsl(30, 80%, 60%)');
          barrelGradient.addColorStop(1, 'hsl(30, 80%, 40%)');
          
          ctx.fillStyle = barrelGradient;
          ctx.fillRect(-obstacle.size/2, -obstacle.size/2, obstacle.size, obstacle.size);
          
          // Barrel bands
          ctx.fillStyle = 'hsl(30, 60%, 30%)';
          ctx.fillRect(-obstacle.size/2, -obstacle.size/4, obstacle.size, 3);
          ctx.fillRect(-obstacle.size/2, obstacle.size/4, obstacle.size, 3);
          break;
          
        case 'fire':
          // Animated fire
          const fireColors = ['hsl(0, 100%, 50%)', 'hsl(30, 100%, 50%)', 'hsl(60, 100%, 50%)'];
          const fireColor = fireColors[Math.floor(Date.now() * 0.01) % fireColors.length];
          
          ctx.fillStyle = fireColor;
          ctx.shadowColor = fireColor;
          ctx.shadowBlur = 15;
          
          // Fire shape
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = obstacle.size/2 + Math.sin(Date.now() * 0.01 + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Draw player
    const playerBounceY = player.climbing ? 0 : Math.sin(Date.now() * 0.02) * 1;
    const invulnerableFlash = player.invulnerable > 0 && Math.sin(Date.now() * 0.02) > 0;
    
    if (!invulnerableFlash) {
      ctx.save();
      ctx.translate(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
      if (player.facing === 'left') ctx.scale(-1, 1);
      
      // Player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-PLAYER_SIZE/2, PLAYER_SIZE/2 - 2, PLAYER_SIZE, 4);
      
      // Player body (construction worker)
      const playerGradient = ctx.createLinearGradient(0, -PLAYER_SIZE/2, 0, PLAYER_SIZE/2);
      playerGradient.addColorStop(0, 'hsl(200, 80%, 60%)'); // Blue shirt
      playerGradient.addColorStop(0.5, 'hsl(200, 80%, 50%)');
      playerGradient.addColorStop(1, 'hsl(30, 80%, 40%)'); // Brown pants
      
      ctx.fillStyle = playerGradient;
      ctx.shadowColor = 'hsl(200, 80%, 60%)';
      ctx.shadowBlur = 5;
      ctx.fillRect(-PLAYER_SIZE/2 + 4, -PLAYER_SIZE/2 + 4 + playerBounceY, PLAYER_SIZE - 8, PLAYER_SIZE - 8);
      
      // Hard hat
      ctx.fillStyle = 'hsl(45, 100%, 50%)';
      ctx.fillRect(-PLAYER_SIZE/2 + 2, -PLAYER_SIZE/2 + playerBounceY, PLAYER_SIZE - 4, 8);
      
      // Eyes
      ctx.fillStyle = 'white';
      ctx.fillRect(-6, -8 + playerBounceY, 4, 4);
      ctx.fillRect(2, -8 + playerBounceY, 4, 4);
      
      ctx.fillStyle = 'black';
      ctx.fillRect(-5, -7 + playerBounceY, 2, 2);
      ctx.fillRect(3, -7 + playerBounceY, 2, 2);
      
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 50;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
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
    ctx.fillText(`Height: ${Math.floor((CANVAS_HEIGHT - player.y - cameraY) / 10)}m`, 20, 70);

  }, [player, platforms, obstacles, particles, boss, cameraY, lives, level]);

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

    // Spawn obstacles
    spawnObstacle();

    // Update player
    setPlayer(prevPlayer => {
      let newPlayer = { ...prevPlayer };
      
      // Decrease invulnerability
      if (newPlayer.invulnerable > 0) {
        newPlayer.invulnerable--;
      }
      
      // Handle climbing
      let onLadder = false;
      platforms.forEach(platform => {
        if (platform.type === 'ladder') {
          const playerRect = {
            x: newPlayer.x,
            y: newPlayer.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
          };
          
          if (checkCollision(playerRect, platform)) {
            onLadder = true;
            if (keys['ArrowUp'] || keys['w']) {
              newPlayer.vy = -CLIMB_SPEED;
              newPlayer.climbing = true;
            } else if (keys['ArrowDown'] || keys['s']) {
              newPlayer.vy = CLIMB_SPEED;
              newPlayer.climbing = true;
            } else {
              newPlayer.vy = 0;
            }
          }
        }
      });
      
      if (!onLadder) {
        newPlayer.climbing = false;
        newPlayer.vy += GRAVITY; // Apply gravity
      }
      
      // Horizontal movement
      if (keys['ArrowLeft'] || keys['a']) {
        newPlayer.vx = -3;
        newPlayer.facing = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        newPlayer.vx = 3;
        newPlayer.facing = 'right';
      } else {
        newPlayer.vx *= 0.8; // Friction
      }
      
      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;
      
      // Platform collisions
      let grounded = false;
      platforms.forEach(platform => {
        if (platform.type !== 'floor') return;
        
        const playerRect = {
          x: newPlayer.x,
          y: newPlayer.y,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE
        };
        
        if (checkCollision(playerRect, platform)) {
          if (prevPlayer.y + PLAYER_SIZE <= platform.y && newPlayer.vy >= 0) {
            newPlayer.y = platform.y - PLAYER_SIZE;
            newPlayer.vy = 0;
            grounded = true;
          }
        }
      });
      
      // World boundaries
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x > CANVAS_WIDTH - PLAYER_SIZE) newPlayer.x = CANVAS_WIDTH - PLAYER_SIZE;
      
      // Fall off screen
      if (newPlayer.y > CANVAS_HEIGHT + 100) {
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        // Reset player position
        newPlayer.x = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
        newPlayer.y = CANVAS_HEIGHT - 100;
        newPlayer.vx = 0;
        newPlayer.vy = 0;
        newPlayer.health = 3;
      }
      
      return newPlayer;
    });

    // Update camera to follow player
    setCameraY(prev => {
      const targetY = Math.max(0, Math.min(player.y - CANVAS_HEIGHT / 2, 1500));
      return prev + (targetY - prev) * 0.1;
    });

    // Update obstacles
    setObstacles(prevObstacles => 
      prevObstacles
        .map(obstacle => {
          if (!obstacle.active) return obstacle;
          
          let newObstacle = { ...obstacle };
          
          // Apply physics
          newObstacle.vy += GRAVITY * 0.5;
          newObstacle.x += newObstacle.vx;
          newObstacle.y += newObstacle.vy;
          newObstacle.rotation += 0.1;
          
          // Platform collisions for bouncing
          platforms.forEach(platform => {
            if (platform.type === 'floor') {
              const obstacleRect = {
                x: newObstacle.x,
                y: newObstacle.y,
                width: newObstacle.size,
                height: newObstacle.size
              };
              
              if (checkCollision(obstacleRect, platform) && newObstacle.vy > 0) {
                newObstacle.vy = -newObstacle.vy * 0.7;
                newObstacle.y = platform.y - newObstacle.size;
              }
            }
          });
          
          // Player collision
          const playerRect = {
            x: player.x,
            y: player.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
          };
          
          const obstacleRect = {
            x: newObstacle.x,
            y: newObstacle.y,
            width: newObstacle.size,
            height: newObstacle.size
          };
          
          if (checkCollision(playerRect, obstacleRect) && player.invulnerable === 0) {
            newObstacle.active = false;
            
            setPlayer(prev => {
              const newHealth = prev.health - 1;
              if (newHealth <= 0) {
                setLives(livesCount => {
                  if (livesCount <= 1) {
                    setGameOver(true);
                    setIsPlaying(false);
                    onGameEnd(score);
                    return 0;
                  }
                  return livesCount - 1;
                });
                
                return {
                  ...prev,
                  x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
                  y: CANVAS_HEIGHT - 100,
                  vx: 0,
                  vy: 0,
                  health: 3,
                  invulnerable: 120
                };
              }
              
              return { ...prev, health: newHealth, invulnerable: 60 };
            });
            
            addParticles(newObstacle.x + newObstacle.size/2, newObstacle.y + newObstacle.size/2, 'hsl(0, 100%, 60%)', 8);
          }
          
          // Remove if off screen
          if (newObstacle.y > CANVAS_HEIGHT + 100 || 
              newObstacle.x < -50 || newObstacle.x > CANVAS_WIDTH + 50) {
            newObstacle.active = false;
          }
          
          return newObstacle;
        })
        .filter(obstacle => obstacle.active)
    );

    // Update particles
    setParticles(prevParticles =>
      prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
    );

    // Check if player reached boss
    const distanceToBoss = Math.sqrt(
      Math.pow(player.x - boss.x, 2) + Math.pow(player.y - boss.y, 2)
    );
    
    if (distanceToBoss < 80 && !boss.defeated) {
      // Boss battle!
      const points = 1000;
      setScore(prev => {
        const newScore = prev + points;
        onScoreChange(newScore);
        return newScore;
      });
      
      boss.defeated = true;
      addParticles(boss.x + 50, boss.y + 50, 'hsl(45, 100%, 60%)', 20);
      
      // Level complete
      setLevel(prev => prev + 1);
    }

    // Add score for climbing height
    const currentHeight = Math.floor((CANVAS_HEIGHT - player.y - cameraY) / 100);
    if (currentHeight > 0 && currentHeight % 2 === 0) {
      setScore(prev => {
        const heightBonus = currentHeight * 10;
        if (prev < heightBonus) {
          const newScore = heightBonus;
          onScoreChange(newScore);
          return newScore;
        }
        return prev;
      });
    }

  }, [player, obstacles, platforms, boss, keys, score, lives, level, isPaused, gameOver, checkCollision, addParticles, spawnObstacle, onScoreChange, onGameEnd]);

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
    setCameraY(0);
    setPlayer({
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      climbing: false,
      facing: 'right',
      health: 3,
      invulnerable: 0
    });
    setObstacles([]);
    setParticles([]);
    boss.defeated = false;
    boss.health = boss.maxHealth;
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Canvas */}
      <Card className="flex-1 p-6 bg-gradient-card border-danger-red backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-danger-red animate-text-glow drop-shadow-lg">🦍 King Kong Climber</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-danger-red shadow-intense backdrop-blur-sm">
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
                Start Climb
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
          <h4 className="font-bold text-neon-pink mb-2">Health</h4>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full ${
                  i < player.health ? 'bg-neon-green' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* Mobile Controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-danger-red backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowLeft': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowLeft': false }))}
                className="h-12 w-12 border-danger-red text-danger-red hover:bg-danger-red/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowUp': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowUp': false }))}
                className="h-12 w-12 border-danger-red text-danger-red hover:bg-danger-red/20"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => setKeys(prev => ({ ...prev, 'ArrowRight': true }))}
                onTouchEnd={() => setKeys(prev => ({ ...prev, 'ArrowRight': false }))}
                className="h-12 w-12 border-danger-red text-danger-red hover:bg-danger-red/20"
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
            <p>• Arrow keys: Move horizontally</p>
            <p>• Up/Down on ladders: Climb</p>
            <p>• Avoid falling obstacles</p>
            <p>• Reach King Kong at the top</p>
            <p>• Earn points for climbing height</p>
          </div>
        </Card>
      </div>
    </div>
  );
};