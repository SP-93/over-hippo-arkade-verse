import { Snake3DGame } from "@/components/games/Snake3DGame";
import { Tetris3DGame } from "@/components/games/Tetris3DGame";
import { PacMan3DGame } from "@/components/games/PacMan3DGame";
import { Mario2DGame } from "@/components/games/Mario2DGame";
import { KingKong3DGame } from "@/components/games/KingKong3DGame";
import { Breakout3DGame } from "@/components/games/Breakout3DGame";
import { Asteroids3DGame } from "@/components/games/Asteroids3DGame";
import { Flipper3DGame } from "@/components/games/Flipper3DGame";
import { Frogger3DGame } from "@/components/games/Frogger3DGame";
import { GameTemplate } from "@/components/GameTemplate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GameRouterProps {
  gameId?: string;
  onScoreChange: (score: number) => void;
  onGameEnd: () => void;
  onGameStart: () => Promise<boolean>;
}

export const GameRouter = ({ gameId, onScoreChange, onGameEnd, onGameStart }: GameRouterProps) => {
  const navigate = useNavigate();

  const availableGames = ['tetris', 'snake', 'pacman', 'breakout', 'asteroids', 'flipper', 'mario', 'kingkong', 'frogger'];

  if (gameId === 'tetris') {
    return (
      <Tetris3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'snake') {
    return (
      <Snake3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'pacman') {
    return (
      <PacMan3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'breakout') {
    return (
      <Breakout3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'asteroids') {
    return (
      <Asteroids3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'flipper') {
    return (
      <Flipper3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'mario') {
    return (
      <Mario2DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'kingkong') {
    return (
      <KingKong3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'frogger') {
    return (
      <Frogger3DGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  // Unknown game fallback
  return (
    <Card className="p-8 bg-gradient-card border-primary min-h-96">
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold text-primary mb-2">
          {gameId?.charAt(0).toUpperCase() + gameId?.slice(1)} Game
        </h3>
        <p className="text-muted-foreground mb-4">
          This game is coming soon! Try Tetris, Snake, or Pac-Man for now.
        </p>
        <Button 
          variant="default" 
          onClick={() => navigate('/')}
          className="mt-4"
        >
          Return to Arcade
        </Button>
      </div>
    </Card>
  );
};