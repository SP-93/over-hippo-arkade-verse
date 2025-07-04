import { UltraSnake2025 } from "@/components/games/UltraSnake2025";
import { UltraTetris2025 } from "@/components/games/UltraTetris2025";
import { PacMan2D } from "@/components/games/PacMan2D";
import { GameTemplate } from "@/components/GameTemplate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GameRouterProps {
  gameId?: string;
  onScoreChange: (score: number) => void;
  onGameEnd: () => void;
  onGameStart: () => boolean;
}

export const GameRouter = ({ gameId, onScoreChange, onGameEnd, onGameStart }: GameRouterProps) => {
  const navigate = useNavigate();

  const availableGames = ['tetris', 'snake', 'pacman', 'breakout', 'asteroids', 'flipper', 'mario', 'kingkong', 'frogger'];

  if (gameId === 'tetris') {
    return (
      <UltraTetris2025 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'snake') {
    return (
      <UltraSnake2025 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'pacman') {
    return (
      <PacMan2D 
        onScoreChange={onScoreChange}
        onGameEnd={onGameEnd}
        onGameStart={onGameStart}
      />
    );
  }

  if (gameId === 'breakout') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-pink min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-neon-pink mb-2">3D Breakout</h3>
          <p className="text-muted-foreground mb-4">3D Breakout is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'asteroids') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-green min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-neon-green mb-2">3D Asteroids</h3>
          <p className="text-muted-foreground mb-4">3D Asteroids is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'flipper') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-blue min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-neon-blue mb-2">3D Flipper</h3>
          <p className="text-muted-foreground mb-4">3D Flipper is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'mario') {
    return (
      <Card className="p-8 bg-gradient-card border-arcade-gold min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-arcade-gold mb-2">3D Mario</h3>
          <p className="text-muted-foreground mb-4">3D Mario is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'kingkong') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-pink min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-neon-pink mb-2">3D King Kong</h3>
          <p className="text-muted-foreground mb-4">3D King Kong is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'frogger') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-green min-h-96">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-neon-green mb-2">3D Frogger</h3>
          <p className="text-muted-foreground mb-4">3D Frogger is coming soon!</p>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
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