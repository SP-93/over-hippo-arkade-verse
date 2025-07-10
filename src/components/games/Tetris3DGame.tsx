import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import { Box } from "@react-three/drei";
import * as THREE from "three";

interface Tetris3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

interface Block3D {
  x: number;
  y: number;
  z: number;
  color: string;
  type: string;
  falling?: boolean;
}

interface Piece3D {
  blocks: Block3D[];
  position: THREE.Vector3;
  rotation: THREE.Euler;
  type: string;
  color: string;
}

// 3D Tetris Piece Shapes
const TETRIS_PIECES = {
  I: {
    blocks: [
      { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 
      { x: 0, y: 2, z: 0 }, { x: 0, y: 3, z: 0 }
    ],
    color: "#00FFFF"
  },
  O: {
    blocks: [
      { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }
    ],
    color: "#FFFF00"
  },
  T: {
    blocks: [
      { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }
    ],
    color: "#AA00FF"
  },
  S: {
    blocks: [
      { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }
    ],
    color: "#00FF00"
  },
  Z: {
    blocks: [
      { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }
    ],
    color: "#FF0000"
  },
  J: {
    blocks: [
      { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 }, { x: -1, y: 2, z: 0 }
    ],
    color: "#0000FF"
  },
  L: {
    blocks: [
      { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 }
    ],
    color: "#FF7F00"
  }
};

// 3D Block Component
const Block3D = ({ block, isGhost = false }: { block: Block3D, isGhost?: boolean }) => {
  const blockRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (blockRef.current && block.falling) {
      const glow = Math.sin(state.clock.elapsedTime * 8) * 0.1 + 1;
      blockRef.current.scale.setScalar(glow);
    }
  });

  return (
    <Box
      ref={blockRef}
      position={[block.x, block.y, block.z]}
      args={[0.9, 0.9, 0.9]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={block.color}
        metalness={0.3}
        roughness={0.2}
        transparent={isGhost}
        opacity={isGhost ? 0.3 : 1}
        emissive={block.color}
        emissiveIntensity={isGhost ? 0.1 : 0.2}
      />
    </Box>
  );
};

// 3D Tetris Piece Component
const TetrisPiece3D = ({ piece, isGhost = false }: { piece: Piece3D, isGhost?: boolean }) => {
  const pieceRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (pieceRef.current && !isGhost) {
      pieceRef.current.position.copy(piece.position);
      pieceRef.current.rotation.copy(piece.rotation);
    }
  });

  return (
    <group ref={pieceRef}>
      {piece.blocks.map((block, index) => (
        <Block3D key={index} block={block} isGhost={isGhost} />
      ))}
    </group>
  );
};

