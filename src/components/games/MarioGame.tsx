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
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const PLAYER_SPEED = 3;
const PLAYER_SIZE = 32;
const BLOCK_SIZE = 32;
const GROUND_HEIGHT = 64;

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 'left' | 'right';
  animFrame: number;
  big: boolean;
}

interface Block {
  x: number;
  y: number;
  type: 'brick' | 'question' | 'pipe' | 'ground';
  hit: boolean;
  powerUp?: string;
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

interface PowerUp {
  x: number;
  y: number;
  type: 'mushroom' | 'flower';
  collected: boolean;
  vy: number;
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
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [cameraX, setCameraX] = useState(0);
  const [time, setTime] = useState(400);

  // Game objects
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 'right',
    animFrame: 0,
    big: false
  });

  const [blocks] = useState<Block[]>([
    // Ground blocks
    ...Array.from({ length: 50 }, (_, i) => ({ 
      x: i * BLOCK_SIZE, 
      y: CANVAS_HEIGHT - BLOCK_SIZE, 
      type: 'ground' as const, 
      hit: false 
    })),
    ...Array.from({ length: 50 }, (_, i) => ({ 
      x: i * BLOCK_SIZE, 
      y: CANVAS_HEIGHT - BLOCK_SIZE * 2, 
      type: 'ground' as const, 
      hit: false 
    })),
    
    // Question blocks
    { x: 256, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'question', hit: false, powerUp: 'coin' },
    { x: 320, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'question', hit: false, powerUp: 'mushroom' },
    { x: 384, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'question', hit: false, powerUp: 'coin' },
    { x: 512, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 4, type: 'question', hit: false, powerUp: 'coin' },
    { x: 704, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'question', hit: false, powerUp: 'flower' },
    
    // Brick blocks
    { x: 288, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'brick', hit: false },
    { x: 352, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'brick', hit: false },
    { x: 480, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 4, type: 'brick', hit: false },
    { x: 544, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 4, type: 'brick', hit: false },
    
    // Pipes
    { x: 608, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE, type: 'pipe', hit: false },
    { x: 608, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 2, type: 'pipe', hit: false },
    { x: 896, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE, type: 'pipe', hit: false },
    { x: 896, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 2, type: 'pipe', hit: false },
    { x: 896, y: CANVAS_HEIGHT - GROUND_HEIGHT - BLOCK_SIZE * 3, type: 'pipe', hit: false },
  ]);

  const [coins, setCoins] = useState<Coin[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 300, y: CANVAS_HEIGHT - GROUND_HEIGHT - 24, vx: -1, width: 24, height: 24, alive: true, type: 'goomba', animFrame: 0 },
    { x: 500, y: CANVAS_HEIGHT - GROUND_HEIGHT - 28, vx: -1, width: 28, height: 28, alive: true, type: 'koopa', animFrame: 0 },
    { x: 750, y: CANVAS_HEIGHT - GROUND_HEIGHT - 24, vx: -1, width: 24, height: 24, alive: true, type: 'goomba', animFrame: 0 },
    { x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 28, vx: 1, width: 28, height: 28, alive: true, type: 'koopa', animFrame: 0 },
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

  // Draw Mario character
  const drawMario = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, facing: string, big: boolean) => {
    const size = big ? PLAYER_SIZE + 16 : PLAYER_SIZE;
    const offsetY = big ? -8 : 0;
    
    ctx.save();
    ctx.translate(x + size/2, y + size/2 + offsetY);
    if (facing === 'left') ctx.scale(-1, 1);
    
    // Mario's hat (red)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-size/2 + 4, -size/2, size - 8, size/3);
    
    // Mario's face (peach)
    ctx.fillStyle = '#FFDBAC';
    ctx.fillRect(-size/2 + 6, -size/2 + size/3 - 2, size - 12, size/3);
    
    // Mario's shirt (red)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-size/2 + 2, -size/2 + size/3 + size/3 - 4, size - 4, size/3);
    
    // Mario's overalls (blue)
    ctx.fillStyle = '#0066CC';
    ctx.fillRect(-size/2 + 4, -size/2 + size/3 + size/3 - 2, size - 8, size/3 + 2);
    
    // Mario's mustache (brown)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-size/2 + 8, -size/2 + size/3 + 4, size - 16, 4);
    
    // Mario's eyes (black dots)
    ctx.fillStyle = '#000000';
    ctx.fillRect(-size/2 + 8, -size/2 + size/3, 3, 3);
    ctx.fillRect(-size/2 + size - 11, -size/2 + size/3, 3, 3);
    
    // Mario's buttons (yellow)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-2, -size/2 + size/3 + size/3 + 2, 4, 4);
    
    ctx.restore();
  }, []);

  // Draw blocks
  const drawBlock = useCallback((ctx: CanvasRenderingContext2D, block: Block) => {
    const { x, y, type, hit } = block;
    
    switch (type) {
      case 'ground':
        // Ground blocks (brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        break;
        
      case 'brick':
        // Brick blocks (orange-red)
        ctx.fillStyle = hit ? '#8B4513' : '#FF6347';
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.strokeRect(x + (i % 2) * 16, y + Math.floor(i / 2) * 16, 16, 16);
        }
        break;
        
      case 'question':
        // Question blocks (yellow)
        ctx.fillStyle = hit ? '#8B4513' : '#FFD700';
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        
        if (!hit) {
          // Question mark
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('?', x + BLOCK_SIZE/2, y + BLOCK_SIZE/2 + 7);
        }
        break;
        
      case 'pipe':
        // Pipe blocks (green)
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        // Pipe highlight
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(x + 4, y + 4, 4, BLOCK_SIZE - 8);
        break;
    }
  }, []);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with classic Mario sky blue
    ctx.fillStyle = '#5C94FC';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds (classic white)
    for (let i = 0; i < 3; i++) {
      const cloudX = (i * 400 + 150 - cameraX * 0.5) % (CANVAS_WIDTH + 200);
      const cloudY = 50 + Math.sin(i) * 20;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY, 30, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Save context for camera transform
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw blocks
    blocks.forEach(block => {
      if (block.x + BLOCK_SIZE >= cameraX && block.x <= cameraX + CANVAS_WIDTH) {
        drawBlock(ctx, block);
      }
    });

    // Draw coins
    coins.forEach(coin => {
      if (!coin.collected && coin.x + 20 >= cameraX && coin.x <= cameraX + CANVAS_WIDTH) {
        const rotation = (Date.now() * 0.01 + coin.animFrame) % (Math.PI * 2);
        
        ctx.save();
        ctx.translate(coin.x + 16, coin.y + 16);
        ctx.rotate(rotation);
        
        // Classic Mario coin (yellow)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -12, 24, 24);
        
        // Coin center
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-8, -8, 16, 16);
        
        ctx.restore();
      }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      if (!powerUp.collected && powerUp.x + BLOCK_SIZE >= cameraX && powerUp.x <= cameraX + CANVAS_WIDTH) {
        if (powerUp.type === 'mushroom') {
          // Mushroom (red with white spots)
          ctx.fillStyle = '#DC143C';
          ctx.fillRect(powerUp.x, powerUp.y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(powerUp.x + 4, powerUp.y + 4, 6, 6);
          ctx.fillRect(powerUp.x + 16, powerUp.y + 8, 6, 6);
          ctx.fillRect(powerUp.x + 8, powerUp.y + 16, 6, 6);
        } else if (powerUp.type === 'flower') {
          // Fire flower (orange-red)
          ctx.fillStyle = '#FF4500';
          ctx.fillRect(powerUp.x, powerUp.y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(powerUp.x + 8, powerUp.y + 8, 16, 16);
        }
      }
    });

    // Draw enemies
    enemies.forEach(enemy => {
      if (enemy.alive && enemy.x + enemy.width >= cameraX && enemy.x <= cameraX + CANVAS_WIDTH) {
        if (enemy.type === 'goomba') {
          // Goomba (brown mushroom enemy)
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.x + 4, enemy.y + 4, 4, 4);
          ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 4, 4, 4);
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 5, enemy.y + 5, 2, 2);
          ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 5, 2, 2);
          
          // Eyebrows
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 3, enemy.y + 2, 6, 2);
          ctx.fillRect(enemy.x + enemy.width - 9, enemy.y + 2, 6, 2);
          
        } else if (enemy.type === 'koopa') {
          // Koopa Troopa (green turtle)
          ctx.fillStyle = '#32CD32';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Shell pattern
          ctx.strokeStyle = '#228B22';
          ctx.lineWidth = 2;
          ctx.strokeRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
          
          // Eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.x + 6, enemy.y + 6, 4, 4);
          ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 6, 4, 4);
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + 7, enemy.y + 7, 2, 2);
          ctx.fillRect(enemy.x + enemy.width - 9, enemy.y + 7, 2, 2);
        }
      }
    });

    // Draw Mario
    drawMario(ctx, player.x, player.y, player.facing, player.big);

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 50;
      ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Restore context
    ctx.restore();

    // Draw UI (classic Mario style)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MARIO`, 20, 30);
    ctx.fillText(`${score.toString().padStart(6, '0')}`, 20, 50);
    
    ctx.fillText(`TIME`, CANVAS_WIDTH - 120, 30);
    ctx.fillText(`${time.toString().padStart(3, '0')}`, CANVAS_WIDTH - 120, 50);
    
    ctx.fillText(`WORLD`, CANVAS_WIDTH/2 - 40, 30);
    ctx.fillText(`1-${level}`, CANVAS_WIDTH/2 - 20, 50);
    
    ctx.fillText(`LIVES: ${lives}`, 20, CANVAS_HEIGHT - 20);

  }, [player, blocks, coins, enemies, powerUps, particles, cameraX, lives, level, score, time, drawMario, drawBlock]);

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

    // Update timer
    setTime(prev => {
      if (prev <= 0) {
        setLives(lives => {
          if (lives <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return lives - 1;
        });
        return 400;
      }
      return prev - 1;
    });

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
        newPlayer.vx *= 0.8;
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
      
      // Block collisions
      newPlayer.grounded = false;
      const playerSize = newPlayer.big ? PLAYER_SIZE + 16 : PLAYER_SIZE;
      
      blocks.forEach(block => {
        const playerRect = {
          x: newPlayer.x,
          y: newPlayer.y,
          width: playerSize,
          height: playerSize
        };
        
        const blockRect = {
          x: block.x,
          y: block.y,
          width: BLOCK_SIZE,
          height: BLOCK_SIZE
        };
        
        if (checkCollision(playerRect, blockRect)) {
          // Landing on top
          if (prevPlayer.y + playerSize <= block.y + 5 && newPlayer.vy >= 0) {
            newPlayer.y = block.y - playerSize;
            newPlayer.vy = 0;
            newPlayer.grounded = true;
          }
          // Hitting from below (block breaking)
          else if (prevPlayer.y >= block.y + BLOCK_SIZE - 5 && newPlayer.vy <= 0) {
            newPlayer.y = block.y + BLOCK_SIZE;
            newPlayer.vy = 0;
            
            // Hit block
            if ((block.type === 'question' || block.type === 'brick') && !block.hit) {
              block.hit = true;
              
              if (block.powerUp === 'coin') {
                setCoins(prev => [...prev, { 
                  x: block.x + 8, 
                  y: block.y - 32, 
                  collected: false, 
                  animFrame: 0 
                }]);
                setScore(prev => prev + 200);
                onScoreChange(score + 200);
              } else if (block.powerUp === 'mushroom') {
                setPowerUps(prev => [...prev, { 
                  x: block.x, 
                  y: block.y - BLOCK_SIZE, 
                  type: 'mushroom', 
                  collected: false, 
                  vy: 0 
                }]);
              } else if (block.powerUp === 'flower') {
                setPowerUps(prev => [...prev, { 
                  x: block.x, 
                  y: block.y - BLOCK_SIZE, 
                  type: 'flower', 
                  collected: false, 
                  vy: 0 
                }]);
              }
              
              addParticles(block.x + BLOCK_SIZE/2, block.y, '#FFD700', 6);
            }
          }
          // Side collisions
          else {
            if (prevPlayer.x + playerSize <= block.x) {
              newPlayer.x = block.x - playerSize;
            } else if (prevPlayer.x >= block.x + BLOCK_SIZE) {
              newPlayer.x = block.x + BLOCK_SIZE;
            }
            newPlayer.vx = 0;
          }
        }
      });
      
      // World boundaries
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.y > CANVAS_HEIGHT) {
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        newPlayer.x = 100;
        newPlayer.y = CANVAS_HEIGHT - GROUND_HEIGHT - playerSize;
        newPlayer.vx = 0;
        newPlayer.vy = 0;
      }
      
      return newPlayer;
    });

    // Update camera
    setCameraX(prev => {
      const targetX = Math.max(0, player.x - CANVAS_WIDTH / 3);
      return prev + (targetX - prev) * 0.1;
    });

    // Update power-ups
    setPowerUps(prevPowerUps =>
      prevPowerUps.map(powerUp => {
        if (powerUp.collected) return powerUp;
        
        // Power-up collision with player
        const playerRect = {
          x: player.x,
          y: player.y,
          width: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE,
          height: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE
        };
        
        const powerUpRect = {
          x: powerUp.x,
          y: powerUp.y,
          width: BLOCK_SIZE,
          height: BLOCK_SIZE
        };
        
        if (checkCollision(playerRect, powerUpRect)) {
          if (powerUp.type === 'mushroom') {
            setPlayer(prev => ({ ...prev, big: true }));
            setScore(prev => prev + 1000);
            onScoreChange(score + 1000);
          } else if (powerUp.type === 'flower') {
            setPlayer(prev => ({ ...prev, big: true }));
            setScore(prev => prev + 1000);
            onScoreChange(score + 1000);
          }
          
          addParticles(powerUp.x + BLOCK_SIZE/2, powerUp.y + BLOCK_SIZE/2, '#FFD700', 8);
          return { ...powerUp, collected: true };
        }
        
        return powerUp;
      })
    );

    // Update enemies
    setEnemies(prevEnemies => 
      prevEnemies.map(enemy => {
        if (!enemy.alive) return enemy;
        
        let newEnemy = { ...enemy };
        newEnemy.x += newEnemy.vx;
        newEnemy.animFrame += 0.1;
        
        // Enemy collision with blocks
        let onGround = false;
        blocks.forEach(block => {
          if (block.type === 'ground') {
            const enemyRect = {
              x: newEnemy.x,
              y: newEnemy.y,
              width: newEnemy.width,
              height: newEnemy.height
            };
            
            if (checkCollision(enemyRect, { x: block.x, y: block.y, width: BLOCK_SIZE, height: BLOCK_SIZE })) {
              if (enemy.y + enemy.height <= block.y + 5) {
                newEnemy.y = block.y - newEnemy.height;
                onGround = true;
              }
            }
          }
        });
        
        // Reverse direction at edges
        if (onGround) {
          const futureX = newEnemy.x + newEnemy.vx * 20;
          let futureGround = false;
          
          blocks.forEach(block => {
            if (block.type === 'ground' && 
                futureX + newEnemy.width > block.x && 
                futureX < block.x + BLOCK_SIZE &&
                newEnemy.y + newEnemy.height >= block.y - 5) {
              futureGround = true;
            }
          });
          
          if (!futureGround) {
            newEnemy.vx = -newEnemy.vx;
          }
        }
        
        // Player collision
        const playerRect = {
          x: player.x,
          y: player.y,
          width: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE,
          height: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE
        };
        
        const enemyRect = {
          x: newEnemy.x,
          y: newEnemy.y,
          width: newEnemy.width,
          height: newEnemy.height
        };
        
        if (checkCollision(playerRect, enemyRect)) {
          // Player jumping on enemy
          if (player.y + (player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE) < newEnemy.y + 10 && player.vy > 0) {
            newEnemy.alive = false;
            const points = enemy.type === 'goomba' ? 100 : 200;
            setScore(prev => {
              const newScore = prev + points;
              onScoreChange(newScore);
              return newScore;
            });
            addParticles(newEnemy.x + newEnemy.width/2, newEnemy.y, '#FFD700', 6);
            setPlayer(prev => ({ ...prev, vy: -12 }));
          } else {
            // Player hit by enemy
            if (player.big) {
              setPlayer(prev => ({ ...prev, big: false }));
              addParticles(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, '#FF6347', 8);
            } else {
              setLives(prev => {
                if (prev <= 1) {
                  setGameOver(true);
                  setIsPlaying(false);
                  onGameEnd(score);
                  return 0;
                }
                return prev - 1;
              });
              
              addParticles(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, '#DC143C', 8);
              setPlayer(prev => ({
                ...prev,
                x: 100,
                y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
                vx: 0,
                vy: 0
              }));
            }
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
          width: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE,
          height: player.big ? PLAYER_SIZE + 16 : PLAYER_SIZE
        };
        
        const coinRect = {
          x: coin.x,
          y: coin.y,
          width: 32,
          height: 32
        };
        
        if (checkCollision(playerRect, coinRect)) {
          setScore(prev => {
            const newScore = prev + 200;
            onScoreChange(newScore);
            return newScore;
          });
          
          addParticles(coin.x + 16, coin.y + 16, '#FFD700', 6);
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
          vy: particle.vy + 0.3,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
    );

  }, [player, enemies, coins, powerUps, blocks, keys, score, lives, level, isPaused, gameOver, checkCollision, addParticles, onScoreChange, onGameEnd]);

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
      }, 16);
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
    setTime(400);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setCameraX(0);
    setPlayer({
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 'right',
      animFrame: 0,
      big: false
    });
    setCoins([]);
    setPowerUps([]);
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
          <h3 className="text-2xl font-bold text-neon-green animate-text-glow drop-shadow-lg">🍄 Super Mario Bros</h3>
          
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
              <p className="text-sm text-muted-foreground">World: 1-{level}</p>
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
          <h4 className="font-bold text-neon-pink mb-2">Time</h4>
          <p className="text-xl font-bold">{time}</p>
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
            <p>• Hit ? blocks for power-ups</p>
            <p>• Jump on enemies to defeat them</p>
            <p>• Collect coins for points</p>
            <p>• Avoid running out of time!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};