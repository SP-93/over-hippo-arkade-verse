import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AsteroidsGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
}

export const AsteroidsGame = ({ onScoreChange, onGameEnd, onGameStart }: AsteroidsGameProps) => {
  const [score, setScore] = useState(0);
  const [ship, setShip] = useState({ x: 300, y: 300, angle: 0, vx: 0, vy: 0 });
  const [asteroids, setAsteroids] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startGame = useCallback(() => {
    if (onGameStart && !onGameStart()) return;
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    onScoreChange(0);
    setShip({ x: 300, y: 300, angle: 0, vx: 0, vy: 0 });
    setAsteroids([
      { x: 100, y: 100, vx: 2, vy: 1, size: 40 },
      { x: 500, y: 150, vx: -1, vy: 2, size: 40 },
      { x: 400, y: 400, vx: 1, vy: -1, size: 40 },
      { x: 150, y: 350, vx: -2, vy: -1, size: 40 }
    ]);
    setBullets([]);
    toast.success("Asteroids misija počinje!");
  }, [onGameStart, onScoreChange]);

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Asteroids</h2>
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play size={16} />
            Start Game
          </Button>
        </div>
        <div className="text-center min-h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Space shooter action coming soon!</p>
        </div>
      </div>
    </Card>
  );
};