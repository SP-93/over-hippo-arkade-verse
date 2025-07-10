import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import { Box, Sphere } from "@react-three/drei";
import * as THREE from "three";

interface Breakout3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

interface Ball3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
}

interface Paddle3D {
  position: THREE.Vector3;
  size: THREE.Vector3;
}

interface Brick3D {
  id: number;
  position: THREE.Vector3;
  size: THREE.Vector3;
  color: string;
  destroyed: boolean;
  health: number;
  maxHealth: number;
}

interface PowerUp3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'multi-ball' | 'big-paddle' | 'slow-ball' | 'extra-life';
  active: boolean;
  collected: boolean;
}

// 3D Ball Component
const Ball3D = ({ ball }: { ball: Ball3D }) => {
  const ballRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ballRef.current) {
      ballRef.current.position.copy(ball.position);
      ballRef.current.rotation.x = state.clock.elapsedTime * 4;
      ballRef.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });

  return (
    <Sphere ref={ballRef} args={[ball.radius, 16, 16]} castShadow>
      <meshStandardMaterial 
        color="#FFD700" 
        metalness={0.8} 
        roughness={0.1}
        emissive="#666600"
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

// 3D Paddle Component
const Paddle3D = ({ paddle }: { paddle: Paddle3D }) => {
  const paddleRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (paddleRef.current) {
      paddleRef.current.position.copy(paddle.position);
      const glow = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      paddleRef.current.scale.setScalar(glow);
    }
  });

  return (
    <group ref={paddleRef}>
      <Box args={paddle.size.toArray()} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#00ff41" 
          metalness={0.5} 
          roughness={0.2}
          emissive="#004411"
          emissiveIntensity={0.2}
        />
      </Box>
      
      {/* Paddle glow effect */}
      <Box args={[paddle.size.x * 1.1, paddle.size.y * 1.1, paddle.size.z * 1.1]}>
        <meshBasicMaterial color="#00ff41" transparent opacity={0.2} />
      </Box>
    </group>
  );
};

// 3D Brick Component
const Brick3D = ({ brick }: { brick: Brick3D }) => {
  const brickRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (brickRef.current && !brick.destroyed) {
      const healthRatio = brick.health / brick.maxHealth;
      const damage = 1 - healthRatio;
      brickRef.current.rotation.x = damage * Math.sin(state.clock.elapsedTime * 10) * 0.1;
      brickRef.current.rotation.z = damage * Math.cos(state.clock.elapsedTime * 8) * 0.1;
    }
  });

  if (brick.destroyed) return null;

  const healthRatio = brick.health / brick.maxHealth;
  const opacity = Math.max(0.3, healthRatio);

  return (
    <group ref={brickRef}>
      <Box 
        position={brick.position.toArray()} 
        args={brick.size.toArray()} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={brick.color} 
          metalness={0.3} 
          roughness={0.4}
          transparent
          opacity={opacity}
          emissive={brick.color}
          emissiveIntensity={0.1}
        />
      </Box>
      
      {/* Damage cracks */}
      {healthRatio < 0.7 && (
        <Box 
          position={brick.position.toArray()} 
          args={[brick.size.x * 1.02, brick.size.y * 1.02, brick.size.z * 1.02]}
        >
          <meshBasicMaterial color="#000000" transparent opacity={0.2} />
        </Box>
      )}
    </group>
  );
};

// 3D PowerUp Component
const PowerUp3D = ({ powerUp }: { powerUp: PowerUp3D }) => {
  const powerUpRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (powerUpRef.current && powerUp.active && !powerUp.collected) {
      powerUpRef.current.position.copy(powerUp.position);
      powerUpRef.current.rotation.y = state.clock.elapsedTime * 3;
      const scale = Math.sin(state.clock.elapsedTime * 5) * 0.2 + 1;
      powerUpRef.current.scale.setScalar(scale);
    }
  });

  if (!powerUp.active || powerUp.collected) return null;

  const getColor = () => {
    switch (powerUp.type) {
      case 'multi-ball': return "#ff3366";
      case 'big-paddle': return "#33ff66";
      case 'slow-ball': return "#3366ff";
      case 'extra-life': return "#ff6633";
      default: return "#ffffff";
    }
  };

  return (
    <group ref={powerUpRef}>
      <Sphere args={[0.3, 12, 12]} castShadow>
        <meshStandardMaterial 
          color={getColor()} 
          metalness={0.8} 
          roughness={0.1}
          emissive={getColor()}
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );
};

