import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PacManGameUIProps {
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  onStartGame: () => void;
  onPauseGame: () => void;
  children: React.ReactNode;
}

export const PacManGameUI = ({
  score,
  isPlaying,
  isPaused,
  gameOver,
  onStartGame,
  onPauseGame,
  children
}: PacManGameUIProps) => {
  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-arcade-gold">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-arcade-gold">3D Pac-Man</h2>
          <div className="text-lg font-bold text-neon-green">Score: {score}</div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={onStartGame}
            variant="arcade"
            disabled={isPlaying && !gameOver}
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </Button>
          
          {isPlaying && !gameOver && (
            <Button onClick={onPauseGame} variant="secondary">
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>

        {children}
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Use WASD or Arrow keys to move • Space to pause • Mouse to rotate camera
        </div>
      </Card>
    </div>
  );
};