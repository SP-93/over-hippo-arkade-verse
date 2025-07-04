import { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import * as THREE from "three";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BOARD_DEPTH = 1;

interface Tetris3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

// Tetris pieces
const PIECES = {
  I: { blocks: [[0,0,0],[1,0,0],[2,0,0],[3,0,0]], color: "#00ffff" },
  O: { blocks: [[0,0,0],[1,0,0],[0,1,0],[1,1,0]], color: "#ffff00" },
  T: { blocks: [[1,0,0],[0,1,0],[1,1,0],[2,1,0]], color: "#800080" },
  S: { blocks: [[1,0,0],[2,0,0],[0,1,0],[1,1,0]], color: "#00ff00" },
  Z: { blocks: [[0,0,0],[1,0,0],[1,1,0],[2,1,0]], color: "#ff0000" },
  J: { blocks: [[0,0,0],[0,1,0],[1,1,0],[2,1,0]], color: "#0000ff" },
  L: { blocks: [[2,0,0],[0,1,0],[1,1,0],[2,1,0]], color: "#ffa500" }
};

interface BlockProps {
  position: [number, number, number];
  color: string;
  isActive?: boolean;
}

const Block = ({ position, color, isActive }: BlockProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.9, 0.9, 0.9]}
    >
      <meshStandardMaterial 
        color={color}
        metalness={0.4}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={isActive ? 0.2 : 0.1}
      />
    </Box>
  );
};

const GameBoard = () => {
  return (
    <group>
      {/* Board outline */}
      <lineSegments position={[BOARD_WIDTH/2 - 0.5, BOARD_HEIGHT/2 - 0.5, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(BOARD_WIDTH, BOARD_HEIGHT, BOARD_DEPTH)]} />
        <lineBasicMaterial color="#666666" linewidth={2} />
      </lineSegments>
      
      {/* Grid lines */}
      {Array.from({ length: BOARD_WIDTH + 1 }, (_, i) => (
        <line key={`v-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                i, 0, 0,
                i, BOARD_HEIGHT, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#333333" />
        </line>
      ))}
      
      {Array.from({ length: BOARD_HEIGHT + 1 }, (_, i) => (
        <line key={`h-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                0, i, 0,
                BOARD_WIDTH, i, 0
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#333333" />
        </line>
      ))}
    </group>
  );
};

export const Tetris3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Tetris3DGameProps = {}) => {
  const [board, setBoard] = useState<(string | null)[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 4, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [dropTime, setDropTime] = useState(500);
  
  const { handleGameStart } = useGameManager();

  const getRandomPiece = useCallback(() => {
    const pieceKeys = Object.keys(PIECES) as Array<keyof typeof PIECES>;
    const randomKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    return PIECES[randomKey];
  }, []);

  const checkCollision = useCallback((piece: any, position: { x: number; y: number }) => {
    return piece.blocks.some(([x, y]: [number, number]) => {
      const newX = position.x + x;
      const newY = position.y + y;
      
      return (
        newX < 0 || 
        newX >= BOARD_WIDTH || 
        newY >= BOARD_HEIGHT ||
        (newY >= 0 && board[newY][newX] !== null)
      );
    });
  }, [board]);

  const placePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    
    currentPiece.blocks.forEach(([x, y]: [number, number]) => {
      const newX = currentPosition.x + x;
      const newY = currentPosition.y + y;
      
      if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
        newBoard[newY][newX] = currentPiece.color;
      }
    });
    
    setBoard(newBoard);
    
    // Check for completed lines
    const completedLines: number[] = [];
    newBoard.forEach((row, index) => {
      if (row.every(cell => cell !== null)) {
        completedLines.push(index);
      }
    });
    
    if (completedLines.length > 0) {
      // Remove completed lines
      const filteredBoard = newBoard.filter((_, index) => !completedLines.includes(index));
      const newEmptyLines = Array(completedLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
      setBoard([...newEmptyLines, ...filteredBoard]);
      
      const newLines = lines + completedLines.length;
      setLines(newLines);
      const newScore = score + completedLines.length * 100 * level;
      setScore(newScore);
      onScoreChange?.(newScore);
      setLevel(Math.floor(newLines / 10) + 1);
      setDropTime(Math.max(50, 500 - (level * 50)));
      
      toast.success(`${completedLines.length} line${completedLines.length > 1 ? 's' : ''} cleared!`);
    }
    
    // Spawn new piece
    const newPiece = getRandomPiece();
    const newPosition = { x: 4, y: 0 };
    
    if (checkCollision(newPiece, newPosition)) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd?.();
      toast.error("Game Over!");
    } else {
      setCurrentPiece(newPiece);
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, board, lines, level, getRandomPiece, checkCollision]);

  const movePiece = useCallback((direction: { x: number; y: number }) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPosition = {
      x: currentPosition.x + direction.x,
      y: currentPosition.y + direction.y
    };
    
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    } else if (direction.y > 0) {
      // Piece hit bottom
      placePiece();
    }
  }, [currentPiece, currentPosition, gameOver, isPaused, checkCollision, placePiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotatedBlocks = currentPiece.blocks.map(([x, y]: [number, number]) => [-y, x]);
    const rotatedPiece = { ...currentPiece, blocks: rotatedBlocks };
    
    if (!checkCollision(rotatedPiece, currentPosition)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, currentPosition, gameOver, isPaused, checkCollision]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        movePiece({ x: 0, y: 1 });
      }, dropTime);
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
  }, [isPlaying, isPaused, gameOver, dropTime, movePiece]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          movePiece({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          movePiece({ x: 1, y: 0 });
          break;
        case 'ArrowDown':
        case 's':
          movePiece({ x: 0, y: 1 });
          break;
        case 'ArrowUp':
        case 'w':
          rotatePiece();
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, isPaused, movePiece, rotatePiece]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('tetris')) return;
    
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(getRandomPiece());
    setCurrentPosition({ x: 4, y: 0 });
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(500);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-blue">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-blue">3D Tetris</h2>
          <div className="flex gap-4 text-sm">
            <div className="text-arcade-gold">Score: {score}</div>
            <div className="text-neon-green">Level: {level}</div>
            <div className="text-neon-pink">Lines: {lines}</div>
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

        <div className="h-[600px] bg-black rounded-lg overflow-hidden">
          <Canvas camera={{ position: [8, 15, 12], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <pointLight position={[5, 10, 2]} intensity={0.6} color="#4444ff" />
            
            <GameBoard />
            
            {/* Placed blocks */}
            {board.map((row, y) =>
              row.map((cell, x) =>
                cell ? (
                  <Block
                    key={`${x}-${y}`}
                    position={[x, BOARD_HEIGHT - 1 - y, 0]}
                    color={cell}
                  />
                ) : null
              )
            )}
            
            {/* Current piece */}
            {currentPiece && currentPiece.blocks.map(([x, y]: [number, number], index: number) => (
              <Block
                key={index}
                position={[
                  currentPosition.x + x,
                  BOARD_HEIGHT - 1 - (currentPosition.y + y),
                  0
                ]}
                color={currentPiece.color}
                isActive={true}
              />
            ))}
            
            <OrbitControls enablePan={false} enableZoom={true} />
          </Canvas>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • W/↑ to rotate • Space to pause • Mouse to rotate camera
        </div>
      </Card>
    </div>
  );
};