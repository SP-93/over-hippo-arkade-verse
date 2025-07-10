import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { Player3D, Enemy3D, Collectible3D, Platform3D, GameFloor3D } from "./engine/Game3DComponents";
import * as THREE from "three";

interface Mario3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

const WORLD_SIZE = 50;
const PLAYER_SPEED = 0.3;
const JUMP_FORCE = 0.8;
const GRAVITY = 0.03;

interface Mario3DPlayer {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  grounded: boolean;
  lives: number;
  size: number;
  powerUp: 'small' | 'big' | 'fire';
}

interface Mario3DEnemy {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'goomba' | 'koopa';
  alive: boolean;
}

interface Mario3DCoin {
  id: number;
  position: THREE.Vector3;
  collected: boolean;
}

interface Mario3DPlatform {
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: 'ground' | 'brick' | 'pipe' | 'moving';
}

// Mario Character Component
const Mario3DCharacter = ({ player, animation }: { player: Mario3DPlayer, animation: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(player.position);
    }
  });

  const getColor = () => {
    switch (player.powerUp) {
      case 'big': return "#DC143C";
      case 'fire': return "#FF6347";
      default: return "#0066CC";
    }
  };

  const getSize = () => {
    return player.powerUp === 'small' ? 0.8 : 1.2;
  };

  return (
    <group ref={meshRef}>
      {/* Mario's body */}
      <Player3D 
        position={[0, 0, 0]}
        color={getColor()}
        size={getSize()}
        animation={animation}
        type="cube"
      />
      
      {/* Mario's hat */}
      <Player3D 
        position={[0, getSize() * 0.6, 0]}
        color="#DC143C"
        size={getSize() * 0.7}
        type="cube"
      />
      
      {/* Mario's mustache */}
      <Player3D 
        position={[0, getSize() * 0.1, getSize() * 0.4]}
        color="#8B4513"
        size={getSize() * 0.3}
        type="cube"
      />
    </group>
  );
};

