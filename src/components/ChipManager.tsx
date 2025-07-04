import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface ChipManagerProps {
  playerChips: number;
  onChipChange: (chips: number) => void;
}

export const ChipManager = ({ playerChips, onChipChange }: ChipManagerProps) => {
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);

  useEffect(() => {
    const savedResetTime = localStorage.getItem('chip_reset_time');
    const now = new Date();
    
    if (savedResetTime) {
      const resetTime = new Date(savedResetTime);
      const timeDiff = now.getTime() - resetTime.getTime();
      const hoursElapsed = timeDiff / (1000 * 60 * 60);
      
      if (hoursElapsed >= 24) {
        // Reset chips to 5 after 24 hours
        onChipChange(5);
        localStorage.setItem('chip_reset_time', now.toISOString());
        setLastResetTime(now.toISOString());
      } else {
        setLastResetTime(savedResetTime);
      }
    } else {
      // First time - set initial chips and reset time
      localStorage.setItem('chip_reset_time', now.toISOString());
      setLastResetTime(now.toISOString());
    }
  }, [onChipChange]);

  const canPlayGame = (gameType: string): boolean => {
    return playerChips > 0;
  };

  const consumeChip = (gameType: string): boolean => {
    if (!canPlayGame(gameType)) return false;
    
    onChipChange(playerChips - 1);
    return true;
  };

  const getTimeUntilReset = (): string => {
    if (!lastResetTime) return "00:00:00";
    
    const resetTime = new Date(lastResetTime);
    const nextReset = new Date(resetTime.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    const timeDiff = nextReset.getTime() - now.getTime();
    
    if (timeDiff <= 0) return "00:00:00";
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    canPlayGame,
    consumeChip,
    getTimeUntilReset
  };
};

export const ChipDisplay = ({ playerChips, timeUntilReset }: { playerChips: number; timeUntilReset: string }) => {
  return (
    <Card className="p-4 bg-gradient-card border-arcade-gold">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-arcade-gold" />
          <div>
            <p className="text-sm text-muted-foreground">Game Chips</p>
            <p className="text-xl font-bold text-arcade-gold">{playerChips}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next Reset</p>
          <p className="text-sm font-mono text-arcade-gold">{timeUntilReset}</p>
        </div>
      </div>
    </Card>
  );
};