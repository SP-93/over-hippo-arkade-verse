import React, { memo, useMemo, useCallback, lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Zap, Star, Trophy } from "lucide-react";
import { usePerformanceOptimizer } from "@/hooks/usePerformanceOptimizer";

// Lazy load game components for better performance
const LazyAsteroidsGame = lazy(() => import("./games/AsteroidsGame").then(module => ({ default: module.AsteroidsGame })));
const LazyBreakoutGame = lazy(() => import("./games/BreakoutGame").then(module => ({ default: module.BreakoutGame })));
const LazyFlipperGame = lazy(() => import("./games/FlipperGame").then(module => ({ default: module.FlipperGame })));
const LazyFroggerGame = lazy(() => import("./games/FroggerGame").then(module => ({ default: module.FroggerGame })));
const LazyKingKongGame = lazy(() => import("./games/KingKongGame").then(module => ({ default: module.KingKongGame })));
const LazyMarioGame = lazy(() => import("./games/MarioGame").then(module => ({ default: module.MarioGame })));
const LazyPacManGame = lazy(() => import("./games/PacManGame").then(module => ({ default: module.PacManGame })));
const LazySnakeGame = lazy(() => import("./games/SnakeGame").then(module => ({ default: module.SnakeGame })));
const LazyTetrisGame = lazy(() => import("./games/TetrisGame").then(module => ({ default: module.TetrisGame })));

interface GameInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  category: "Classic" | "Action" | "Puzzle" | "Arcade";
  description: string;
  minChips: number;
  premium: boolean;
  component: React.LazyExoticComponent<any>;
}

interface OptimizedGameGridProps {
  onGameSelect: (gameId: string) => void;
  playerChips: number;
  isVip: boolean;
}

const GameSkeleton = memo(() => (
  <Card className="p-4">
    <div className="space-y-3">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-8 w-full" />
    </div>
  </Card>
));

GameSkeleton.displayName = "GameSkeleton";

export const OptimizedGameGrid = memo(({ onGameSelect, playerChips, isVip }: OptimizedGameGridProps) => {
  const { settings, measureRenderTime } = usePerformanceOptimizer();

  // Memoized games data to prevent re-creation on every render
  const games = useMemo<GameInfo[]>(() => [
    {
      id: "asteroids",
      name: "Asteroids",
      icon: <Zap className="h-6 w-6" />,
      difficulty: "Medium",
      category: "Action",
      description: "Navigate space and destroy asteroids",
      minChips: 1,
      premium: false,
      component: LazyAsteroidsGame
    },
    {
      id: "breakout",
      name: "Breakout",
      icon: <Play className="h-6 w-6" />,
      difficulty: "Easy",
      category: "Classic",
      description: "Break all bricks with your paddle",
      minChips: 1,
      premium: false,
      component: LazyBreakoutGame
    },
    {
      id: "flipper",
      name: "Flipper",
      icon: <Star className="h-6 w-6" />,
      difficulty: "Hard",
      category: "Arcade",
      description: "Classic pinball action",
      minChips: 2,
      premium: true,
      component: LazyFlipperGame
    },
    {
      id: "frogger",
      name: "Frogger",
      icon: <Trophy className="h-6 w-6" />,
      difficulty: "Medium",
      category: "Action",
      description: "Cross the road and river safely",
      minChips: 1,
      premium: false,
      component: LazyFroggerGame
    },
    {
      id: "kingkong",
      name: "King Kong",
      icon: <Zap className="h-6 w-6" />,
      difficulty: "Expert",
      category: "Action",
      description: "Climb the building avoiding obstacles",
      minChips: 3,
      premium: true,
      component: LazyKingKongGame
    },
    {
      id: "mario",
      name: "Mario",
      icon: <Star className="h-6 w-6" />,
      difficulty: "Medium",
      category: "Action",
      description: "Classic platformer adventure",
      minChips: 2,
      premium: false,
      component: LazyMarioGame
    },
    {
      id: "pacman",
      name: "Pac-Man",
      icon: <Play className="h-6 w-6" />,
      difficulty: "Easy",
      category: "Classic",
      description: "Eat dots and avoid ghosts",
      minChips: 1,
      premium: false,
      component: LazyPacManGame
    },
    {
      id: "snake",
      name: "Snake",
      icon: <Zap className="h-6 w-6" />,
      difficulty: "Easy",
      category: "Classic",
      description: "Grow your snake and avoid walls",
      minChips: 1,
      premium: false,
      component: LazySnakeGame
    },
    {
      id: "tetris",
      name: "Tetris",
      icon: <Trophy className="h-6 w-6" />,
      difficulty: "Medium",
      category: "Puzzle",
      description: "Clear lines by arranging blocks",
      minChips: 1,
      premium: false,
      component: LazyTetrisGame
    }
  ], []);

  // Memoized filtered games based on access level
  const filteredGames = useMemo(() => {
    if (isVip) return games;
    return games.filter(game => !game.premium);
  }, [games, isVip]);

  // Optimized game selection handler
  const handleGameSelect = useCallback((gameId: string) => {
    const endMeasurement = measureRenderTime();
    onGameSelect(gameId);
    endMeasurement();
  }, [onGameSelect, measureRenderTime]);

  // Memoized game card component to prevent unnecessary re-renders
  const GameCard = memo(({ game }: { game: GameInfo }) => {
    const canPlay = playerChips >= game.minChips && (!game.premium || isVip);
    
    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-200 bg-gradient-card border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-primary">{game.icon}</div>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {game.difficulty}
              </Badge>
              {game.premium && (
                <Badge variant="secondary" className="text-xs">
                  VIP
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground">{game.name}</h3>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{game.category}</span>
            <span>{game.minChips} chips</span>
          </div>
          
          <Button
            onClick={() => handleGameSelect(game.id)}
            disabled={!canPlay}
            className="w-full"
            variant={canPlay ? "default" : "outline"}
          >
            {!canPlay ? (
              game.premium && !isVip ? "VIP Required" : "Need More Chips"
            ) : (
              "Play Game"
            )}
          </Button>
        </div>
      </Card>
    );
  });

  GameCard.displayName = "GameCard";

  // Use virtualization for large lists if enabled
  if (settings.enableVirtualization && filteredGames.length > 6) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Virtualized view enabled for better performance
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-auto">
          {filteredGames.map((game) => (
            <Suspense key={game.id} fallback={<GameSkeleton />}>
              <GameCard game={game} />
            </Suspense>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredGames.map((game) => (
        <Suspense key={game.id} fallback={<GameSkeleton />}>
          <GameCard game={game} />
        </Suspense>
      ))}
    </div>
  );
});

OptimizedGameGrid.displayName = "OptimizedGameGrid";