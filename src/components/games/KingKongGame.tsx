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
  const [lives, setLives] = useState(1); // 1 chip = 1 life
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

  // Game physics and collision detection
  const updatePlayer = useCallback(() => {
    setPlayer(prevPlayer => {
      let newPlayer = { ...prevPlayer };
      
      // Handle input
      if (keys['ArrowLeft'] || keys['a']) {
        newPlayer.vx = -3;
        newPlayer.facing = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        newPlayer.vx = 3;
        newPlayer.facing = 'right';
      } else {
        newPlayer.vx *= 0.8; // Friction
      }
      
      // Check for ladder climbing
      const onLadder = platforms.some(platform => 
        platform.type === 'ladder' &&
        newPlayer.x + PLAYER_SIZE > platform.x &&
        newPlayer.x < platform.x + platform.width &&
        newPlayer.y + PLAYER_SIZE > platform.y &&
        newPlayer.y < platform.y + platform.height
      );
      
      if (onLadder && (keys['ArrowUp'] || keys['w'])) {
        newPlayer.climbing = true;
        newPlayer.vy = -CLIMB_SPEED;
      } else if (onLadder && (keys['ArrowDown'] || keys['s'])) {
        newPlayer.climbing = true;
        newPlayer.vy = CLIMB_SPEED;
      } else if (newPlayer.climbing && onLadder) {
        newPlayer.vy = 0;
      } else {
        newPlayer.climbing = false;
        newPlayer.vy += GRAVITY;
      }
      
      // Jump
      if ((keys[' '] || keys['ArrowUp']) && !newPlayer.climbing) {
        const onGround = platforms.some(platform => 
          platform.type === 'floor' &&
          newPlayer.x + PLAYER_SIZE > platform.x &&
          newPlayer.x < platform.x + platform.width &&
          newPlayer.y + PLAYER_SIZE >= platform.y &&
          newPlayer.y + PLAYER_SIZE <= platform.y + platform.height + 5
        );
        
        if (onGround) {
          newPlayer.vy = -12;
        }
      }
      
      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;
      
      // Platform collision
      platforms.forEach(platform => {
        if (platform.type === 'floor' || platform.type === 'broken') {
          if (newPlayer.x + PLAYER_SIZE > platform.x &&
              newPlayer.x < platform.x + platform.width &&
              newPlayer.y + PLAYER_SIZE > platform.y &&
              newPlayer.y < platform.y + platform.height) {
            
            if (newPlayer.vy > 0) { // Falling down
              newPlayer.y = platform.y - PLAYER_SIZE;
              newPlayer.vy = 0;
            }
          }
        }
      });
      
      // Boundary checks
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x + PLAYER_SIZE > CANVAS_WIDTH) newPlayer.x = CANVAS_WIDTH - PLAYER_SIZE;
      if (newPlayer.y > CANVAS_HEIGHT) {
        // Player fell off - lose life
        setLives(prev => prev - 1);
        newPlayer.x = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
        newPlayer.y = CANVAS_HEIGHT - 100;
        newPlayer.vx = 0;
        newPlayer.vy = 0;
      }
      
      // Update camera to follow player
      const targetCameraY = Math.max(0, Math.min(newPlayer.y - CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 2));
      setCameraY(prev => prev + (targetCameraY - prev) * 0.1);
      
      // Invulnerability countdown
      if (newPlayer.invulnerable > 0) {
        newPlayer.invulnerable--;
      }
      
      return newPlayer;
    });
  }, [keys, platforms]);

  // Obstacle management
  const updateObstacles = useCallback(() => {
    setObstacles(prevObstacles => {
      let newObstacles = [...prevObstacles];
      
      // Spawn new obstacles from boss
      if (Math.random() < 0.02 && !boss.defeated) {
        newObstacles.push({
          x: boss.x + 50,
          y: boss.y + 50,
          vx: (Math.random() - 0.5) * 4,
          vy: 2,
          type: 'barrel',
          size: 24,
          active: true,
          rotation: 0
        });
      }
      
      // Update existing obstacles
      newObstacles = newObstacles.map(obstacle => {
        if (!obstacle.active) return obstacle;
        
        obstacle.x += obstacle.vx;
        obstacle.y += obstacle.vy;
        obstacle.vy += GRAVITY * 0.5;
        obstacle.rotation += 0.1;
        
        // Platform collision for barrels
        if (obstacle.type === 'barrel') {
          platforms.forEach(platform => {
            if (platform.type === 'floor' &&
                obstacle.x + obstacle.size > platform.x &&
                obstacle.x < platform.x + platform.width &&
                obstacle.y + obstacle.size > platform.y &&
                obstacle.y < platform.y + platform.height) {
              
              obstacle.y = platform.y - obstacle.size;
              obstacle.vy = -Math.abs(obstacle.vy) * 0.6;
              obstacle.vx *= 0.9;
            }
          });
        }
        
        // Remove obstacles that fall off screen
        if (obstacle.y > CANVAS_HEIGHT + 100) {
          obstacle.active = false;
        }
        
        return obstacle;
      }).filter(obstacle => obstacle.active);
      
      return newObstacles;
    });
  }, [boss]);

  // Collision detection
  const checkCollisions = useCallback(() => {
    if (player.invulnerable > 0) return;
    
    obstacles.forEach(obstacle => {
      if (!obstacle.active) return;
      
      const dx = player.x + PLAYER_SIZE/2 - (obstacle.x + obstacle.size/2);
      const dy = player.y + PLAYER_SIZE/2 - (obstacle.y + obstacle.size/2);
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < (PLAYER_SIZE + obstacle.size) / 2) {
        // Hit by obstacle
        setPlayer(prev => ({ ...prev, invulnerable: 120 }));
        setLives(prev => prev - 1);
        
        // Create hit particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 10; i++) {
          newParticles.push({
            x: player.x + PLAYER_SIZE/2,
            y: player.y + PLAYER_SIZE/2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: 'hsl(0, 100%, 50%)',
            size: 3
          });
        }
        setParticles(prev => [...prev, ...newParticles]);
        
        obstacle.active = false;
      }
    });
  }, [player, obstacles]);

  // Update particles
  const updateParticles = useCallback(() => {
    setParticles(prevParticles => 
      prevParticles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2,
        life: particle.life - 1
      })).filter(particle => particle.life > 0)
    );
  }, []);

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

  // Game logic and event handlers
  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setLives(1);
    setLevel(1);
    setCameraY(0);
    
    // Reset player position
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
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setLives(1);
    setLevel(1);
    setCameraY(0);
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
      
      if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) {
          setIsPaused(!isPaused);
        }
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
  }, [isPlaying, isPaused]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        updatePlayer();
        updateObstacles();
        updateParticles();
        checkCollisions();
        render();
        
        // Check win condition
        if (player.y < CANVAS_HEIGHT - 1800) {
          setScore(prev => prev + 1000);
          setLevel(prev => prev + 1);
        }
        
        // Check game over
        if (lives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd(score);
        }
      }, 1000 / 60); // 60 FPS
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
  }, [isPlaying, isPaused, gameOver, updatePlayer, updateObstacles, updateParticles, checkCollisions, render, player.y, lives, score, onGameEnd]);

  // Initial render
  useEffect(() => {
    render();
  }, [render]);

  // Score updates
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background via-purple-900/20 to-background p-2">
      {/* Classic CRT Monitor Frame */}
      <div className="relative">
        {/* Outer Monitor Frame */}
        <div className="bg-gradient-to-b from-gray-400 via-gray-500 to-gray-600 p-6 rounded-3xl shadow-2xl border-4 border-gray-700" style={{ 
          background: 'linear-gradient(135deg, #8B9DC3 0%, #DFE3EE 35%, #8B9DC3 100%)',
          boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(255,255,255,0.7)'
        }}>
          {/* Monitor Screen Bezel */}
          <div className="bg-black p-4 rounded-2xl border-4 border-gray-800" style={{
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(147, 51, 234, 0.3)'
          }}>
            {/* Game Screen */}
            <div className="relative bg-black border-2 border-gray-900 rounded-lg overflow-hidden mx-auto scanlines" 
                 style={{ 
                   width: CANVAS_WIDTH * 0.8, 
                   height: CANVAS_HEIGHT * 0.6,
                   background: 'radial-gradient(circle at center, #000 60%, #111 100%)',
                   filter: 'contrast(1.2) brightness(1.1)'
                 }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'saturate(1.3) contrast(1.1)'
                }}
              />
              
              {/* Classic CRT Scanlines Effect */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                animation: 'crt-flicker 0.15s infinite linear alternate'
              }}></div>
              
              {!isPlaying && !gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white">
                  <div className="text-center space-y-4 animate-pulse">
                    <h3 className="text-4xl font-bold mb-4 text-yellow-400 retro-text">KING KONG</h3>
                    <div className="text-center text-sm space-y-2">
                      <p className="text-cyan-400">HELP MARIO REACH THE TOP!</p>
                      <p className="text-white">◄► MOVE • ▲ CLIMB • SPACE PAUSE</p>
                      <p className="text-red-400">AVOID BARRELS & OBSTACLES</p>
                    </div>
                    <div className="mt-6 border-2 border-yellow-400 px-4 py-2 bg-yellow-400/20">
                      <p className="text-yellow-400 font-bold">INSERT COIN</p>
                      <p className="text-sm">PRESS START</p>
                    </div>
                    <Button onClick={startGame} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded border-b-4 border-red-800">
                      START GAME
                    </Button>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-white">
                  <div className="text-center space-y-4">
                    <h3 className="text-5xl font-bold mb-4 text-red-500 retro-text animate-pulse">GAME OVER</h3>
                    <div className="space-y-2 text-lg">
                      <p>FINAL SCORE: <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span></p>
                      <p>LEVEL: <span className="text-cyan-400 font-bold">{level}</span></p>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 border-b-4 border-green-800">
                        PLAY AGAIN
                      </Button>
                      <Button variant="outline" onClick={() => window.history.back()} className="border-white text-white hover:bg-white hover:text-black">
                        EXIT
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isPaused && isPlaying && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                  <div className="text-center text-white space-y-4">
                    <h3 className="text-3xl font-bold text-yellow-400 retro-text animate-pulse">PAUSED</h3>
                    <Button onClick={() => setIsPaused(false)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-6 py-2">
                      RESUME
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Monitor Controls */}
          <div className="flex justify-center mt-4 space-x-8">
            <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-red-800 shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-700 shadow-inner"></div>
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700 shadow-inner"></div>
          </div>
          
          {/* Brand Label */}
          <div className="text-center mt-2">
            <p className="text-gray-700 font-bold text-sm">ARCADE MASTER 1985</p>
          </div>
        </div>

        {/* Game Stats Overlay */}
        {isPlaying && (
          <div className="absolute top-4 right-4 space-y-2">
            <div className="bg-black/80 text-yellow-400 px-3 py-1 rounded border border-yellow-400 text-sm font-bold">
              SCORE: {score.toLocaleString()}
            </div>
            <div className="bg-black/80 text-red-400 px-3 py-1 rounded border border-red-400 text-sm font-bold">
              LIVES: {lives}
            </div>
            <div className="bg-black/80 text-cyan-400 px-3 py-1 rounded border border-cyan-400 text-sm font-bold">
              LEVEL: {level}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
