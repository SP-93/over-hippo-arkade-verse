import { TetrisGame } from "@/components/games/TetrisGame";
import { SnakeGame } from "@/components/games/SnakeGame";
import { Snake3DGame } from "@/components/games/Snake3DGame";
import { Tetris3DGame } from "@/components/games/Tetris3DGame";
import { PacManGame } from "@/components/games/PacManGame";
import { BreakoutGame } from "@/components/games/BreakoutGame";
import { AsteroidsGame } from "@/components/games/AsteroidsGame";
import { FlipperGame } from "@/components/games/FlipperGame";
import { MarioGame } from "@/components/games/MarioGame";
import { KingKongGame } from "@/components/games/KingKongGame";
import { FroggerGame } from "@/components/games/FroggerGame";
import { GameTemplate } from "@/components/GameTemplate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GameRouterProps {
  gameId?: string;
  onScoreChange: (score: number) => void;
  onGameEnd: () => void;
  onGameStart: () => boolean;
  is3DMode?: boolean;
}

export const GameRouter = ({ gameId, onScoreChange, onGameEnd, onGameStart, is3DMode = false }: GameRouterProps) => {
  const navigate = useNavigate();

  const availableGames = ['tetris', 'snake', 'pacman', 'breakout', 'asteroids', 'flipper', 'mario', 'kingkong', 'frogger'];

  if (gameId === 'tetris') {
    if (is3DMode) {
      return (
        <Tetris3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      );
    }
    return (
      <TetrisGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'snake') {
    if (is3DMode) {
      return (
        <Snake3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      );
    }
    return (
      <SnakeGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'pacman') {
    return (
      <PacManGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'breakout') {
    return (
      <BreakoutGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'asteroids') {
    return (
      <AsteroidsGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'flipper') {
    return (
      <FlipperGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'mario') {
    return (
      <MarioGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'kingkong') {
    return (
      <KingKongGame 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'frogger') {
    return (
      <FroggerGame 
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