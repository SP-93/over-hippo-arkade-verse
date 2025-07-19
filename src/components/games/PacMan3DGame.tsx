import React from "react";
import { useGameManager } from "@/hooks/useGameManager";
import Game3DEngine from "./engine/Game3DEngine";
import { 
  EnhancedGhost, 
  EnhancedPacMan, 
  EnhancedDot, 
  EnhancedMazeWall, 
  GameBounds 
} from "./engine/EnhancedPacMan3DComponents";
import { usePacManGameLogic, MAZE } from "./pacman/PacManGameLogic";
import { PacManGameUI } from "./pacman/PacManGameUI";
import { use3DDefensive } from "@/hooks/use3DDefensive";
import { globalWebGLManager, withWebGLContext } from "@/utils/webglContextManager";

const CELL_SIZE = 1;

interface PacMan3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

export const PacMan3DGame = ({ onScoreChange, onGameEnd, onGameStart }: PacMan3DGameProps = {}) => {
  console.log("PacMan3DGame loaded - 3D version active!");
  const { handleGameStart } = useGameManager();
  const { safeDispose } = use3DDefensive();

  const { gameState, startGame, pauseGame, handleGhostCollision } = usePacManGameLogic({
    onScoreChange,
    onGameEnd,
    onGameStart: async () => {
      if (onGameStart && !await onGameStart()) return false;
      return handleGameStart('pacman');
    }
  });

  const ghosts = [
    { position: [9, CELL_SIZE/2, 9] as [number, number, number], color: "#ff0000" },
    { position: [10, CELL_SIZE/2, 9] as [number, number, number], color: "#ffb8ff" },
    { position: [11, CELL_SIZE/2, 9] as [number, number, number], color: "#00ffff" },
    { position: [12, CELL_SIZE/2, 9] as [number, number, number], color: "#ffb852" },
  ];

  return (
    <PacManGameUI
      score={gameState.score}
      isPlaying={gameState.isPlaying}
      isPaused={gameState.isPaused}
      gameOver={gameState.gameOver}
      onStartGame={startGame}
      onPauseGame={pauseGame}
    >
      <Game3DEngine
        gameId="pacman-3d"
        camera={{ position: [10, 25, 25], fov: 60 }}
        lighting="arcade"
        environment="forest"
        enableOrbitControls={true}
      >
        {/* Game Bounds */}
        <GameBounds size={21} />
        
        {/* Enhanced Maze */}
        {gameState.maze.map((row, z) =>
          row.map((cell, x) => {
            const position: [number, number, number] = [x, CELL_SIZE/2, z];
            
            if (cell === 1) {
              return <EnhancedMazeWall key={`${x}-${z}`} position={position} type="wall" />;
            } else if (cell === 2) {
              return (
                <EnhancedDot 
                  key={`${x}-${z}`} 
                  position={[x, 0, z]} 
                  collected={false}
                  onCollect={() => {}}
                  playerPosition={[gameState.pacmanPosition.x, CELL_SIZE/2, gameState.pacmanPosition.z]}
                />
              );
            } else if (cell === 3) {
              return (
                <EnhancedDot 
                  key={`${x}-${z}`} 
                  position={[x, 0, z]} 
                  isPowerPellet={true}
                  collected={false}
                  onCollect={() => {}}
                  playerPosition={[gameState.pacmanPosition.x, CELL_SIZE/2, gameState.pacmanPosition.z]}
                />
              );
            }
            return null;
          })
        )}
        
        {/* Enhanced Pac-Man */}
        <EnhancedPacMan 
          position={[gameState.pacmanPosition.x, CELL_SIZE/2, gameState.pacmanPosition.z]} 
          direction={gameState.direction}
        />
        
        {/* Enhanced Ghosts */}
        {ghosts.map((ghost, index) => (
          <EnhancedGhost 
            key={index}
            position={ghost.position}
            targetPosition={[gameState.pacmanPosition.x, CELL_SIZE/2, gameState.pacmanPosition.z]}
            maze={gameState.maze}
            color={ghost.color}
            mode="chase"
            onPlayerCollision={handleGhostCollision}
          />
        ))}
      </Game3DEngine>
    </PacManGameUI>
  );
};