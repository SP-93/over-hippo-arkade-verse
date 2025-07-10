import { useEffect, useState } from "react";
import { useScoreManager } from "@/hooks/useScoreManager";
import { Card } from "@/components/ui/card";

interface ScoreDisplayProps {
  sessionId?: string;
  gameType: string;
  showCombo?: boolean;
}

export const ScoreDisplay = ({ 
  sessionId, 
  gameType, 
  showCombo = true 
}: ScoreDisplayProps) => {
  const { currentScore, comboMultiplier, bonusPoints } = useScoreManager(sessionId);
  const [scoreAnimation, setScoreAnimation] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (currentScore > 0) {
      setScoreAnimation(true);
      const timer = setTimeout(() => setScoreAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentScore]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Main Score */}
      <Card className={`p-4 bg-gradient-card border-primary transition-all duration-300 ${
        scoreAnimation ? 'scale-110 shadow-lg shadow-primary/30' : ''
      }`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-2xl font-bold text-primary">
            {currentScore.toLocaleString()}
          </p>
        </div>
      </Card>

      {/* Combo Multiplier */}
      {showCombo && comboMultiplier > 1 && (
        <Card className="p-3 bg-gradient-card border-secondary animate-pulse">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Combo</p>
            <p className="text-lg font-bold text-secondary">
              x{comboMultiplier}
            </p>
          </div>
        </Card>
      )}

      {/* Bonus Points */}
      {bonusPoints > 0 && (
        <Card className="p-2 bg-gradient-card border-accent">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Bonus</p>
            <p className="text-sm font-bold text-accent">
              +{bonusPoints}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};