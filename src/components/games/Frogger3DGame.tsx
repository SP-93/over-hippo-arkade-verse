import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { Player3D, Platform3D, GameFloor3D } from "./engine/Game3DComponents";
import { Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface Frogger3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

interface Frog3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  onLog: boolean;
  currentLog?: number;
}

interface Car3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: THREE.Vector3;
  color: string;
  lane: number;
}

interface Log3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: THREE.Vector3;
  lane: number;
}

// 3D Car Component
const Car3D = ({ car }: { car: Car3D }) => {
  const carRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (carRef.current) {
      carRef.current.position.copy(car.position);
    }
  });

  return (
    <group ref={carRef}>
      {/* Car body */}
      <Box args={car.size.toArray()} castShadow receiveShadow>
        <meshStandardMaterial color={car.color} metalness={0.3} roughness={0.2} />
      </Box>
      
      {/* Car windows */}
      <Box 
        args={[car.size.x * 0.8, car.size.y * 0.4, car.size.z * 0.9]} 
        position={[0, car.size.y * 0.3, 0]}
        castShadow
      >
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </Box>
      
      {/* Headlights */}
      <Cylinder 
        args={[0.1, 0.1, 0.2, 8]} 
        position={[car.size.x * 0.4, 0, car.size.z * 0.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.3} />
      </Cylinder>
      <Cylinder 
        args={[0.1, 0.1, 0.2, 8]} 
        position={[car.size.x * 0.4, 0, -car.size.z * 0.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.3} />
      </Cylinder>
      
      {/* Wheels */}
      {[-1, 1].map((xSign, i) => 
        [-1, 1].map((zSign, j) => (
          <Cylinder
            key={`${i}-${j}`}
            args={[0.3, 0.3, 0.2, 12]}
            position={[xSign * car.size.x * 0.35, -car.size.y * 0.4, zSign * car.size.z * 0.35]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <meshStandardMaterial color="#2F4F4F" />
          </Cylinder>
        ))
      )}
    </group>
  );
};

// 3D Log Component
const Log3D = ({ log }: { log: Log3D }) => {
  const logRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (logRef.current) {
      logRef.current.position.copy(log.position);
      logRef.current.rotation.z = Math.sin(state.clock.elapsedTime + log.id) * 0.1;
    }
  });

  return (
    <group ref={logRef}>
      {/* Log body */}
      <Cylinder 
        args={[log.size.y / 2, log.size.y / 2, log.size.x, 16]} 
        rotation={[0, 0, Math.PI / 2]}
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </Cylinder>
      
      {/* Log ends */}
      <Cylinder 
        args={[log.size.y / 2 + 0.1, log.size.y / 2 + 0.1, 0.2, 16]} 
        position={[log.size.x / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      <Cylinder 
        args={[log.size.y / 2 + 0.1, log.size.y / 2 + 0.1, 0.2, 16]} 
        position={[-log.size.x / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color="#654321" />
      </Cylinder>
      
      {/* Log texture lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          args={[log.size.x, 0.05, 0.05]}
          position={[0, Math.cos(i * Math.PI / 4) * log.size.y / 2, Math.sin(i * Math.PI / 4) * log.size.y / 2]}
          castShadow
        >
          <meshStandardMaterial color="#A0522D" />
        </Box>
      ))}
    </group>
  );
};

// 3D Frog Component
const Frog3D = ({ frog }: { frog: Frog3D }) => {
  const frogRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (frogRef.current) {
      frogRef.current.position.copy(frog.position);
      const bounce = Math.sin(state.clock.elapsedTime * 8) * 0.1;
      frogRef.current.position.y = frog.position.y + bounce;
    }
  });

  return (
    <group ref={frogRef}>
      {/* Frog body */}
      <Box args={[0.8, 0.4, 0.8]} castShadow receiveShadow>
        <meshStandardMaterial color="#32CD32" metalness={0.1} roughness={0.8} />
      </Box>
      
      {/* Frog head */}
      <Box args={[0.6, 0.3, 0.6]} position={[0, 0.25, 0]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Box>
      
      {/* Eyes */}
      <Box args={[0.15, 0.2, 0.15]} position={[-0.2, 0.4, 0.2]} castShadow>
        <meshStandardMaterial color="#FFFF00" emissive="#444400" />
      </Box>
      <Box args={[0.15, 0.2, 0.15]} position={[0.2, 0.4, 0.2]} castShadow>
        <meshStandardMaterial color="#FFFF00" emissive="#444400" />
      </Box>
      
      {/* Front legs */}
      <Box args={[0.2, 0.15, 0.2]} position={[-0.4, -0.1, 0.3]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Box>
      <Box args={[0.2, 0.15, 0.2]} position={[0.4, -0.1, 0.3]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Box>
      
      {/* Back legs */}
      <Box args={[0.3, 0.2, 0.4]} position={[-0.4, -0.1, -0.3]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Box>
      <Box args={[0.3, 0.2, 0.4]} position={[0.4, -0.1, -0.3]} castShadow>
        <meshStandardMaterial color="#228B22" />
      </Box>
    </group>
  );
};

export const Frogger3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Frogger3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const { handleGameStart } = useGameManager();
  
  // Game objects
  const [frog, setFrog] = useState<Frog3D>({
    position: new THREE.Vector3(0, 0.5, -20),
    velocity: new THREE.Vector3(0, 0, 0),
    onLog: false,
    currentLog: undefined
  });

  const [cars, setCars] = useState<Car3D[]>([
    // Lane 1 (bottom road)
    { id: 1, position: new THREE.Vector3(-25, 0.5, -15), velocity: new THREE.Vector3(0.3, 0, 0), size: new THREE.Vector3(3, 1, 1.5), color: "#ff4444", lane: 1 },
    { id: 2, position: new THREE.Vector3(-15, 0.5, -15), velocity: new THREE.Vector3(0.3, 0, 0), size: new THREE.Vector3(2.5, 1, 1.5), color: "#4444ff", lane: 1 },
    
    // Lane 2
    { id: 3, position: new THREE.Vector3(25, 0.5, -10), velocity: new THREE.Vector3(-0.4, 0, 0), size: new THREE.Vector3(3.5, 1.2, 1.8), color: "#44ff44", lane: 2 },
    { id: 4, position: new THREE.Vector3(15, 0.5, -10), velocity: new THREE.Vector3(-0.4, 0, 0), size: new THREE.Vector3(3, 1, 1.5), color: "#ffff44", lane: 2 },
    
    // Lane 3
    { id: 5, position: new THREE.Vector3(-30, 0.5, -5), velocity: new THREE.Vector3(0.35, 0, 0), size: new THREE.Vector3(4, 1.5, 2), color: "#ff44ff", lane: 3 },
    { id: 6, position: new THREE.Vector3(-10, 0.5, -5), velocity: new THREE.Vector3(0.35, 0, 0), size: new THREE.Vector3(2.8, 1, 1.6), color: "#44ffff", lane: 3 },
    
    // Lane 4 (top road)
    { id: 7, position: new THREE.Vector3(30, 0.5, 0), velocity: new THREE.Vector3(-0.25, 0, 0), size: new THREE.Vector3(3.2, 1.1, 1.7), color: "#ff8844", lane: 4 },
    { id: 8, position: new THREE.Vector3(10, 0.5, 0), velocity: new THREE.Vector3(-0.25, 0, 0), size: new THREE.Vector3(3.8, 1.3, 1.9), color: "#8844ff", lane: 4 },
  ]);

  const [logs, setLogs] = useState<Log3D[]>([
    // Water lane 1
    { id: 1, position: new THREE.Vector3(-20, 0.3, 10), velocity: new THREE.Vector3(0.2, 0, 0), size: new THREE.Vector3(6, 0.8, 1.5), lane: 1 },
    { id: 2, position: new THREE.Vector3(10, 0.3, 10), velocity: new THREE.Vector3(0.2, 0, 0), size: new THREE.Vector3(5, 0.8, 1.5), lane: 1 },
    
    // Water lane 2
    { id: 3, position: new THREE.Vector3(25, 0.3, 15), velocity: new THREE.Vector3(-0.15, 0, 0), size: new THREE.Vector3(8, 1, 1.8), lane: 2 },
    { id: 4, position: new THREE.Vector3(-5, 0.3, 15), velocity: new THREE.Vector3(-0.15, 0, 0), size: new THREE.Vector3(7, 1, 1.8), lane: 2 },
    
    // Water lane 3
    { id: 5, position: new THREE.Vector3(-25, 0.3, 20), velocity: new THREE.Vector3(0.25, 0, 0), size: new THREE.Vector3(4, 0.6, 1.2), lane: 3 },
    { id: 6, position: new THREE.Vector3(15, 0.3, 20), velocity: new THREE.Vector3(0.25, 0, 0), size: new THREE.Vector3(5.5, 0.6, 1.2), lane: 3 },
  ]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      setKeys(prev => ({ ...prev, [e.key]: true }));
      
      // Grid-based movement for classic Frogger feel
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setFrog(prev => ({
            ...prev,
            position: new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z + 5),
            onLog: false,
            currentLog: undefined
          }));
          break;
        case 'ArrowDown':
        case 's':
          setFrog(prev => ({
            ...prev,
            position: new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z - 5),
            onLog: false,
            currentLog: undefined
          }));
          break;
        case 'ArrowLeft':
        case 'a':
          setFrog(prev => ({
            ...prev,
            position: new THREE.Vector3(prev.position.x - 3, prev.position.y, prev.position.z),
            onLog: false,
            currentLog: undefined
          }));
          break;
        case 'ArrowRight':
        case 'd':
          setFrog(prev => ({
            ...prev,
            position: new THREE.Vector3(prev.position.x + 3, prev.position.y, prev.position.z),
            onLog: false,
            currentLog: undefined
          }));
          break;
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
  }, [isPlaying, isPaused, gameOver]);

  // Game physics
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const gameLoop = setInterval(() => {
      // Update cars
      setCars(prevCars => 
        prevCars.map(car => {
          car.position.add(car.velocity);
          
          // Wrap around screen
          if (car.velocity.x > 0 && car.position.x > 35) {
            car.position.x = -35;
          } else if (car.velocity.x < 0 && car.position.x < -35) {
            car.position.x = 35;
          }
          
          return car;
        })
      );
      
      // Update logs
      setLogs(prevLogs => 
        prevLogs.map(log => {
          log.position.add(log.velocity);
          
          // Wrap around screen
          if (log.velocity.x > 0 && log.position.x > 35) {
            log.position.x = -35;
          } else if (log.velocity.x < 0 && log.position.x < -35) {
            log.position.x = 35;
          }
          
          return log;
        })
      );
      
      // Check frog position and update accordingly
      setFrog(prevFrog => {
        let newFrog = { ...prevFrog };
        
        // Check if frog is in water area
        if (newFrog.position.z > 5 && newFrog.position.z < 25) {
          // Check if frog is on a log
          let onAnyLog = false;
          logs.forEach((log, index) => {
            const distance = new THREE.Vector3().subVectors(newFrog.position, log.position);
            if (Math.abs(distance.x) < log.size.x / 2 && 
                Math.abs(distance.z) < log.size.z / 2 &&
                Math.abs(distance.y) < 1) {
              onAnyLog = true;
              newFrog.onLog = true;
              newFrog.currentLog = index;
              // Move frog with log
              newFrog.position.add(log.velocity);
            }
          });
          
          if (!onAnyLog) {
            // Frog is in water without log - death
            setLives(prev => prev - 1);
            newFrog.position.set(0, 0.5, -20);
            newFrog.onLog = false;
            newFrog.currentLog = undefined;
            toast.error("Frog drowned! Lives: " + (lives - 1));
          }
        } else {
          newFrog.onLog = false;
          newFrog.currentLog = undefined;
        }
        
        // Check scoring zones
        if (newFrog.position.z > 25) {
          setScore(prev => {
            const newScore = prev + 100;
            onScoreChange?.(newScore);
            return newScore;
          });
          newFrog.position.set(0, 0.5, -20);
          toast.success("Frog reached safety! +100 points!");
        }
        
        // Boundary check
        newFrog.position.x = Math.max(-25, Math.min(25, newFrog.position.x));
        newFrog.position.z = Math.max(-25, Math.min(30, newFrog.position.z));
        
        return newFrog;
      });
      
      checkCollisions();
      
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isPaused, gameOver, cars, logs, lives]);

  const checkCollisions = useCallback(() => {
    // Car collisions
    cars.forEach(car => {
      const distance = new THREE.Vector3().subVectors(frog.position, car.position);
      if (Math.abs(distance.x) < car.size.x / 2 + 0.5 && 
          Math.abs(distance.z) < car.size.z / 2 + 0.5 &&
          Math.abs(distance.y) < 1) {
        setLives(prev => prev - 1);
        setFrog(prev => ({
          ...prev,
          position: new THREE.Vector3(0, 0.5, -20),
          onLog: false,
          currentLog: undefined
        }));
        toast.error("Frog hit by car! Lives: " + (lives - 1));
      }
    });
  }, [frog, cars, lives]);

  // Game over check
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over! Final Score: " + score);
    }
  }, [lives, score, onGameEnd]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('frogger')) return;
    
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setFrog({
      position: new THREE.Vector3(0, 0.5, -20),
      velocity: new THREE.Vector3(0, 0, 0),
      onLog: false,
      currentLog: undefined
    });
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Frogger</h2>
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
          gameId="frogger-3d"
          camera={{ position: [0, 25, -10], fov: 60 }}
          lighting="arcade"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Road sections */}
          <Box args={[60, 0.1, 20]} position={[0, 0, -10]} receiveShadow>
            <meshStandardMaterial color="#2F2F2F" />
          </Box>
          
          {/* Water sections */}
          <Box args={[60, 0.1, 20]} position={[0, 0, 15]} receiveShadow>
            <meshStandardMaterial color="#4169E1" transparent opacity={0.8} />
          </Box>
          
          {/* Safe zones */}
          <Box args={[60, 0.1, 5]} position={[0, 0, -22.5]} receiveShadow>
            <meshStandardMaterial color="#228B22" />
          </Box>
          <Box args={[60, 0.1, 5]} position={[0, 0, 27.5]} receiveShadow>
            <meshStandardMaterial color="#228B22" />
          </Box>
          
          {/* Middle safe zone */}
          <Box args={[60, 0.1, 5]} position={[0, 0, 2.5]} receiveShadow>
            <meshStandardMaterial color="#32CD32" />
          </Box>
          
          {/* Frog */}
          <Frog3D frog={frog} />
          
          {/* Cars */}
          {cars.map(car => (
            <Car3D key={car.id} car={car} />
          ))}
          
          {/* Logs */}
          {logs.map(log => (
            <Log3D key={log.id} log={log} />
          ))}
          
          {/* Lane markers */}
          {Array.from({ length: 20 }, (_, i) => (
            <Box 
              key={i}
              args={[0.2, 0.2, 2]} 
              position={[-25 + i * 2.5, 0.1, -10]}
            >
              <meshStandardMaterial color="#FFFF00" />
            </Box>
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD/Arrow Keys to hop • Stay on logs in water • Reach the top safely!
        </div>
      </Card>
    </div>
  );
};