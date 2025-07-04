import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Heart } from "lucide-react";

interface ChipDisplayProps {
  playerChips: number;
  timeUntilReset: string;
  currentLives?: number;
  showLives?: boolean;
}

export const ChipDisplay = ({ playerChips, timeUntilReset, currentLives = 0, showLives = false }: ChipDisplayProps) => {
  return (
    <Card className="p-4 bg-gradient-card border-arcade-gold">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-arcade-gold" />
            <div>
              <p className="text-sm text-muted-foreground">Game Chips</p>
              <p className="text-xl font-bold text-arcade-gold">{playerChips}</p>
            </div>
          </div>
          
          {showLives && (
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Lives</p>
                <p className="text-xl font-bold text-red-500">{currentLives}</p>
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next Reset</p>
          <p className="text-sm font-mono text-arcade-gold">{timeUntilReset}</p>
        </div>
      </div>
    </Card>
  );
};