import { useState, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameManager } from "@/hooks/useGameManager";
import { toast } from "sonner";
import Game3DEngine from "./engine/Game3DEngine";
import { Player3D, Enemy3D, GameFloor3D, ParticleSystem3D } from "./engine/Game3DComponents";
import * as THREE from "three";

interface Asteroids3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}

export const Asteroids3DGame = ({ onScoreChange, onGameEnd, onGameStart }: Asteroids3DGameProps = {}) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ship, setShip] = useState({ position: new THREE.Vector3(0, 1, 0), rotation: 0 });
  const [asteroids, setAsteroids] = useState<any[]>([]);
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
    if (!handleGameStart('asteroids')) return;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setAsteroids(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: new THREE.Vector3((Math.random() - 0.5) * 20, 1, (Math.random() - 0.5) * 20),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2),
      size: 1 + Math.random(),
      alive: true
    })));
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-neon-green">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-green">3D Asteroids</h2>
          <div className="text-lg font-bold text-arcade-gold">Score: {score} | Lives: {lives}</div>
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

        <Game3DEngine gameId="asteroids-3d" camera={{ position: [0, 15, 15] }} lighting="retro">
          <GameFloor3D size={30} color="#0a0a2e" />
          <Player3D position={ship.position.toArray()} color="#00ff41" size={1} animation="spin" />
          {asteroids.map(asteroid => asteroid.alive && (
            <Enemy3D key={asteroid.id} position={asteroid.position.toArray()} color="#8B4513" size={asteroid.size} behavior="patrol" />
          ))}
        </Game3DEngine>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          WASD to move • Space to shoot • Destroy all asteroids!
        </div>
      </Card>
    </div>
  );
};