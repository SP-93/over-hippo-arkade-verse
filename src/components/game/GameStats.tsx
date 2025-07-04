import { Card } from "@/components/ui/card";
import { Timer, Coins, Trophy } from "lucide-react";

interface GameStatsProps {
  gameTime: number;
  currentScore: number;
  gameStatus: 'playing' | 'paused' | 'finished';
}

export const GameStats = ({ gameTime, currentScore, gameStatus }: GameStatsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 bg-gradient-card border-neon-blue">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-neon-blue" />
          <div>
            <p className="text-sm text-muted-foreground">Game Time</p>
            <p className="text-xl font-bold text-neon-blue">{formatTime(gameTime)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card border-arcade-gold">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-arcade-gold" />
          <div>
            <p className="text-sm text-muted-foreground">Current Score</p>
            <p className="text-xl font-bold text-arcade-gold">{currentScore.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card border-neon-pink">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-neon-pink" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-xl font-bold text-neon-pink capitalize">{gameStatus}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};