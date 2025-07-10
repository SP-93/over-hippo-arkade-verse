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
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = useCallback(() => {
    if (onGameStart && !onGameStart()) return;
    setIsPlaying(true);
    setScore(0);
    onScoreChange(0);
    toast.success("Pinball started!");
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