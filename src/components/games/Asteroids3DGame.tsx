import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import { 
  EnhancedSpaceship3D, 
  EnhancedAsteroid3D, 
  EnhancedBullet3D, 
  ExplosionEffect3D, 
  StarField3D 
} from "./engine/EnhancedAsteroids3DComponents";
import { use3DDefensive } from "@/hooks/use3DDefensive";
import * as THREE from "three";

interface Asteroids3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

interface Ship3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  thrust: boolean;
  invulnerable: number;
}

interface Asteroid3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  health: number;
  rotationSpeed: number;
  destroyed: boolean;
}

interface Bullet3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  active: boolean;
  timeAlive: number;
}

interface Explosion3D {
  id: number;
  position: THREE.Vector3;
  size: number;
  color: string;
  active: boolean;
}

export const Asteroids3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Asteroids3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const { handleGameStart } = useGameManager();
  const { safeVector3, safeGetProperty } = use3DDefensive();
  
  // Game objects
  const [ship, setShip] = useState<Ship3D>({
    position: safeVector3(0, 1, 0),
    velocity: safeVector3(0, 0, 0),
    rotation: 0,
    thrust: false,
    invulnerable: 0
  });

  const [asteroids, setAsteroids] = useState<Asteroid3D[]>([]);
  const [bullets, setBullets] = useState<Bullet3D[]>([]);
  const [explosions, setExplosions] = useState<Explosion3D[]>([]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
      
      // Shooting
      if (e.key === ' ' && isPlaying && !isPaused && !gameOver) {
        try {
          const bulletDirection = safeVector3(
            Math.sin(ship.rotation),
            0,
            Math.cos(ship.rotation)
          );
          bulletDirection.normalize();
          
          setBullets(prev => [...prev, {
            id: Date.now(),
            position: ship.position.clone(),
            velocity: bulletDirection.multiplyScalar(0.8),
            active: true,
            timeAlive: 0
          }]);
        } catch (error) {
          console.warn('⚠️ Failed to create bullet:', error);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: false }));
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, gameOver, ship]);

  // Game physics
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const gameLoop = setInterval(() => {
      // Update ship
      setShip(prevShip => {
        const newShip = { ...prevShip };
        
        // Handle input
        if (keys['ArrowLeft'] || keys['a']) {
          newShip.rotation -= 0.15;
        }
        if (keys['ArrowRight'] || keys['d']) {
          newShip.rotation += 0.15;
        }
        
        newShip.thrust = keys['ArrowUp'] || keys['w'];
        
        if (newShip.thrust) {
          try {
            const thrustDirection = safeVector3(
              Math.sin(newShip.rotation),
              0,
              Math.cos(newShip.rotation)
            );
            thrustDirection.multiplyScalar(0.02);
            newShip.velocity.add(thrustDirection);
          } catch (error) {
            console.warn('⚠️ Failed to apply thrust:', error);
          }
        }
        
        // Apply drag
        newShip.velocity.multiplyScalar(0.98);
        
        // Update position
        newShip.position.add(newShip.velocity);
        
        // Wrap around screen
        if (newShip.position.x > 15) newShip.position.x = -15;
        if (newShip.position.x < -15) newShip.position.x = 15;
        if (newShip.position.z > 15) newShip.position.z = -15;
        if (newShip.position.z < -15) newShip.position.z = 15;
        
        // Invulnerability countdown
        if (newShip.invulnerable > 0) {
          newShip.invulnerable--;
        }
        
        return newShip;
      });
      
      // Update bullets
      setBullets(prevBullets => 
        prevBullets.map(bullet => {
          bullet.position.add(bullet.velocity);
          bullet.timeAlive++;
          
          // Remove bullets after 3 seconds or if they go too far
          if (bullet.timeAlive > 180 || bullet.position.length() > 20) {
            bullet.active = false;
          }
          
          return bullet;
        }).filter(bullet => bullet.active)
      );
      
      // Update asteroids
      setAsteroids(prevAsteroids => 
        prevAsteroids.map(asteroid => {
          if (asteroid.destroyed) return asteroid;
          
          asteroid.position.add(asteroid.velocity);
          
          // Wrap around screen
          if (asteroid.position.x > 15) asteroid.position.x = -15;
          if (asteroid.position.x < -15) asteroid.position.x = 15;
          if (asteroid.position.z > 15) asteroid.position.z = -15;
          if (asteroid.position.z < -15) asteroid.position.z = 15;
          
          return asteroid;
        })
      );
      
      // Update explosions
      setExplosions(prev => prev.filter(explosion => explosion.active));
      
      checkCollisions();
      
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, keys, ship]);

  const checkCollisions = useCallback(() => {
    // Bullet-asteroid collisions
    bullets.forEach(bullet => {
      asteroids.forEach(asteroid => {
        if (asteroid.destroyed || !bullet.active) return;
        
        try {
          const distance = bullet.position.distanceTo(asteroid.position);
          if (distance < asteroid.size) {
            // Destroy bullet
            bullet.active = false;
            
            // Damage asteroid
            asteroid.health--;
            
            if (asteroid.health <= 0) {
              asteroid.destroyed = true;
              
              // Add explosion
              setExplosions(prev => [...prev, {
                id: Date.now(),
                position: asteroid.position.clone(),
                size: asteroid.size,
                color: "#FF6B35",
                active: true
              }]);
              
              // Split asteroid if large enough
              if (asteroid.size > 0.8) {
                const newAsteroids = Array.from({ length: 2 }, (_, i) => ({
                  id: Date.now() + i,
                  position: asteroid.position.clone().add(
                    new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)
                  ),
                  velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    0,
                    (Math.random() - 0.5) * 0.3
                  ),
                  size: asteroid.size * 0.6,
                  health: 1,
                  rotationSpeed: Math.random() * 2 + 1,
                  destroyed: false
                }));
                setAsteroids(prev => [...prev, ...newAsteroids]);
              }
              
              // Score
              const points = Math.floor((2 - asteroid.size) * 100 + 50);
              setScore(prev => {
                const newScore = prev + points;
                onScoreChange?.(newScore);
                return newScore;
              });
              
              toast.success(`Asteroid destroyed! +${points} points`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Collision detection failed:', error);
        }
      });
    });
    
    // Ship-asteroid collisions
    if (ship.invulnerable === 0) {
      asteroids.forEach(asteroid => {
        if (asteroid.destroyed) return;
        
        try {
          const distance = ship.position.distanceTo(asteroid.position);
          if (distance < asteroid.size + 0.5) {
            setLives(prev => prev - 1);
            setShip(prev => ({ ...prev, invulnerable: 120 }));
            toast.error("Ship hit! Lives: " + (lives - 1));
          }
        } catch (error) {
          console.warn('⚠️ Ship collision detection failed:', error);
        }
      });
    }
  }, [bullets, asteroids, ship, lives, onScoreChange]);

  // Game over and level progression
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over! Final Score: " + score);
    }
    
    // Check if all asteroids destroyed
    if (asteroids.length > 0 && asteroids.every(asteroid => asteroid.destroyed)) {
      setLevel(prev => prev + 1);
      toast.success("Level Complete! Next wave incoming...");
      
      // Generate new asteroids for next level
      setTimeout(() => {
        const newAsteroids = Array.from({ length: 4 + level * 2 }, (_, i) => ({
          id: Date.now() + i,
          position: safeVector3(
            (Math.random() - 0.5) * 25,
            1,
            (Math.random() - 0.5) * 25
          ),
          velocity: safeVector3(
            (Math.random() - 0.5) * (0.1 + level * 0.05),
            0,
            (Math.random() - 0.5) * (0.1 + level * 0.05)
          ),
          size: 1 + Math.random() * 0.5,
          health: Math.min(3, 1 + Math.floor(level / 3)),
          rotationSpeed: Math.random() * 2 + 1,
          destroyed: false
        }));
        setAsteroids(newAsteroids);
      }, 2000);
    }
  }, [lives, asteroids, level, score, onGameEnd]);

  const startGame = async () => {
    if (onGameStart && !(await onGameStart())) return;
    if (!handleGameStart('asteroids')) return;
    
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setShip({
      position: safeVector3(0, 1, 0),
      velocity: safeVector3(0, 0, 0),
      rotation: 0,
      thrust: false,
      invulnerable: 120
    });
    setBullets([]);
    setExplosions([]);
    
    // Initial asteroids
    setAsteroids(Array.from({ length: 6 }, (_, i) => ({
      id: i,
      position: safeVector3(
        (Math.random() - 0.5) * 20,
        1,
        (Math.random() - 0.5) * 20
      ),
      velocity: safeVector3(
        (Math.random() - 0.5) * 0.2,
        0,
        (Math.random() - 0.5) * 0.2
      ),
      size: 1 + Math.random() * 0.5,
      health: 1,
      rotationSpeed: Math.random() * 2 + 1,
      destroyed: false
    })));
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Asteroids</h2>
          <div className="text-lg font-bold text-arcade-gold">
            Score: {score} | Lives: {lives} | Level: {level}
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={startGame} variant="arcade" disabled={isPlaying && !gameOver}>
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
          {isPlaying && !gameOver && (
            <Button onClick={pauseGame} variant="secondary">
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>

        <Game3DEngine 
          gameId="asteroids-3d" 
          camera={{ position: [0, 20, 12], fov: 70 }} 
          lighting="retro"
          environment="space"
          enableOrbitControls={true}
        >
          {/* Star field background */}
          <StarField3D count={300} />
          
          {/* Game floor */}
          <GameFloor3D size={40} color="#0a0a2e" pattern="grid" />
          
          {/* Ship */}
          <EnhancedSpaceship3D 
            position={ship.position.toArray() as [number, number, number]}
            rotation={ship.rotation}
            thrust={ship.thrust}
          />
          
          {/* Asteroids */}
          {asteroids.map(asteroid => !asteroid.destroyed && (
            <EnhancedAsteroid3D
              key={asteroid.id}
              position={asteroid.position.toArray() as [number, number, number]}
              size={asteroid.size}
              rotationSpeed={asteroid.rotationSpeed}
              destroyed={asteroid.destroyed}
            />
          ))}
          
          {/* Bullets */}
          {bullets.map(bullet => bullet.active && (
            <EnhancedBullet3D
              key={bullet.id}
              position={bullet.position.toArray() as [number, number, number]}
              direction={bullet.velocity.toArray() as [number, number, number]}
            />
          ))}
          
          {/* Explosions */}
          {explosions.map(explosion => explosion.active && (
            <ExplosionEffect3D
              key={explosion.id}
              position={explosion.position.toArray() as [number, number, number]}
              size={explosion.size}
              color={explosion.color}
            />
          ))}
          
          {/* Particle effects for ship thrust */}
          {ship.thrust && (
            <ParticleSystem3D 
              position={[
                ship.position.x - Math.sin(ship.rotation) * 1.5,
                ship.position.y,
                ship.position.z - Math.cos(ship.rotation) * 1.5
              ]}
              count={10}
              color="#FF6B35"
            />
          )}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          A/D to rotate • W for thrust • Space to shoot • Destroy all asteroids!
        </div>
      </Card>
    </div>
  );
};