import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface FlipperGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
}

export const FlipperGame = ({ onScoreChange, onGameEnd, onGameStart }: FlipperGameProps) => {
  const [score, setScore] = useState(0);
  const [ball, setBall] = useState({ x: 300, y: 400, vx: 2, vy: -3 });
  const [leftFlipper, setLeftFlipper] = useState({ angle: 0 });
  const [rightFlipper, setRightFlipper] = useState({ angle: 0 });
  const [bumpers] = useState([
    { x: 200, y: 200, radius: 25 },
    { x: 350, y: 180, radius: 25 },
    { x: 400, y: 250, radius: 25 }
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
    setBall({ x: 300, y: 400, vx: 2, vy: -3 });
    setLeftFlipper({ angle: 0 });
    setRightFlipper({ angle: 0 });
    toast.success("Pinball mašina aktivirana!");
  }, [onGameStart, onScoreChange]);

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Pinball</h2>
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play size={16} />
            Start Game
          </Button>
        </div>
        <div className="text-center min-h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Pinball physics action coming soon!</p>
        </div>
      </div>
    </Card>
  );
};