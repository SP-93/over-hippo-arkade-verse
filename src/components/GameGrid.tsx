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
    <div className="min-h-screen arcade-grid p-4">
      {/* Retro Arcade Header */}
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 blur-3xl"></div>
        <div className="relative">
          <h2 className="text-6xl font-black mb-4 retro-text" style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f39c12)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradient-shift 3s ease infinite'
          }}>
            ARCADE GAMES
          </h2>
          <p className="text-2xl text-yellow-400 retro-text mb-2">
            INSERT COIN TO PLAY
          </p>
          <div className="flex items-center justify-center gap-4 text-cyan-400">
            <span className="animate-pulse">●</span>
            <span>1 CHIP = 1 LIFE</span>
            <span className="animate-pulse">●</span>
          </div>
        </div>
      </div>

      {/* Game Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {games.map((game) => (
          <div 
            key={game.id} 
            className={`relative group transform transition-all duration-300 ${
              game.isAvailable ? 'hover:scale-105 hover:-translate-y-2' : 'opacity-60'
            }`}
          >
            {/* Classic Arcade Cabinet Frame */}
            <div className="bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 p-4 rounded-t-3xl rounded-b-xl border-4 border-gray-700 shadow-2xl">
              {/* Screen Bezel */}
              <div className="bg-black p-3 rounded-2xl border-3 border-gray-800 mb-4">
                {/* Game Screen */}
                <div className="bg-black border-2 border-gray-900 rounded-lg p-6 h-48 flex flex-col justify-between relative overflow-hidden scanlines">
                  {/* CRT Effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20"></div>
                  
                  {/* Game Title */}
                  <div className="text-center">
                    <h3 className="text-3xl font-bold retro-text mb-2" style={{
                      color: game.isAvailable ? '#00ff00' : '#666666',
                      textShadow: `0 0 10px ${game.isAvailable ? '#00ff00' : '#666666'}`
                    }}>
                      {game.name.toUpperCase()}
                    </h3>
                    <div className="mb-2">
                      <Badge className="bg-cyan-500 text-black text-xs font-bold">
                        3D
                      </Badge>
                    </div>
                    {game.isAvailable ? (
                      <Gamepad className="h-8 w-8 mx-auto text-yellow-400 animate-bounce" />
                    ) : (
                      <Lock className="h-8 w-8 mx-auto text-gray-500" />
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="space-y-2 text-center">
                    <p className="text-cyan-400 text-sm font-mono">
                      {game.description.toUpperCase()}
                    </p>
                    
                    <div className="flex justify-between text-xs">
                      <span className={`font-mono ${
                        game.difficulty === 'Easy' ? 'text-green-400' :
                        game.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {game.difficulty.toUpperCase()}
                      </span>
                      <span className="text-white font-mono">
                        MAX: {game.maxPoints.toLocaleString()}
                      </span>
                    </div>

                    {game.isAvailable && (
                      <div className="text-yellow-400 font-mono text-sm animate-pulse">
                        PRESS START
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div className="bg-gray-800 p-3 rounded-lg border-2 border-gray-900">
                <div className="flex items-center justify-between">
                  {/* Coin Slot */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-2 bg-black rounded border border-gray-600"></div>
                    <span className="text-white text-xs font-mono">1 CHIP</span>
                  </div>
                  
                  {/* Start Button */}
                  <Button 
                    className={`retro-button px-6 py-2 font-bold text-white ${
                      !game.isAvailable || playerChips < game.chipCost 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:shadow-lg active:shadow-sm'
                    }`}
                    onClick={() => handlePlayGame(game)}
                    disabled={!game.isAvailable || playerChips < game.chipCost}
                  >
                    {!game.isAvailable ? (
                      "SOON"
                    ) : playerChips < game.chipCost ? (
                      "NO COIN"
                    ) : (
                      "START"
                    )}
                  </Button>
                </div>
              </div>

              {/* Side Art */}
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 via-yellow-500 to-blue-500 rounded-l-3xl opacity-80"></div>
              <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-500 via-yellow-500 to-red-500 rounded-r-3xl opacity-80"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Banner */}
      <div className="mt-12 text-center">
        <div className="bg-black/80 border-4 border-yellow-400 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-4 text-yellow-400 retro-text animate-pulse">
            MORE GAMES LOADING...
          </h3>
          <p className="text-cyan-400 font-mono">
            NEW ARCADE CABINETS ARRIVING SOON!
          </p>
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};