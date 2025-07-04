import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad, Zap, Lock } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chipCost: number;
  maxPoints: number;
  isAvailable: boolean;
}

interface GameGridProps {
  playerChips: number;
  onPlayGame: (gameId: string) => void;
}

const games: Game[] = [
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic block-stacking puzzle game',
    difficulty: 'Medium',
    chipCost: 1,
    maxPoints: 1000,
    isAvailable: true
  },
  {
    id: 'flipper',
    name: 'Flipper',
    description: 'Retro pinball arcade action',
    difficulty: 'Hard',
    chipCost: 1,
    maxPoints: 1500,
    isAvailable: true
  },
  {
    id: 'mario',
    name: 'Super Mario',
    description: 'Platform adventure classic',
    difficulty: 'Medium',
    chipCost: 1,
    maxPoints: 1200,
    isAvailable: true
  },
  {
    id: 'kingkong',
    name: 'King Kong',
    description: 'Climb the tower and save the day',
    difficulty: 'Hard',
    chipCost: 1,
    maxPoints: 1800,
    isAvailable: true
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    description: 'Chomp dots and avoid ghosts',
    difficulty: 'Easy',
    chipCost: 1,
    maxPoints: 800,
    isAvailable: true
  },
  {
    id: 'frogger',
    name: 'Frogger',
    description: 'Cross the road safely',
    difficulty: 'Medium',
    chipCost: 1,
    maxPoints: 900,
    isAvailable: true
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow your snake and avoid walls',
    difficulty: 'Easy',
    chipCost: 1,
    maxPoints: 600,
    isAvailable: true
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Break blocks with your paddle',
    difficulty: 'Medium',
    chipCost: 1,
    maxPoints: 1100,
    isAvailable: true
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    description: 'Destroy asteroids in space',
    difficulty: 'Hard',
    chipCost: 1,
    maxPoints: 1600,
    isAvailable: true
  },
  {
    id: 'centipede',
    name: 'Centipede',
    description: 'Shoot the descending centipede',
    difficulty: 'Hard',
    chipCost: 1,
    maxPoints: 1400,
    isAvailable: false
  }
];

export const GameGrid = ({ playerChips, onPlayGame }: GameGridProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-neon-green text-background';
      case 'Medium':
        return 'bg-arcade-gold text-background';
      case 'Hard':
        return 'bg-neon-pink text-background';
      default:
        return 'bg-muted';
    }
  };

  const handlePlayGame = (game: Game) => {
    if (!game.isAvailable) {
      toast.error("This game is coming soon!");
      return;
    }

    if (playerChips < game.chipCost) {
      toast.error("Not enough chips! Purchase more chips to play.");
      return;
    }

    toast.success(`Starting ${game.name}! Good luck!`);
    onPlayGame(game.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-black text-foreground mb-2">
          Choose Your Game
        </h2>
        <p className="text-muted-foreground">
          Each game costs 1 chip to play. Earn points to exchange for tokens!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className={`p-6 bg-gradient-card border-2 transition-all duration-300 hover:scale-105 ${
              game.isAvailable 
                ? 'border-primary hover:border-neon-pink hover:shadow-neon' 
                : 'border-muted opacity-60'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {game.isAvailable ? (
                    <Gamepad className="h-6 w-6 text-primary animate-float" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                  <h3 className="font-bold text-lg">{game.name}</h3>
                </div>
                <Badge className={getDifficultyColor(game.difficulty)}>
                  {game.difficulty}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {game.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-arcade-gold" />
                  <span className="text-arcade-gold font-bold">
                    Max: {game.maxPoints.toLocaleString()} pts
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Cost: {game.chipCost} chip
                </div>
              </div>

              <Button 
                variant={game.isAvailable ? "default" : "outline"}
                className="w-full"
                onClick={() => handlePlayGame(game)}
                disabled={!game.isAvailable || playerChips < game.chipCost}
              >
                {!game.isAvailable ? (
                  "Coming Soon"
                ) : playerChips < game.chipCost ? (
                  "Need More Chips"
                ) : (
                  "Play Game"
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-card border-accent text-center">
        <h3 className="text-lg font-bold mb-2 text-accent">
          More Games Coming Soon!
        </h3>
        <p className="text-muted-foreground">
          We're constantly adding new games to the arcade. 
          Stay tuned for more exciting challenges!
        </p>
      </Card>
    </div>
  );
};