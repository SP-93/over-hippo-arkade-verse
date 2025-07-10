import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, RotateCcw } from "lucide-react";

interface MarioGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: () => void;
  onGameStart: () => Promise<boolean>;
}

interface Player {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isOnGround: boolean;
}

interface Enemy {
  x: number;
  y: number;
  direction: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export const Mario2DGame = ({ onScoreChange, onGameEnd, onGameStart }: MarioGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 320,
    velocityY: 0,
    isJumping: false,
    isOnGround: true
  });
  
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [platforms] = useState([
    { x: 0, y: 350, width: 800, height: 20 },
    { x: 200, y: 280, width: 100, height: 20 },
    { x: 400, y: 200, width: 100, height: 20 },
    { x: 600, y: 150, width: 100, height: 20 }
  ]);

  // Initialize game objects
  const initializeGame = useCallback(() => {
    setPlayer({
      x: 50,
      y: 320,
      velocityY: 0,
      isJumping: false,
      isOnGround: true
    });
    
    setEnemies([
      { x: 300, y: 330, direction: 1 },
      { x: 500, y: 330, direction: -1 },
      { x: 250, y: 260, direction: 1 }
    ]);
    
    setCoins([
      { x: 220, y: 250, collected: false },
      { x: 420, y: 170, collected: false },
      { x: 620, y: 120, collected: false },
      { x: 150, y: 320, collected: false },
      { x: 350, y: 320, collected: false }
    ]);
    
    setScore(0);
    setLives(3);
    setLevel(1);
  }, []);

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(e.key));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key);
        return newSet;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game physics and movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setPlayer(prevPlayer => {
        let newPlayer = { ...prevPlayer };
        
        // Horizontal movement
        if (pressedKeys.has('ArrowLeft') || pressedKeys.has('a')) {
          newPlayer.x = Math.max(0, newPlayer.x - 3);
        }
        if (pressedKeys.has('ArrowRight') || pressedKeys.has('d')) {
          newPlayer.x = Math.min(770, newPlayer.x + 3);
        }
        
        // Jumping
        if ((pressedKeys.has('ArrowUp') || pressedKeys.has('w') || pressedKeys.has(' ')) && newPlayer.isOnGround) {
          newPlayer.velocityY = -12;
          newPlayer.isJumping = true;
          newPlayer.isOnGround = false;
        }
        
        // Gravity
        newPlayer.velocityY += 0.5;
        newPlayer.y += newPlayer.velocityY;
        
        // Platform collision
        newPlayer.isOnGround = false;
        platforms.forEach(platform => {
          if (newPlayer.x + 20 > platform.x && 
              newPlayer.x < platform.x + platform.width &&
              newPlayer.y + 20 >= platform.y &&
              newPlayer.y + 20 <= platform.y + platform.height + 5 &&
              newPlayer.velocityY >= 0) {
            newPlayer.y = platform.y - 20;
            newPlayer.velocityY = 0;
            newPlayer.isOnGround = true;
            newPlayer.isJumping = false;
          }
        });
        
        // Prevent falling through ground
        if (newPlayer.y >= 330) {
          newPlayer.y = 330;
          newPlayer.velocityY = 0;
          newPlayer.isOnGround = true;
          newPlayer.isJumping = false;
        }
        
        return newPlayer;
      });

      // Move enemies
      setEnemies(prevEnemies => 
        prevEnemies.map(enemy => ({
          ...enemy,
          x: enemy.x + enemy.direction * 1.5,
          direction: enemy.x <= 100 || enemy.x >= 700 ? -enemy.direction : enemy.direction
        }))
      );
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, pressedKeys, platforms]);

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Coin collection
    setCoins(prevCoins => {
      const newCoins = prevCoins.map(coin => {
        if (!coin.collected &&
            Math.abs(player.x - coin.x) < 20 &&
            Math.abs(player.y - coin.y) < 20) {
          setScore(prev => {
            const newScore = prev + 100;
            onScoreChange(newScore);
            return newScore;
          });
          return { ...coin, collected: true };
        }
        return coin;
      });
      return newCoins;
    });

    // Enemy collision
    enemies.forEach(enemy => {
      if (Math.abs(player.x - enemy.x) < 20 && Math.abs(player.y - enemy.y) < 20) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
            onGameEnd();
          }
          return newLives;
        });
        
        // Reset player position after hit
        setPlayer(prev => ({ ...prev, x: 50, y: 320 }));
      }
    });

    // Level completion
    if (coins.every(coin => coin.collected)) {
      setLevel(prev => prev + 1);
      setScore(prev => {
        const newScore = prev + 1000;
        onScoreChange(newScore);
        return newScore;
      });
      initializeGame();
    }
  }, [player, enemies, coins, gameState, onScoreChange, onGameEnd, initializeGame]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 800, 400);

    // Draw platforms
    ctx.fillStyle = '#8B4513';
    platforms.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw player (Mario)
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, 20, 20);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 5, player.y + 5, 3, 3);
    ctx.fillRect(player.x + 12, player.y + 5, 3, 3);

    // Draw enemies (Goombas)
    ctx.fillStyle = '#8B4513';
    enemies.forEach(enemy => {
      ctx.fillRect(enemy.x, enemy.y, 20, 20);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 3, enemy.y + 3, 3, 3);
      ctx.fillRect(enemy.x + 14, enemy.y + 3, 3, 3);
      ctx.fillStyle = '#8B4513';
    });

    // Draw coins
    ctx.fillStyle = '#FFD700';
    coins.forEach(coin => {
      if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(coin.x + 10, coin.y + 10, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw game over or waiting screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 400, 180);
      ctx.fillStyle = '#FFF';
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${score}`, 400, 220);
    }

    if (gameState === 'waiting') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MARIO GAME', 400, 180);
      ctx.fillStyle = '#FFF';
      ctx.font = '16px Arial';
      ctx.fillText('Press START to begin!', 400, 220);
    }
  }, [player, enemies, coins, platforms, gameState, score]);

  const startGame = async () => {
    const canStart = await onGameStart();
    if (canStart) {
      initializeGame();
      setGameState('playing');
    }
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const resetGame = () => {
    initializeGame();
    setGameState('waiting');
  };

  return (
    <Card className="p-6 bg-gradient-card border-primary max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">Mario Platform Game</h3>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Score: {score}</Badge>
            <Badge variant="secondary">Lives: {lives}</Badge>
            <Badge variant="secondary">Level: {level}</Badge>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {gameState === 'waiting' && (
            <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <Button onClick={pauseGame} variant="outline">
              {gameState === 'paused' ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex justify-center">
          <canvas 
            ref={canvasRef}
            width={800}
            height={400}
            className="border border-border rounded-lg bg-sky-200"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Use ARROW KEYS or WASD to move • SPACE or UP to jump • Collect coins and avoid enemies!</p>
        </div>
      </div>
    </Card>
  );
};