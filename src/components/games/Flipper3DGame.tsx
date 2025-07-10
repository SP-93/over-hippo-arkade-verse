import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { Player3D, Platform3D, GameFloor3D, Collectible3D } from "./engine/Game3DComponents";
import * as THREE from "three";

interface Flipper3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const Flipper3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Flipper3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ball, setBall] = useState({ position: new THREE.Vector3(0, 5, -8), velocity: new THREE.Vector3(0, 0, 0.2) });
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  const { handleGameStart } = useGameManager();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key]: false }));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    if (onGameStart && !onGameStart()) return;
    if (!handleGameStart('flipper')) return;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setBall({ position: new THREE.Vector3(0, 5, -8), velocity: new THREE.Vector3(0, 0, 0.2) });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Pinball</h2>
          <div className="text-lg font-bold text-arcade-gold">Score: {score}</div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={startGame} variant="arcade" disabled={isPlaying && !gameOver}>
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
          {isPlaying && !gameOver && (
            <Button onClick={() => setIsPaused(!isPaused)} variant="secondary">
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>

        <Game3DEngine gameId="flipper-3d" camera={{ position: [0, 12, -8] }} lighting="retro">
          <GameFloor3D size={20} color="#1a1a2e" />
          
          {/* Pinball table */}
          <Platform3D position={[0, 0.5, 0]} size={[12, 0.2, 20]} color="#228B22" />
          
          {/* Flippers */}
          <Platform3D position={[-2, 1, -8]} size={[2, 0.3, 0.5]} color="#ff3366" />
          <Platform3D position={[2, 1, -8]} size={[2, 0.3, 0.5]} color="#ff3366" />
          
          {/* Ball */}
          <Player3D position={ball.position.toArray()} color="#FFD700" size={0.3} type="sphere" animation="spin" />
          
          {/* Bumpers */}
          <Collectible3D position={[-3, 1, 3]} color="#00ff41" type="coin" />
          <Collectible3D position={[3, 1, 3]} color="#00ff41" type="coin" />
          <Collectible3D position={[0, 1, 6]} color="#00ff41" type="coin" />
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          A/D to control flippers • Keep the ball in play • Hit bumpers for points!
        </div>
      </Card>
    </div>
  );
};