export const Tetris3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Tetris3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(1000);
  
  const { handleGameStart } = useGameManager();
  
  // Game state
  const [board, setBoard] = useState<(Block3D | null)[][][]>(() => 
    Array(10).fill(null).map(() => 
      Array(20).fill(null).map(() => 
        Array(10).fill(null)
      )
    )
  );
  
  const [currentPiece, setCurrentPiece] = useState<Piece3D | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece3D | null>(null);

  // Create a new piece
  const createPiece = useCallback((type?: string): Piece3D => {
    const pieceTypes = Object.keys(TETRIS_PIECES) as Array<keyof typeof TETRIS_PIECES>;
    const pieceType = type || pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    const template = TETRIS_PIECES[pieceType];
    
    return {
      blocks: template.blocks.map(block => ({
        ...block,
        color: template.color,
        type: pieceType,
        falling: true
      })),
      position: new THREE.Vector3(0, 18, 0),
      rotation: new THREE.Euler(0, 0, 0),
      type: pieceType,
      color: template.color
    };
  }, []);

  // Check collision
  const checkCollision = useCallback((piece: Piece3D, deltaPos = new THREE.Vector3(0, 0, 0)): boolean => {
    const testPos = piece.position.clone().add(deltaPos);
    
    return piece.blocks.some(block => {
      const worldX = Math.floor(testPos.x + block.x);
      const worldY = Math.floor(testPos.y + block.y);
      const worldZ = Math.floor(testPos.z + block.z);
      
      // Check boundaries
      if (worldX < -5 || worldX >= 5 || worldY < 0 || worldZ < -5 || worldZ >= 5) {
        return true;
      }
      
      // Check collision with placed blocks
      const boardX = worldX + 5;
      const boardZ = worldZ + 5;
      if (board[boardX] && board[boardX][worldY] && board[boardX][worldY][boardZ]) {
        return true;
      }
      
      return false;
    });
  }, [board]);

  // Place piece on board
  const placePiece = useCallback((piece: Piece3D) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(layer => 
        layer.map(row => [...row])
      );
      
      piece.blocks.forEach(block => {
        const worldX = Math.floor(piece.position.x + block.x) + 5;
        const worldY = Math.floor(piece.position.y + block.y);
        const worldZ = Math.floor(piece.position.z + block.z) + 5;
        
        if (worldX >= 0 && worldX < 10 && worldY >= 0 && worldY < 20 && worldZ >= 0 && worldZ < 10) {
          newBoard[worldX][worldY][worldZ] = {
            x: worldX - 5,
            y: worldY,
            z: worldZ - 5,
            color: piece.color,
            type: piece.type,
            falling: false
          };
        }
      });
      
      return newBoard;
    });
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver || !currentPiece) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          if (!checkCollision(currentPiece, new THREE.Vector3(-1, 0, 0))) {
            setCurrentPiece(prev => prev ? {
              ...prev,
              position: prev.position.clone().add(new THREE.Vector3(-1, 0, 0))
            } : null);
          }
          break;
        case 'ArrowRight':
        case 'd':
          if (!checkCollision(currentPiece, new THREE.Vector3(1, 0, 0))) {
            setCurrentPiece(prev => prev ? {
              ...prev,
              position: prev.position.clone().add(new THREE.Vector3(1, 0, 0))
            } : null);
          }
          break;
        case 'ArrowUp':
        case 'w':
          if (!checkCollision(currentPiece, new THREE.Vector3(0, 0, -1))) {
            setCurrentPiece(prev => prev ? {
              ...prev,
              position: prev.position.clone().add(new THREE.Vector3(0, 0, -1))
            } : null);
          }
          break;
        case 'ArrowDown':
        case 's':
          if (!checkCollision(currentPiece, new THREE.Vector3(0, 0, 1))) {
            setCurrentPiece(prev => prev ? {
              ...prev,
              position: prev.position.clone().add(new THREE.Vector3(0, 0, 1))
            } : null);
          }
          break;
        case ' ':
          // Hard drop
          let testPiece = { ...currentPiece };
          while (!checkCollision(testPiece, new THREE.Vector3(0, -1, 0))) {
            testPiece.position.y--;
          }
          setCurrentPiece(testPiece);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, gameOver, currentPiece, checkCollision]);

  // Game loop - piece falling
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver || !currentPiece) return;

    const dropInterval = setInterval(() => {
      if (checkCollision(currentPiece, new THREE.Vector3(0, -1, 0))) {
        // Piece can't fall further - place it
        placePiece(currentPiece);
        
        // Create new piece
        const newPiece = nextPiece || createPiece();
        setCurrentPiece(newPiece);
        setNextPiece(createPiece());
        
        // Check game over
        if (checkCollision(newPiece)) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd?.();
          toast.error("Game Over! Final Score: " + score);
        }
      } else {
        // Continue falling
        setCurrentPiece(prev => prev ? {
          ...prev,
          position: prev.position.clone().add(new THREE.Vector3(0, -1, 0))
        } : null);
      }
    }, dropSpeed);

    return () => clearInterval(dropInterval);
  }, [isPlaying, isPaused, gameOver, currentPiece, dropSpeed, checkCollision, placePiece, nextPiece, createPiece, score, onGameEnd]);

  // Initialize game
  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('tetris')) return;
    
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setDropSpeed(1000);
    
    const firstPiece = createPiece();
    const second = createPiece();
    setCurrentPiece(firstPiece);
    setNextPiece(second);
    
    setBoard(Array(10).fill(null).map(() => 
      Array(20).fill(null).map(() => 
        Array(10).fill(null)
      )
    ));
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Tetris</h2>
          <div className="text-lg font-bold text-arcade-gold">
            Score: {score} | Level: {level} | Lines: {lines}
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
          gameId="tetris-3d"
          camera={{ position: [8, 12, 12], fov: 60 }}
          lighting="retro"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Game boundaries */}
          <Box args={[0.1, 20, 20]} position={[-5.5, 10, 0]} castShadow>
            <meshStandardMaterial color="#666666" transparent opacity={0.3} />
          </Box>
          <Box args={[0.1, 20, 20]} position={[4.5, 10, 0]} castShadow>
            <meshStandardMaterial color="#666666" transparent opacity={0.3} />
          </Box>
          <Box args={[10, 0.1, 20]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#666666" />
          </Box>
          <Box args={[10, 20, 0.1]} position={[0, 10, -10.5]} castShadow>
            <meshStandardMaterial color="#666666" transparent opacity={0.3} />
          </Box>
          <Box args={[10, 20, 0.1]} position={[0, 10, 9.5]} castShadow>
            <meshStandardMaterial color="#666666" transparent opacity={0.3} />
          </Box>

          {/* Grid lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <Box key={`line-x-${i}`} args={[0.02, 20, 20]} position={[-5 + i, 10, 0]}>
              <meshBasicMaterial color="#333333" transparent opacity={0.2} />
            </Box>
          ))}
          {Array.from({ length: 21 }, (_, i) => (
            <Box key={`line-y-${i}`} args={[10, 0.02, 20]} position={[0, i, 0]}>
              <meshBasicMaterial color="#333333" transparent opacity={0.2} />
            </Box>
          ))}
          
          {/* Placed blocks */}
          {board.flat().flat().filter(Boolean).map((block, index) => (
            <Block3D key={index} block={block!} />
          ))}
          
          {/* Current Piece */}
          {currentPiece && <TetrisPiece3D piece={currentPiece} />}
          
          {/* Next Piece Preview */}
          {nextPiece && (
            <group position={[8, 15, 0]}>
              <TetrisPiece3D piece={{
                ...nextPiece,
                position: new THREE.Vector3(0, 0, 0)
              }} />
            </group>
          )}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD to move in 3D space • Space for hard drop • Full 3D Tetris!
        </div>
      </Card>
    </div>
  );
};