import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import { 
  EnhancedPinballTable3D,
  EnhancedPinball3D,
  EnhancedFlipper3D,
  EnhancedBumper3D,
  EnhancedPlunger3D,
  ScoreDisplay3D
} from "./engine/EnhancedFlipper3DComponents";
import * as THREE from "three";

interface Flipper3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

interface Ball3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  onTable: boolean;
}

interface Bumper3D {
  id: number;
  position: THREE.Vector3;
  hit: boolean;
  hitTime: number;
}

interface Flipper3D {
  position: THREE.Vector3;
  rotation: number;
  active: boolean;
  side: 'left' | 'right';
}

export const Flipper3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Flipper3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(3);
  const [currentBall, setCurrentBall] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [plungerPower, setPlungerPower] = useState(0);
  
  const { handleGameStart } = useGameManager();
  
  // Game objects
  const [ball, setBall] = useState<Ball3D>({
    position: new THREE.Vector3(7, 2, -8),
    velocity: new THREE.Vector3(0, 0, 0),
    onTable: false
  });

  const [leftFlipper, setLeftFlipper] = useState<Flipper3D>({
    position: new THREE.Vector3(-2, 0.5, -8),
    rotation: -0.3,
    active: false,
    side: 'left'
  });

  const [rightFlipper, setRightFlipper] = useState<Flipper3D>({
    position: new THREE.Vector3(2, 0.5, -8),
    rotation: 0.3,
    active: false,
    side: 'right'
  });

  const [bumpers, setBumpers] = useState<Bumper3D[]>([
    { id: 1, position: new THREE.Vector3(-3, 1, 3), hit: false, hitTime: 0 },
    { id: 2, position: new THREE.Vector3(3, 1, 3), hit: false, hitTime: 0 },
    { id: 3, position: new THREE.Vector3(0, 1, 6), hit: false, hitTime: 0 },
    { id: 4, position: new THREE.Vector3(-2, 1, 0), hit: false, hitTime: 0 },
    { id: 5, position: new THREE.Vector3(2, 1, 0), hit: false, hitTime: 0 }
  ]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
      
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        setLeftFlipper(prev => ({ ...prev, active: true, rotation: 0.3 }));
      }
      if (e.key === 'd' || e.key === 'ArrowRight') {
        setRightFlipper(prev => ({ ...prev, active: true, rotation: -0.3 }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
      
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        setLeftFlipper(prev => ({ ...prev, active: false, rotation: -0.3 }));
      }
      if (e.key === 'd' || e.key === 'ArrowRight') {
        setRightFlipper(prev => ({ ...prev, active: false, rotation: 0.3 }));
      }
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
      // Handle plunger
      if (keys[' '] && !ball.onTable) {
        setPlungerPower(prev => Math.min(prev + 0.02, 1));
      } else if (plungerPower > 0 && !ball.onTable) {
        setBall(prev => ({
          ...prev,
          velocity: new THREE.Vector3(-plungerPower * 0.8, 0, plungerPower * 1.2),
          onTable: true
        }));
        setPlungerPower(0);
      }
      
      // Update ball physics
      setBall(prevBall => {
        if (!prevBall.onTable) return prevBall;
        
        const newBall = { ...prevBall };
        
        // Apply gravity
        newBall.velocity.y -= 0.02;
        
        // Apply damping
        newBall.velocity.multiplyScalar(0.995);
        
        // Update position
        newBall.position.add(newBall.velocity);
        
        // Table boundaries
        if (newBall.position.x < -7.5 || newBall.position.x > 7.5) {
          newBall.velocity.x *= -0.8;
          newBall.position.x = Math.max(-7.5, Math.min(7.5, newBall.position.x));
        }
        
        if (newBall.position.z > 11.5) {
          newBall.velocity.z *= -0.8;
          newBall.position.z = 11.5;
        }
        
        // Floor collision
        if (newBall.position.y < 0.5) {
          newBall.position.y = 0.5;
          newBall.velocity.y = Math.abs(newBall.velocity.y) * 0.7;
        }
        
        // Ball lost (drain)
        if (newBall.position.z < -12) {
          if (currentBall >= balls) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd?.();
            toast.error("Game Over! Final Score: " + score);
          } else {
            setCurrentBall(prev => prev + 1);
            newBall.position.set(7, 2, -8);
            newBall.velocity.set(0, 0, 0);
            newBall.onTable = false;
            toast.info(`Ball ${currentBall + 1} in play`);
          }
        }
        
        return newBall;
      });
      
      // Update bumpers
      setBumpers(prevBumpers => 
        prevBumpers.map(bumper => {
          if (bumper.hit && Date.now() - bumper.hitTime > 500) {
            return { ...bumper, hit: false };
          }
          return bumper;
        })
      );
      
      checkCollisions();
      
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, keys, ball, currentBall, balls, plungerPower, score]);

  const checkCollisions = useCallback(() => {
    // Flipper collisions
    [leftFlipper, rightFlipper].forEach(flipper => {
      if (flipper.active) {
        const distance = ball.position.distanceTo(flipper.position);
        if (distance < 1.5) {
          const direction = new THREE.Vector3()
            .subVectors(ball.position, flipper.position)
            .normalize();
          
          setBall(prev => ({
            ...prev,
            velocity: direction.multiplyScalar(0.8)
          }));
        }
      }
    });
    
    // Bumper collisions
    setBumpers(prevBumpers => 
      prevBumpers.map(bumper => {
        const distance = ball.position.distanceTo(bumper.position);
        if (distance < 1 && !bumper.hit) {
          // Ball hits bumper
          const direction = new THREE.Vector3()
            .subVectors(ball.position, bumper.position)
            .normalize();
          
          setBall(prev => ({
            ...prev,
            velocity: direction.multiplyScalar(0.6)
          }));
          
          // Score points
          const points = 100 * multiplier;
          setScore(prev => {
            const newScore = prev + points;
            onScoreChange?.(newScore);
            return newScore;
          });
          
          toast.success(`Bumper hit! +${points} points`);
          
          return { ...bumper, hit: true, hitTime: Date.now() };
        }
        return bumper;
      })
    );
  }, [ball, leftFlipper, rightFlipper, multiplier, onScoreChange]);

  const resetBall = () => {
    setBall({
      position: new THREE.Vector3(7, 2, -8),
      velocity: new THREE.Vector3(0, 0, 0),
      onTable: false
    });
    setPlungerPower(0);
  };

  const startGame = async () => {
    if (onGameStart && !(await onGameStart())) return;
    if (!handleGameStart('flipper')) return;
    
    setScore(0);
    setBalls(3);
    setCurrentBall(1);
    setMultiplier(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    resetBall();
    setBumpers(prev => prev.map(b => ({ ...b, hit: false, hitTime: 0 })));
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Pinball</h2>
          <div className="text-lg font-bold text-arcade-gold">
            Score: {score} | Ball: {currentBall}/{balls} | Multiplier: x{multiplier}
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
          gameId="flipper-3d" 
          camera={{ position: [0, 15, -5], fov: 60 }} 
          lighting="retro"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Game floor */}
          <GameFloor3D size={30} color="#1a1a2e" pattern="dots" />
          
          {/* Pinball table */}
          <EnhancedPinballTable3D />
          
          {/* Ball */}
          <EnhancedPinball3D 
            position={ball.position.toArray() as [number, number, number]}
            velocity={ball.velocity.toArray() as [number, number, number]}
          />
          
          {/* Flippers */}
          <EnhancedFlipper3D 
            position={leftFlipper.position.toArray() as [number, number, number]}
            rotation={leftFlipper.rotation}
            side="left"
            active={leftFlipper.active}
          />
          <EnhancedFlipper3D 
            position={rightFlipper.position.toArray() as [number, number, number]}
            rotation={rightFlipper.rotation}
            side="right"
            active={rightFlipper.active}
          />
          
          {/* Bumpers */}
          {bumpers.map(bumper => (
            <EnhancedBumper3D
              key={bumper.id}
              position={bumper.position.toArray() as [number, number, number]}
              hit={bumper.hit}
            />
          ))}
          
          {/* Plunger */}
          <EnhancedPlunger3D 
            position={[7, 1, -10]}
            power={plungerPower}
          />
          
          {/* Particle effects for ball trail */}
          {ball.onTable && ball.velocity.length() > 0.3 && (
            <ParticleSystem3D 
              position={ball.position.toArray()}
              count={5}
              color="#FFD700"
              spread={0.5}
            />
          )}
          
          {/* Bumper hit effects */}
          {bumpers.map(bumper => bumper.hit && (
            <ParticleSystem3D 
              key={`effect-${bumper.id}`}
              position={bumper.position.toArray()}
              count={15}
              color="#00ff41"
              spread={1}
            />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          A/D or Arrow Keys for flippers • Space to charge plunger • Hit bumpers for points!
        </div>
      </Card>
    </div>
  );
};