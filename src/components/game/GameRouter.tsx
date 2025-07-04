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
      <Card className="p-8 bg-gradient-card border-neon-pink min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-neon-pink mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D Breakout with Over Protocol integration is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Ultra-realistic 3D physics</li>
              <li>• Over Protocol rewards</li>
              <li>• Multiplayer tournaments</li>
              <li>• NFT power-ups</li>
            </ul>
          </div>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'asteroids') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-green min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-neon-green mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D Asteroids with blockchain rewards is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Immersive 3D asteroid fields</li>
              <li>• Play-to-earn mechanics</li>
              <li>• Weapon NFTs</li>
              <li>• Leaderboard tournaments</li>
            </ul>
          </div>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'flipper') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-blue min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-neon-blue mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D Pinball with Over Protocol integration is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Photorealistic 3D pinball physics</li>
              <li>• Collectible table NFTs</li>
              <li>• Tournament prizes in OVER</li>
              <li>• Custom flipper skins</li>
            </ul>
          </div>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'mario') {
    return (
      <Card className="p-8 bg-gradient-card border-arcade-gold min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-arcade-gold mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D Platformer adventure with blockchain integration is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Full 3D platformer levels</li>
              <li>• Collectible power-up NFTs</li>
              <li>• Earn OVER tokens for completion</li>
              <li>• Community-created levels</li>
            </ul>
          </div>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'kingkong') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-pink min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-neon-pink mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D King Kong adventure with Over Protocol rewards is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Epic 3D climbing mechanics</li>
              <li>• Rare character NFTs</li>
              <li>• Boss battle tournaments</li>
              <li>• OVER token rewards</li>
            </ul>
          </div>
          <Button variant="default" onClick={() => navigate('/')}>Return to Arcade</Button>
        </div>
      </Card>
    );
  }

  if (gameId === 'frogger') {
    return (
      <Card className="p-8 bg-gradient-card border-neon-green min-h-96 animate-glow">
        <div className="text-center space-y-6">
          <div className="animate-neon-pulse">🚧</div>
          <h3 className="text-2xl font-bold text-neon-green mb-2 animate-text-glow">UNDER CONSTRUCTION</h3>
          <p className="text-muted-foreground mb-4">3D Frogger with blockchain integration is being developed!</p>
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Coming Features:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Immersive 3D road crossing</li>
              <li>• Collectible frog NFTs</li>
              <li>• Seasonal tournaments</li>
              <li>• Play-to-earn OVER rewards</li>
            </ul>
          </div>
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