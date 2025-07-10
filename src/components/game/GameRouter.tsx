import React, { useEffect } from "react";
import { Snake3DGame } from "@/components/games/Snake3DGame";
import { Tetris3DGame } from "@/components/games/Tetris3DGame";
import { PacMan3DGame } from "@/components/games/PacMan3DGame";
import { Mario3DGame } from "@/components/games/mario/Mario3DGame";
import { KingKong3DGame } from "@/components/games/KingKong3DGame";
import { Breakout3DGame } from "@/components/games/Breakout3DGame";
import { Asteroids3DGame } from "@/components/games/Asteroids3DGame";
import { Flipper3DGame } from "@/components/games/Flipper3DGame";
import { Frogger3DGame } from "@/components/games/Frogger3DGame";
import { GameTemplate } from "@/components/GameTemplate";
import { Game3DErrorBoundary } from "@/components/Game3DErrorBoundary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { webglDetector } from "@/utils/webglDetector";
import { toast } from "sonner";

interface GameRouterProps {
  gameId?: string;
  onScoreChange: (score: number) => void;
  onGameEnd: () => void;
  onGameStart: () => Promise<boolean>;
}

export const GameRouter = ({ gameId, onScoreChange, onGameEnd, onGameStart }: GameRouterProps) => {
  const navigate = useNavigate();

  const availableGames = ['tetris', 'snake', 'pacman', 'breakout', 'asteroids', 'flipper', 'mario', 'kingkong', 'frogger'];

  // Check WebGL support on component mount
  useEffect(() => {
    const webglCapabilities = webglDetector.detect();
    if (!webglCapabilities.webgl1) {
      toast.error("WebGL not supported. 3D games may not work properly.");
      console.warn("WebGL Detection:", webglCapabilities);
    } else {
      console.log("✅ WebGL supported:", webglCapabilities);
      toast.success(`3D Games Ready! Performance: ${webglCapabilities.performanceLevel}`);
    }
  }, []);

  if (gameId === 'tetris') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Tetris3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'snake') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Snake3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'pacman') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <PacMan3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'breakout') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Breakout3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'asteroids') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Asteroids3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'flipper') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Flipper3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'mario') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Mario3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'kingkong') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <KingKong3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
    );
  }

  if (gameId === 'frogger') {
    return (
      <Game3DErrorBoundary gameId={gameId}>
        <Frogger3DGame 
          onScoreChange={onScoreChange}
          onGameEnd={onGameEnd}
          onGameStart={onGameStart}
        />
      </Game3DErrorBoundary>
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