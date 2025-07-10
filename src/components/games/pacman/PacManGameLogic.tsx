import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const GRID_SIZE = 21;

// Maze layout (1 = wall, 2 = dot, 3 = power pellet, 0 = empty)
export const MAZE = [
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

interface PacManGameState {
  pacmanPosition: { x: number; z: number };
  direction: { x: number; z: number };
  maze: number[][];
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
}

interface UsePacManGameLogicProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

export const usePacManGameLogic = ({ onScoreChange, onGameEnd, onGameStart }: UsePacManGameLogicProps = {}) => {
  const [gameState, setGameState] = useState<PacManGameState>({
    pacmanPosition: { x: 10, z: 15 },
    direction: { x: 0, z: 0 },
    maze: MAZE.map(row => [...row]),
    score: 0,
    isPlaying: false,
    isPaused: false,
    gameOver: false,
  });

  const gameLoopRef = useRef<NodeJS.Timeout>();

  const movePacman = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.gameOver || (gameState.direction.x === 0 && gameState.direction.z === 0)) return;

    setGameState(current => {
      const newX = current.pacmanPosition.x + current.direction.x;
      const newZ = current.pacmanPosition.z + current.direction.z;
      
      // Check boundaries
      if (newX < 0 || newX >= GRID_SIZE || newZ < 0 || newZ >= GRID_SIZE) {
        return current;
      }
      
      // Check walls
      if (current.maze[newZ][newX] === 1) {
        return current;
      }
      
      let newScore = current.score;
      let newMaze = current.maze;
      
      // Eat dots/pellets
      if (current.maze[newZ][newX] === 2 || current.maze[newZ][newX] === 3) {
        const points = current.maze[newZ][newX] === 3 ? 50 : 10;
        newScore = current.score + points;
        onScoreChange?.(newScore);
        
        newMaze = current.maze.map(row => [...row]);
        newMaze[newZ][newX] = 0;
        
        // Check win condition
        const remainingDots = newMaze.flat().filter(cell => cell === 2 || cell === 3).length;
        if (remainingDots === 0) {
          toast.success("You Win! Level Complete!");
          onGameEnd?.();
          return {
            ...current,
            pacmanPosition: { x: newX, z: newZ },
            maze: newMaze,
            score: newScore,
            gameOver: true,
            isPlaying: false,
          };
        }
      }
      
      return {
        ...current,
        pacmanPosition: { x: newX, z: newZ },
        maze: newMaze,
        score: newScore,
      };
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, gameState.direction, onScoreChange, onGameEnd]);

  const setDirection = useCallback((newDirection: { x: number; z: number }) => {
    setGameState(current => ({
      ...current,
      direction: newDirection
    }));
  }, []);

  const handleGhostCollision = useCallback(() => {
    toast.error("Caught by ghost!");
    setGameState(current => ({
      ...current,
      gameOver: true,
      isPlaying: false,
    }));
    onGameEnd?.();
  }, [onGameEnd]);

  const startGame = useCallback(() => {
    if (onGameStart && !onGameStart()) return;
    
    setGameState({
      pacmanPosition: { x: 10, z: 15 },
      direction: { x: 0, z: 0 },
      maze: MAZE.map(row => [...row]),
      score: 0,
      gameOver: false,
      isPlaying: true,
      isPaused: false,
    });
  }, [onGameStart]);

  const pauseGame = useCallback(() => {
    setGameState(current => ({
      ...current,
      isPaused: !current.isPaused
    }));
  }, []);

  // Game loop effect
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !gameState.gameOver) {
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
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, movePacman]);

  // Keyboard controls effect
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.gameOver) return;
      
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
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, gameState.gameOver, setDirection, pauseGame]);

  return {
    gameState,
    startGame,
    pauseGame,
    handleGhostCollision,
  };
};