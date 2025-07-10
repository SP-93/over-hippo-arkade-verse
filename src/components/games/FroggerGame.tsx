import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface FroggerGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
}

export const FroggerGame = ({ onScoreChange, onGameEnd, onGameStart }: FroggerGameProps) => {
  const [score, setScore] = useState(0);
  const [frog, setFrog] = useState({ x: 300, y: 550 });
  const [cars, setCars] = useState([
    { x: 0, y: 450, width: 60, height: 30, speed: 3, color: '#ff4444' },
    { x: 150, y: 450, width: 60, height: 30, speed: 3, color: '#4444ff' },
    { x: 500, y: 350, width: 80, height: 35, speed: -4, color: '#44ff44' },
    { x: 200, y: 350, width: 80, height: 35, speed: -4, color: '#ffff44' }
  ]);
  const [logs, setLogs] = useState([
    { x: 100, y: 150, width: 100, height: 25, speed: 2 },
    { x: 300, y: 100, width: 120, height: 25, speed: -1.5 }
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startGame = useCallback(() => {
    if (onGameStart && !onGameStart()) return;
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    onScoreChange(0);
    setFrog({ x: 300, y: 550 });
    toast.success("Frogger put počinje!");
  }, [onGameStart, onScoreChange]);

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Frogger</h2>
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play size={16} />
            Start Game
          </Button>
        </div>
        <div className="text-center min-h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Road crossing adventure coming soon!</p>
        </div>
      </div>
    </Card>
  );
};