export const Mario3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Mario3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const { handleGameStart } = useGameManager();
  
  // Game objects
  const [player, setPlayer] = useState<Mario3DPlayer>({
    position: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    grounded: false,
    lives: 3,
    size: 1,
    powerUp: 'small'
  });

  const [enemies, setEnemies] = useState<Mario3DEnemy[]>([
    { id: 1, position: new THREE.Vector3(10, 1, 0), velocity: new THREE.Vector3(-0.1, 0, 0), type: 'goomba', alive: true },
    { id: 2, position: new THREE.Vector3(-15, 1, 5), velocity: new THREE.Vector3(0.05, 0, 0), type: 'koopa', alive: true },
    { id: 3, position: new THREE.Vector3(20, 1, -3), velocity: new THREE.Vector3(-0.08, 0, 0), type: 'goomba', alive: true },
  ]);

  const [coins, setCoins] = useState<Mario3DCoin[]>([
    { id: 1, position: new THREE.Vector3(5, 3, 2), collected: false },
    { id: 2, position: new THREE.Vector3(12, 2, -1), collected: false },
    { id: 3, position: new THREE.Vector3(-8, 4, 3), collected: false },
    { id: 4, position: new THREE.Vector3(18, 3, 0), collected: false },
    { id: 5, position: new THREE.Vector3(-12, 2, -2), collected: false },
  ]);

  const platforms: Mario3DPlatform[] = [
    // Ground platforms
    { position: new THREE.Vector3(0, 0, 0), size: new THREE.Vector3(30, 1, 30), type: 'ground' },
    
    // Elevated platforms
    { position: new THREE.Vector3(8, 3, 0), size: new THREE.Vector3(4, 1, 4), type: 'brick' },
    { position: new THREE.Vector3(-10, 4, 5), size: new THREE.Vector3(3, 1, 3), type: 'brick' },
    { position: new THREE.Vector3(15, 2, -5), size: new THREE.Vector3(5, 1, 2), type: 'brick' },
    
    // Pipes
    { position: new THREE.Vector3(20, 2, 0), size: new THREE.Vector3(2, 4, 2), type: 'pipe' },
    { position: new THREE.Vector3(-18, 1.5, -8), size: new THREE.Vector3(2, 3, 2), type: 'pipe' },
    
    // Moving platforms
    { position: new THREE.Vector3(0, 8, 10), size: new THREE.Vector3(3, 0.5, 3), type: 'moving' },
  ];

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
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

  // Game physics
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayer(prevPlayer => {
        const newPlayer = { ...prevPlayer };
        
        // Handle input
        if (keys['ArrowLeft'] || keys['a']) {
          newPlayer.velocity.x = -PLAYER_SPEED;
        } else if (keys['ArrowRight'] || keys['d']) {
          newPlayer.velocity.x = PLAYER_SPEED;
        } else {
          newPlayer.velocity.x *= 0.8; // Friction
        }
        
        if (keys['ArrowUp'] || keys['w']) {
          newPlayer.velocity.z = -PLAYER_SPEED;
        } else if (keys['ArrowDown'] || keys['s']) {
          newPlayer.velocity.z = PLAYER_SPEED;
        } else {
          newPlayer.velocity.z *= 0.8;
        }
        
        if (keys[' '] && newPlayer.grounded) {
          newPlayer.velocity.y = JUMP_FORCE;
          newPlayer.grounded = false;
        }
        
        // Apply gravity
        newPlayer.velocity.y -= GRAVITY;
        
        // Update position
        newPlayer.position.add(newPlayer.velocity);
        
        // Platform collision
        newPlayer.grounded = false;
        platforms.forEach(platform => {
          const playerBox = new THREE.Box3().setFromCenterAndSize(
            newPlayer.position,
            new THREE.Vector3(newPlayer.size, newPlayer.size, newPlayer.size)
          );
          const platformBox = new THREE.Box3().setFromCenterAndSize(
            platform.position,
            platform.size
          );
          
          if (playerBox.intersectsBox(platformBox)) {
            // Land on top of platform
            if (newPlayer.velocity.y <= 0 && 
                newPlayer.position.y > platform.position.y + platform.size.y / 2) {
              newPlayer.position.y = platform.position.y + platform.size.y / 2 + newPlayer.size / 2;
              newPlayer.velocity.y = 0;
              newPlayer.grounded = true;
            }
          }
        });
        
        // World boundaries
        newPlayer.position.x = Math.max(-WORLD_SIZE/2, Math.min(WORLD_SIZE/2, newPlayer.position.x));
        newPlayer.position.z = Math.max(-WORLD_SIZE/2, Math.min(WORLD_SIZE/2, newPlayer.position.z));
        
        // Fall death
        if (newPlayer.position.y < -10) {
          setLives(prev => prev - 1);
          newPlayer.position.set(0, 2, 0);
          newPlayer.velocity.set(0, 0, 0);
          toast.error("Mario fell! Lives remaining: " + (lives - 1));
        }
        
        return newPlayer;
      });
      
      // Update enemies with improved AI
      setEnemies(prevEnemies => 
        prevEnemies.map(enemy => {
          if (!enemy.alive) return enemy;
          
          // Smooth enemy movement
          enemy.position.add(enemy.velocity);
          
          // Reverse direction at world edges or platform edges
          if (enemy.position.x > WORLD_SIZE/2 || enemy.position.x < -WORLD_SIZE/2) {
            enemy.velocity.x *= -1;
          }
          
          // Simple platform edge detection
          const groundY = 1;
          if (enemy.position.y <= groundY) {
            enemy.position.y = groundY;
          }
          
          return enemy;
        })
      );
      
      // Check collisions
      checkCollisions();
      
    }, 16); // ~60fps

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, keys, lives]);

  const checkCollisions = useCallback(() => {
    // Player-enemy collision
    enemies.forEach((enemy, enemyIndex) => {
      if (!enemy.alive) return;
      
      const distance = player.position.distanceTo(enemy.position);
      if (distance < 1.5) {
        // Check if Mario is jumping on enemy (from above)
        if (player.velocity.y < -0.1 && player.position.y > enemy.position.y + 0.5) {
          // Jump on enemy - kill it
          setEnemies(prev => prev.map((e, i) => 
            i === enemyIndex ? { ...e, alive: false } : e
          ));
          setScore(prev => {
            const newScore = prev + 100;
            onScoreChange?.(newScore);
            return newScore;
          });
          // Mario bounces up after killing enemy
          setPlayer(prev => ({
            ...prev,
            velocity: prev.velocity.clone().setY(JUMP_FORCE * 0.6)
          }));
          toast.success("+100 Enemy defeated!");
        } else {
          // Side collision - take damage
          if (player.powerUp === 'small') {
            setLives(prev => prev - 1);
            toast.error("Mario got hurt!");
            // Knockback
            const direction = player.position.clone().sub(enemy.position).normalize();
            setPlayer(prev => ({
              ...prev,
              position: prev.position.clone().add(direction.multiplyScalar(2)),
              velocity: prev.velocity.clone().set(direction.x * 2, prev.velocity.y, direction.z * 2)
            }));
          } else {
            setPlayer(prev => ({ ...prev, powerUp: 'small', size: 0.8 }));
            toast.warning("Mario shrunk!");
          }
        }
      }
    });
    
    // Player-coin collision
    setCoins(prevCoins => 
      prevCoins.map(coin => {
        if (coin.collected) return coin;
        
        const distance = player.position.distanceTo(coin.position);
        if (distance < 1.2) {
          setScore(prev => {
            const newScore = prev + 50;
            onScoreChange?.(newScore);
            return newScore;
          });
          toast.success("+50 coins!");
          return { ...coin, collected: true };
        }
        return coin;
      })
    );
  }, [player, enemies, onScoreChange]);

  // Game over check
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over! Final Score: " + score);
    }
  }, [lives, score, onGameEnd]);

  const startGame = async () => {
    if (onGameStart && !(await onGameStart())) return;
    if (!handleGameStart('mario')) return;
    
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setPlayer({
      position: new THREE.Vector3(0, 2, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      grounded: false,
      lives: 3,
      size: 1,
      powerUp: 'small'
    });
    setCoins(prev => prev.map(coin => ({ ...coin, collected: false })));
    setEnemies(prev => prev.map(enemy => ({ ...enemy, alive: true })));
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const getPlayerAnimation = () => {
    if (!player.grounded) return "jump";
    if (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1) return "spin";
    return "idle";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Mario Adventure</h2>
          <div className="text-lg font-bold text-arcade-gold">
            Score: {score} | Lives: {lives} | Level: {level}
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={startGame}
            variant="arcade"
            disabled={isPlaying && !gameOver}
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
          
          {isPlaying && !gameOver && (
            <Button onClick={pauseGame} variant="secondary">
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>

        <Game3DEngine
          gameId="mario-3d"
          camera={{ position: [0, 15, 15], fov: 60 }}
          lighting="arcade"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Game Floor */}
          <GameFloor3D size={WORLD_SIZE} color="#228B22" pattern="grid" />
          
          {/* Platforms */}
          {platforms.map((platform, index) => (
            <Platform3D
              key={index}
              position={platform.position.toArray()}
              size={platform.size.toArray()}
              color={platform.type === 'pipe' ? "#32CD32" : platform.type === 'brick' ? "#CD853F" : "#8B4513"}
              type={platform.type}
            />
          ))}
          
          {/* Mario Player */}
          <Mario3DCharacter player={player} animation={getPlayerAnimation()} />
          
          {/* Enemies */}
          {enemies.map(enemy => 
            enemy.alive && (
              <Enemy3D
                key={enemy.id}
                position={enemy.position.toArray()}
                color={enemy.type === 'goomba' ? "#8B4513" : "#32CD32"}
                size={0.8}
                behavior="patrol"
                speed={1}
              />
            )
          )}
          
          {/* Coins */}
          {coins.map(coin => (
            <Collectible3D
              key={coin.id}
              position={coin.position.toArray()}
              color="#FFD700"
              type="coin"
              collected={coin.collected}
            />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD to move • Space to jump • Jump on enemies to defeat them!
        </div>
      </Card>
    </div>
  );
};