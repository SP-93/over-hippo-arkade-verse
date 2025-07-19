import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "../engine/Game3DEngine";
import { Platform3D, GameFloor3D } from "../engine/Game3DComponents";
import { EnhancedEnemy3D, EnhancedCoin3D } from "../engine/EnhancedMario3DComponents";
import { Mario3DCharacter } from "./Mario3DCharacter";
import { useMarioGameLogic } from "./useMarioGameLogic";
import { Mario3DGameProps } from "./types";
import { use3DDefensive } from "@/hooks/use3DDefensive";
import { globalWebGLManager, withWebGLContext } from "@/utils/webglContextManager";

const WORLD_SIZE = 50;

export const Mario3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Mario3DGameProps = {}) => {
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  
  const { handleGameStart } = useGameManager();
  const { safeDispose } = use3DDefensive();
  
  const {
    player,
    enemies,
    coins,
    platforms,
    score,
    resetGameState,
    getPlayerAnimation
  } = useMarioGameLogic(isPlaying, isPaused, gameOver, lives, onScoreChange);

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
    if (!handleGameStart('mario')) return;
    
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    resetGameState();
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Mario Adventure</h2>
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
          gameId="mario-3d"
          camera={{ position: [0, 15, 15], fov: 60 }}
          lighting="arcade"
          environment="abstract"
          enableOrbitControls={true}
        >
          {/* Game Floor */}
          <GameFloor3D size={WORLD_SIZE} color="#228B22" pattern="grid" />
          
          {/* Platforms */}
          {platforms.map((platform, index) => (
            <Platform3D
              key={index}
              position={platform.position.toArray()}
              size={platform.size.toArray()}
              color={platform.type === 'pipe' ? "#32CD32" : platform.type === 'brick' ? "#CD853F" : "#8B4513"}
              type={platform.type}
            />
          ))}
          
          {/* Mario Player */}
          <Mario3DCharacter player={player} animation={getPlayerAnimation()} />
          
          {/* Enemies */}
          {enemies.map(enemy => 
            enemy.alive && (
              <EnhancedEnemy3D
                key={enemy.id}
                position={enemy.position.toArray()}
                color={enemy.type === 'goomba' ? "#8B4513" : "#32CD32"}
                size={0.8}
                type={enemy.type}
                behavior="patrol"
                speed={1}
              />
            )
          )}
          
          {/* Coins */}
          {coins.map(coin => (
            <EnhancedCoin3D
              key={coin.id}
              position={coin.position.toArray()}
              color="#FFD700"
              collected={coin.collected}
            />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD to move • Space to jump • Jump on enemies to defeat them!
        </div>
      </Card>
    </div>
  );
};