export const Breakout3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Breakout3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [particleEffects, setParticleEffects] = useState<Array<{ position: THREE.Vector3, color: string }>>([]);
  
  const { handleGameStart } = useGameManager();
  
  // Game objects
  const [balls, setBalls] = useState<Ball3D[]>([{
    position: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0.3, 0.2, 0),
    radius: 0.3
  }]);

  const [paddle, setPaddle] = useState<Paddle3D>({
    position: new THREE.Vector3(0, 0.5, -8),
    size: new THREE.Vector3(3, 0.5, 1)
  });

  const [bricks, setBricks] = useState<Brick3D[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp3D[]>([]);

  // Initialize bricks
  useEffect(() => {
    const initBricks = () => {
      const newBricks: Brick3D[] = [];
      const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
      
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
          const health = Math.max(1, 6 - row);
          newBricks.push({
            id: row * 10 + col,
            position: new THREE.Vector3(
              -9 + col * 2,
              3 + row * 1.2,
              5
            ),
            size: new THREE.Vector3(1.8, 1, 0.8),
            color: colors[row],
            destroyed: false,
            health,
            maxHealth: health
          });
        }
      }
      setBricks(newBricks);
    };

    if (isPlaying) {
      initBricks();
    }
  }, [isPlaying, level]);

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
      // Update paddle
      setPaddle(prevPaddle => {
        const newPaddle = { ...prevPaddle };
        
        if (keys['ArrowLeft'] || keys['a']) {
          newPaddle.position.x -= 0.4;
        }
        if (keys['ArrowRight'] || keys['d']) {
          newPaddle.position.x += 0.4;
        }
        
        // Paddle boundaries
        newPaddle.position.x = Math.max(-8, Math.min(8, newPaddle.position.x));
        
        return newPaddle;
      });
      
      // Update balls
      setBalls(prevBalls => 
        prevBalls.map(ball => {
          const newBall = { ...ball };
          newBall.position.add(newBall.velocity);
          
          // Wall collisions
          if (newBall.position.x <= -10 || newBall.position.x >= 10) {
            newBall.velocity.x *= -1;
            newBall.position.x = Math.max(-10, Math.min(10, newBall.position.x));
          }
          
          if (newBall.position.y >= 12) {
            newBall.velocity.y *= -1;
          }
          
          // Paddle collision
          const paddleBox = new THREE.Box3().setFromCenterAndSize(
            paddle.position,
            paddle.size
          );
          const ballSphere = new THREE.Sphere(newBall.position, newBall.radius);
          
          if (paddleBox.intersectsSphere(ballSphere) && newBall.velocity.y < 0) {
            newBall.velocity.y *= -1;
            // Add english based on where ball hits paddle
            const hitPos = (newBall.position.x - paddle.position.x) / (paddle.size.x / 2);
            newBall.velocity.x += hitPos * 0.1;
            
            // Keep ball above paddle
            newBall.position.y = paddle.position.y + paddle.size.y/2 + newBall.radius;
          }
          
          return newBall;
        }).filter(ball => {
          // Remove balls that fall below paddle
          if (ball.position.y < -10) {
            setLives(prev => prev - 1);
            toast.error("Ball lost! Lives: " + (lives - 1));
            return false;
          }
          return true;
        })
      );
      
      // Update power-ups
      setPowerUps(prevPowerUps => 
        prevPowerUps.map(powerUp => {
          if (!powerUp.active || powerUp.collected) return powerUp;
          
          powerUp.position.add(powerUp.velocity);
          
          // Check paddle collision
          const paddleBox = new THREE.Box3().setFromCenterAndSize(
            paddle.position,
            paddle.size
          );
          const powerUpSphere = new THREE.Sphere(powerUp.position, 0.3);
          
          if (paddleBox.intersectsSphere(powerUpSphere)) {
            powerUp.collected = true;
            applyPowerUp(powerUp.type);
          }
          
          // Remove if below screen
          if (powerUp.position.y < -10) {
            powerUp.active = false;
          }
          
          return powerUp;
        })
      );
      
      checkBrickCollisions();
      
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, keys, paddle, lives]);

  const checkBrickCollisions = useCallback(() => {
    setBalls(prevBalls => 
      prevBalls.map(ball => {
        let newBall = { ...ball };
        
        setBricks(prevBricks => 
          prevBricks.map(brick => {
            if (brick.destroyed) return brick;
            
            const brickBox = new THREE.Box3().setFromCenterAndSize(
              brick.position,
              brick.size
            );
            const ballSphere = new THREE.Sphere(newBall.position, newBall.radius);
            
            if (brickBox.intersectsSphere(ballSphere)) {
              // Brick hit
              brick.health--;
              
              if (brick.health <= 0) {
                brick.destroyed = true;
                
                // Add particle effect
                setParticleEffects(prev => [...prev, { 
                  position: brick.position.clone(), 
                  color: brick.color 
                }]);
                
                // Chance to spawn power-up
                if (Math.random() < 0.2) {
                  const powerUpTypes: PowerUp3D['type'][] = ['multi-ball', 'big-paddle', 'slow-ball', 'extra-life'];
                  setPowerUps(prev => [...prev, {
                    id: Date.now(),
                    position: brick.position.clone(),
                    velocity: new THREE.Vector3(0, -0.1, 0),
                    type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
                    active: true,
                    collected: false
                  }]);
                }
              }
              
              // Ball reflection
              const ballToBrick = new THREE.Vector3().subVectors(newBall.position, brick.position);
              if (Math.abs(ballToBrick.x) > Math.abs(ballToBrick.y)) {
                newBall.velocity.x *= -1;
              } else {
                newBall.velocity.y *= -1;
              }
              
              // Score
              const points = brick.maxHealth * 10;
              setScore(prev => {
                const newScore = prev + points;
                onScoreChange?.(newScore);
                return newScore;
              });
            }
            
            return brick;
          })
        );
        
        return newBall;
      })
    );
  }, [onScoreChange]);

  const applyPowerUp = (type: PowerUp3D['type']) => {
    switch (type) {
      case 'multi-ball':
        setBalls(prev => [
          ...prev,
          ...prev.map(ball => ({
            ...ball,
            position: ball.position.clone(),
            velocity: new THREE.Vector3(
              ball.velocity.x + (Math.random() - 0.5) * 0.2,
              ball.velocity.y,
              ball.velocity.z
            )
          }))
        ]);
        toast.success("Multi-ball activated!");
        break;
      
      case 'big-paddle':
        setPaddle(prev => ({
          ...prev,
          size: new THREE.Vector3(4.5, 0.5, 1)
        }));
        setTimeout(() => {
          setPaddle(prev => ({
            ...prev,
            size: new THREE.Vector3(3, 0.5, 1)
          }));
        }, 10000);
        toast.success("Big paddle activated!");
        break;
      
      case 'slow-ball':
        setBalls(prev => prev.map(ball => ({
          ...ball,
          velocity: ball.velocity.multiplyScalar(0.7)
        })));
        toast.success("Slow ball activated!");
        break;
      
      case 'extra-life':
        setLives(prev => prev + 1);
        toast.success("Extra life gained!");
        break;
    }
  };

  // Game over and win conditions
  useEffect(() => {
    if (lives <= 0 || balls.length === 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over! Final Score: " + score);
    }
    
    if (bricks.every(brick => brick.destroyed)) {
      setLevel(prev => prev + 1);
      setScore(prev => {
        const newScore = prev + 500;
        onScoreChange?.(newScore);
        return newScore;
      });
      toast.success("Level Complete! +500 points!");
      // Reset for next level
      setBalls([{
        position: new THREE.Vector3(0, 2, 0),
        velocity: new THREE.Vector3(0.3, 0.2, 0),
        radius: 0.3
      }]);
    }
  }, [lives, balls, bricks, score, level, onGameEnd, onScoreChange]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('breakout')) return;
    
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setBalls([{
      position: new THREE.Vector3(0, 2, 0),
      velocity: new THREE.Vector3(0.3, 0.2, 0),
      radius: 0.3
    }]);
    setPaddle({
      position: new THREE.Vector3(0, 0.5, -8),
      size: new THREE.Vector3(3, 0.5, 1)
    });
    setPowerUps([]);
    setParticleEffects([]);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Breakout</h2>
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
          gameId="breakout-3d"
          camera={{ position: [0, 8, -12], fov: 60 }}
          lighting="retro"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Game boundaries */}
          <Box args={[0.2, 15, 20]} position={[-10, 6, 0]} castShadow>
            <meshStandardMaterial color="#666666" />
          </Box>
          <Box args={[0.2, 15, 20]} position={[10, 6, 0]} castShadow>
            <meshStandardMaterial color="#666666" />
          </Box>
          <Box args={[20, 0.2, 20]} position={[0, 12, 0]} castShadow>
            <meshStandardMaterial color="#666666" />
          </Box>
          
          {/* Game floor */}
          <GameFloor3D size={25} color="#1a1a2e" pattern="grid" />
          
          {/* Paddle */}
          <Paddle3D paddle={paddle} />
          
          {/* Balls */}
          {balls.map((ball, index) => (
            <Ball3D key={index} ball={ball} />
          ))}
          
          {/* Bricks */}
          {bricks.map(brick => (
            <Brick3D key={brick.id} brick={brick} />
          ))}
          
          {/* Power-ups */}
          {powerUps.map(powerUp => (
            <PowerUp3D key={powerUp.id} powerUp={powerUp} />
          ))}
          
          {/* Particle effects */}
          {particleEffects.map((effect, index) => (
            <ParticleSystem3D 
              key={index}
              position={effect.position.toArray()} 
              count={20} 
              color={effect.color}
              spread={2}
            />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          A/D or Arrow Keys to move paddle • Break all bricks • Collect power-ups!
        </div>
      </Card>
    </div>
  );
};
