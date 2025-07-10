import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface BreakoutGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
}

export const BreakoutGame = ({ onScoreChange, onGameEnd, onGameStart }: BreakoutGameProps) => {
  const [score, setScore] = useState(0);
  const [ball, setBall] = useState({ x: 300, y: 400, dx: 4, dy: -4 });
  const [paddle, setPaddle] = useState({ x: 250, y: 450, width: 100 });
  const [bricks, setBricks] = useState(() => {
    const newBricks = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 10; col++) {
        newBricks.push({
          x: col * 60 + 20,
          y: row * 30 + 50,
          width: 50,
          height: 20,
          destroyed: false,
          color: `hsl(${row * 30}, 70%, 60%)`
        });
      }
    }
    return newBricks;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startGame = useCallback(() => {
    if (onGameStart && !onGameStart()) return;
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    onScoreChange(0);
    setBall({ x: 300, y: 400, dx: 4, dy: -4 });
    setPaddle({ x: 250, y: 450, width: 100 });
    setBricks(prev => prev.map(brick => ({ ...brick, destroyed: false })));
    toast.success("Breakout počinje!");
  }, [onGameStart, onScoreChange]);

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Breakout</h2>
          <Button onClick={startGame} className="flex items-center gap-2">
            <Play size={16} />
            Start Game
          </Button>
        </div>
        <div className="text-center min-h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Classic brick-breaking action coming soon!</p>
        </div>
      </div>
    </Card>
  );
};