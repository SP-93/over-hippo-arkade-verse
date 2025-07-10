import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { Player3D, Enemy3D, Platform3D, GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import { Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface KingKong3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

interface Player3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  climbing: boolean;
  health: number;
  invulnerable: number;
}

interface Obstacle3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'barrel' | 'fire';
  active: boolean;
  rotation: number;
}

interface Platform3D {
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: 'floor' | 'ladder';
}

// King Kong Boss Component
const KingKong3D = ({ position, defeated }: { position: THREE.Vector3, defeated: boolean }) => {
  const bossRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (bossRef.current && !defeated) {
      const bounce = Math.sin(state.clock.elapsedTime * 2) * 0.5;
      bossRef.current.position.y = position.y + bounce;
      bossRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  if (defeated) return null;

  return (
    <group ref={bossRef} position={position.toArray()}>
      {/* King Kong Body */}
      <Box args={[3, 4, 2]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" metalness={0.2} roughness={0.8} />
      </Box>
      
      {/* Arms */}
      <Box args={[1, 3, 1]} position={[-2.5, 0, 0]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
      <Box args={[1, 3, 1]} position={[2.5, 0, 0]} castShadow>
        <meshStandardMaterial color="#654321" />
      </Box>
      
      {/* Head */}
      <Box args={[2, 2, 1.5]} position={[0, 3, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      
      {/* Eyes */}
      <Box args={[0.3, 0.3, 0.2]} position={[-0.5, 3.2, 0.8]} castShadow>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </Box>
      <Box args={[0.3, 0.3, 0.2]} position={[0.5, 3.2, 0.8]} castShadow>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </Box>
    </group>
  );
};

// 3D Barrel Component
const Barrel3D = ({ obstacle }: { obstacle: Obstacle3D }) => {
  const barrelRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (barrelRef.current) {
      barrelRef.current.position.copy(obstacle.position);
      barrelRef.current.rotation.z = obstacle.rotation;
    }
  });

  return (
    <Cylinder
      ref={barrelRef}
      args={[0.4, 0.4, 0.6, 16]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color="#8B4513" 
        metalness={0.1} 
        roughness={0.9}
      />
    </Cylinder>
  );
};

// Tower Structure Component
const TowerStructure = ({ platforms }: { platforms: Platform3D[] }) => {
  return (
    <group>
      {platforms.map((platform, index) => {
        if (platform.type === 'floor') {
          return (
            <Platform3D
              key={index}
              position={platform.position.toArray()}
              size={platform.size.toArray()}
              color="#4a5568"
              type="solid"
            />
          );
        } else if (platform.type === 'ladder') {
          return (
            <group key={index}>
              {/* Ladder sides */}
              <Box 
                position={[platform.position.x - 0.4, platform.position.y, platform.position.z]}
                args={[0.1, platform.size.y, 0.1]}
                castShadow
              >
                <meshStandardMaterial color="#8B4513" />
              </Box>
              <Box 
                position={[platform.position.x + 0.4, platform.position.y, platform.position.z]}
                args={[0.1, platform.size.y, 0.1]}
                castShadow
              >
                <meshStandardMaterial color="#8B4513" />
              </Box>
              
              {/* Ladder rungs */}
              {Array.from({ length: Math.floor(platform.size.y / 2) }, (_, i) => (
                <Box
                  key={i}
                  position={[platform.position.x, platform.position.y - platform.size.y/2 + i * 2, platform.position.z]}
                  args={[0.8, 0.1, 0.1]}
                  castShadow
                >
                  <meshStandardMaterial color="#A0522D" />
                </Box>
              ))}
            </group>
          );
        }
        return null;
      })}
    </group>
  );
};

export const KingKong3DGame = ({ onScoreChange, onGameEnd, onGameStart }: KingKong3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const { handleGameStart } = useGameManager();
  
  // Game objects
  const [player, setPlayer] = useState<Player3D>({
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    climbing: false,
    health: 3,
    invulnerable: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle3D[]>([]);
  const [bossDefeated, setBossDefeated] = useState(false);
  
  const bossPosition = new THREE.Vector3(0, 25, 0); // Top of tower
  
  // Generate tower platforms
  const platforms: Platform3D[] = [
    // Ground floor
    { position: new THREE.Vector3(0, 0, 0), size: new THREE.Vector3(20, 1, 20), type: 'floor' },
    
    // Tower levels
    ...Array.from({ length: 8 }, (_, i) => ({
      position: new THREE.Vector3(0, (i + 1) * 4, 0),
      size: new THREE.Vector3(15 - i * 0.5, 0.5, 15 - i * 0.5),
      type: 'floor' as const
    })),
    
    // Ladders
    ...Array.from({ length: 7 }, (_, i) => ({
      position: new THREE.Vector3(
        i % 2 === 0 ? 6 : -6, 
        (i + 1) * 4 + 2, 
        0
      ),
      size: new THREE.Vector3(1, 3, 1),
      type: 'ladder' as const
    }))
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
          newPlayer.velocity.x = -0.2;
        } else if (keys['ArrowRight'] || keys['d']) {
          newPlayer.velocity.x = 0.2;
        } else {
          newPlayer.velocity.x *= 0.8;
        }
        
        // Check for ladder climbing
        const onLadder = platforms.some(platform => 
          platform.type === 'ladder' &&
          Math.abs(newPlayer.position.x - platform.position.x) < 1 &&
          Math.abs(newPlayer.position.z - platform.position.z) < 1 &&
          newPlayer.position.y >= platform.position.y - platform.size.y/2 &&
          newPlayer.position.y <= platform.position.y + platform.size.y/2
        );
        
        if (onLadder && (keys['ArrowUp'] || keys['w'])) {
          newPlayer.climbing = true;
          newPlayer.velocity.y = 0.15;
        } else if (onLadder && (keys['ArrowDown'] || keys['s'])) {
          newPlayer.climbing = true;
          newPlayer.velocity.y = -0.15;
        } else if (newPlayer.climbing && onLadder) {
          newPlayer.velocity.y = 0;
        } else {
          newPlayer.climbing = false;
          newPlayer.velocity.y -= 0.02; // Gravity
        }
        
        // Jump
        if ((keys[' '] || keys['ArrowUp']) && !newPlayer.climbing) {
          const onGround = platforms.some(platform => 
            platform.type === 'floor' &&
            Math.abs(newPlayer.position.x - platform.position.x) < platform.size.x/2 &&
            Math.abs(newPlayer.position.z - platform.position.z) < platform.size.z/2 &&
            Math.abs(newPlayer.position.y - (platform.position.y + platform.size.y/2)) < 0.6
          );
          
          if (onGround) {
            newPlayer.velocity.y = 0.4;
          }
        }
        
        // Update position
        newPlayer.position.add(newPlayer.velocity);
        
        // Platform collision
        platforms.forEach(platform => {
          if (platform.type === 'floor') {
            const playerBox = new THREE.Box3().setFromCenterAndSize(
              newPlayer.position,
              new THREE.Vector3(0.8, 1.5, 0.8)
            );
            const platformBox = new THREE.Box3().setFromCenterAndSize(
              platform.position,
              platform.size
            );
            
            if (playerBox.intersectsBox(platformBox) && newPlayer.velocity.y <= 0) {
              newPlayer.position.y = platform.position.y + platform.size.y/2 + 0.75;
              newPlayer.velocity.y = 0;
            }
          }
        });
        
        // World boundaries
        newPlayer.position.x = Math.max(-10, Math.min(10, newPlayer.position.x));
        newPlayer.position.z = Math.max(-10, Math.min(10, newPlayer.position.z));
        
        // Fall death
        if (newPlayer.position.y < -5) {
          setLives(prev => prev - 1);
          newPlayer.position.set(0, 1, 0);
          newPlayer.velocity.set(0, 0, 0);
          toast.error("Player fell! Lives remaining: " + (lives - 1));
        }
        
        // Win condition - reach the top
        if (newPlayer.position.y > 24 && !bossDefeated) {
          setBossDefeated(true);
          setScore(prev => {
            const newScore = prev + 1000;
            onScoreChange?.(newScore);
            return newScore;
          });
          toast.success("You reached King Kong! +1000 points!");
        }
        
        // Invulnerability countdown
        if (newPlayer.invulnerable > 0) {
          newPlayer.invulnerable--;
        }
        
        return newPlayer;
      });
      
      // Spawn obstacles
      if (Math.random() < 0.03 && !bossDefeated) {
        setObstacles(prev => [...prev, {
          id: Date.now(),
          position: new THREE.Vector3(
            bossPosition.x + (Math.random() - 0.5) * 4,
            bossPosition.y,
            bossPosition.z
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            -0.1,
            (Math.random() - 0.5) * 0.2
          ),
          type: 'barrel',
          active: true,
          rotation: 0
        }]);
      }
      
      // Update obstacles
      setObstacles(prevObstacles => 
        prevObstacles.map(obstacle => {
          obstacle.position.add(obstacle.velocity);
          obstacle.velocity.y -= 0.01; // Gravity on barrels
          obstacle.rotation += 0.1;
          
          // Platform bouncing
          platforms.forEach(platform => {
            if (platform.type === 'floor') {
              const obstacleBox = new THREE.Box3().setFromCenterAndSize(
                obstacle.position,
                new THREE.Vector3(0.8, 0.6, 0.8)
              );
              const platformBox = new THREE.Box3().setFromCenterAndSize(
                platform.position,
                platform.size
              );
              
              if (obstacleBox.intersectsBox(platformBox) && obstacle.velocity.y <= 0) {
                obstacle.position.y = platform.position.y + platform.size.y/2 + 0.3;
                obstacle.velocity.y = -obstacle.velocity.y * 0.6;
                obstacle.velocity.x *= 0.9;
                obstacle.velocity.z *= 0.9;
              }
            }
          });
          
          // Remove if too low
          if (obstacle.position.y < -10) {
            obstacle.active = false;
          }
          
          return obstacle;
        }).filter(obstacle => obstacle.active)
      );
      
      // Check collisions
      checkCollisions();
      
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, keys, lives, bossDefeated]);

  const checkCollisions = useCallback(() => {
    if (player.invulnerable > 0) return;
    
    obstacles.forEach((obstacle, index) => {
      const distance = player.position.distanceTo(obstacle.position);
      if (distance < 1) {
        setPlayer(prev => ({ ...prev, invulnerable: 60 }));
        setLives(prev => prev - 1);
        setObstacles(prev => prev.filter((_, i) => i !== index));
        toast.error("Hit by barrel! Lives: " + (lives - 1));
      }
    });
  }, [player, obstacles, lives]);

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
    if (!handleGameStart('kingkong')) return;
    
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setBossDefeated(false);
    setPlayer({
      position: new THREE.Vector3(0, 1, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      climbing: false,
      health: 3,
      invulnerable: 0
    });
    setObstacles([]);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const getPlayerAnimation = () => {
    if (player.climbing) return "pulse";
    if (!player.climbing && Math.abs(player.velocity.y) > 0.1) return "jump";
    if (Math.abs(player.velocity.x) > 0.1) return "spin";
    return "idle";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D King Kong</h2>
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
          gameId="kingkong-3d"
          camera={{ position: [0, 12, 20], fov: 60 }}
          lighting="atmospheric"
          environment="city"
          enableOrbitControls={true}
        >
          {/* Game Floor */}
          <GameFloor3D size={50} color="#2d3748" pattern="grid" />
          
          {/* Tower Structure */}
          <TowerStructure platforms={platforms} />
          
          {/* Player */}
          <Player3D
            position={player.position.toArray()}
            color={player.invulnerable > 0 ? "#ff6666" : "#4169E1"}
            size={0.8}
            type="cube"
            animation={getPlayerAnimation()}
          />
          
          {/* King Kong Boss */}
          <KingKong3D position={bossPosition} defeated={bossDefeated} />
          
          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <Barrel3D key={obstacle.id} obstacle={obstacle} />
          ))}
          
          {/* Particles for effect */}
          {bossDefeated && (
            <ParticleSystem3D position={bossPosition.toArray()} count={30} color="#FFD700" />
          )}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD/Arrow Keys to move • W/S on ladders to climb • Space to jump • Mouse to rotate camera
        </div>
      </Card>
    </div>
  );
};