import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Sphere, Cylinder } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import * as THREE from "three";

const GRID_SIZE = 21;
const CELL_SIZE = 1;

interface PacMan3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

// Maze layout (1 = wall, 2 = dot, 3 = power pellet, 0 = empty)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,0,0,0,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,1,1,1,1,1,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
  [1,3,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,3,1],
  [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const PacManPlayer = ({ position, direction }: { position: [number, number, number], direction: { x: number, z: number } }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.atan2(direction.z, direction.x);
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.4, 16, 16]}>
      <meshStandardMaterial 
        color="#ffff00" 
        metalness={0.3}
        roughness={0.2}
        emissive="#444400"
      />
    </Sphere>
  );
};

const Wall = ({ position }: { position: [number, number, number] }) => (
  <Box position={position} args={[CELL_SIZE * 0.9, CELL_SIZE * 2, CELL_SIZE * 0.9]}>
    <meshStandardMaterial 
      color="#2F4F2F" 
      metalness={0.1} 
      roughness={0.8}
      emissive="#1a3d1a"
      emissiveIntensity={0.2}
    />
  </Box>
);

const Dot = ({ position }: { position: [number, number, number] }) => (
  <Sphere position={position} args={[0.08, 12, 12]}>
    <meshStandardMaterial 
      color="#FFD700" 
      emissive="#FFD700"
      emissiveIntensity={0.4}
      metalness={0.3}
      roughness={0.1}
    />
  </Sphere>
);

const PowerPellet = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.2);
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.15, 12, 12]}>
      <meshStandardMaterial 
        color="#ffff00" 
        emissive="#666600"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};

const Ghost = ({ position, color }: { position: [number, number, number], color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group>
      <Cylinder ref={meshRef} position={position} args={[0.3, 0.3, 0.6, 8]}>
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      </Cylinder>
    </group>
  );
};

export const PacMan3DGame = ({ onScoreChange, onGameEnd, onGameStart }: PacMan3DGameProps = {}) => {
  console.log("PacMan3DGame loaded - 3D version active!");
  const [pacmanPosition, setPacmanPosition] = useState({ x: 10, z: 15 });
  const [direction, setDirection] = useState({ x: 0, z: 0 });
  const [maze, setMaze] = useState(MAZE.map(row => [...row]));
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const { handleGameStart } = useGameManager();

  const ghosts = [
    { position: [9, CELL_SIZE/2, 9] as [number, number, number], color: "#ff0000" },
    { position: [10, CELL_SIZE/2, 9] as [number, number, number], color: "#ffb8ff" },
    { position: [11, CELL_SIZE/2, 9] as [number, number, number], color: "#00ffff" },
    { position: [12, CELL_SIZE/2, 9] as [number, number, number], color: "#ffb852" },
  ];

  const movePacman = useCallback(() => {
    if (!isPlaying || isPaused || gameOver || (direction.x === 0 && direction.z === 0)) return;

    setPacmanPosition(current => {
      const newX = current.x + direction.x;
      const newZ = current.z + direction.z;
      
      // Check boundaries
      if (newX < 0 || newX >= GRID_SIZE || newZ < 0 || newZ >= GRID_SIZE) {
        return current;
      }
      
      // Check walls
      if (maze[newZ][newX] === 1) {
        return current;
      }
      
      // Eat dots/pellets
      if (maze[newZ][newX] === 2 || maze[newZ][newX] === 3) {
        const points = maze[newZ][newX] === 3 ? 50 : 10;
        const newScore = score + points;
        setScore(newScore);
        onScoreChange?.(newScore);
        
        setMaze(currentMaze => {
          const newMaze = currentMaze.map(row => [...row]);
          newMaze[newZ][newX] = 0;
          return newMaze;
        });
        
        // Check win condition
        const remainingDots = maze.flat().filter(cell => cell === 2 || cell === 3).length;
        if (remainingDots <= 1) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd?.();
          toast.success("You Win! Level Complete!");
        }
      }
      
      return { x: newX, z: newZ };
    });
  }, [direction, maze, isPlaying, isPaused, gameOver, score, onScoreChange, onGameEnd]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(movePacman, 200);
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
  }, [isPlaying, isPaused, gameOver, movePacman]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setDirection({ x: 0, z: -1 });
          break;
        case 'ArrowDown':
        case 's':
          setDirection({ x: 0, z: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          setDirection({ x: -1, z: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          setDirection({ x: 1, z: 0 });
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, isPaused]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('pacman')) return;
    
    setPacmanPosition({ x: 10, z: 15 });
    setDirection({ x: 0, z: 0 });
    setMaze(MAZE.map(row => [...row]));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-arcade-gold">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-arcade-gold">3D Pac-Man</h2>
          <div className="text-lg font-bold text-neon-green">Score: {score}</div>
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
          gameId="pacman-3d"
          camera={{ position: [10, 25, 25], fov: 60 }}
          lighting="arcade"
          environment="forest"
          enableOrbitControls={true}
        >
          {/* Render maze */}
          {maze.map((row, z) =>
            row.map((cell, x) => {
              const position: [number, number, number] = [x, CELL_SIZE/2, z];
              
              if (cell === 1) {
                return <Wall key={`${x}-${z}`} position={position} />;
              } else if (cell === 2) {
                return <Dot key={`${x}-${z}`} position={[x, 0, z]} />;
              } else if (cell === 3) {
                return <PowerPellet key={`${x}-${z}`} position={[x, 0, z]} />;
              }
              return null;
            })
          )}
          
          {/* Pac-Man */}
          <PacManPlayer 
            position={[pacmanPosition.x, CELL_SIZE/2, pacmanPosition.z]} 
            direction={direction}
          />
          
          {/* Ghosts */}
          {ghosts.map((ghost, index) => (
            <Ghost 
              key={index}
              position={ghost.position}
              color={ghost.color}
            />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause • Mouse to rotate camera
        </div>
      </Card>
    </div>
  );
};