import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, Timer, Trophy } from "lucide-react";
import { TetrisGame } from "@/components/games/TetrisGame";
import { SnakeGame } from "@/components/games/SnakeGame";
import { PacManGame } from "@/components/games/PacManGame";
import { toast } from "sonner";

export const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameTime, setGameTime] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setGameTime(prev => prev + 1);
        // Simulate score increase
        setCurrentScore(prev => prev + Math.floor(Math.random() * 10));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endGame = () => {
    setGameStatus('finished');
    const finalScore = currentScore;
    toast.success(`Game finished! Final score: ${finalScore.toLocaleString()} points`);
    
    // Simulate adding points to player account
    setTimeout(() => {
      toast.success(`${finalScore} points added to your account!`);
    }, 1000);
  };

  const goBack = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      toast.info("Game paused");
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Game Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Arcade
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {gameId?.charAt(0).toUpperCase() + gameId?.slice(1)}
          </Badge>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-card border-neon-blue">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-neon-blue" />
              <div>
                <p className="text-sm text-muted-foreground">Game Time</p>
                <p className="text-xl font-bold text-neon-blue">{formatTime(gameTime)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-card border-arcade-gold">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-arcade-gold" />
              <div>
                <p className="text-sm text-muted-foreground">Current Score</p>
                <p className="text-xl font-bold text-arcade-gold">{currentScore.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-card border-neon-pink">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-neon-pink" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold text-neon-pink capitalize">{gameStatus}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="w-full">
          {gameId === 'tetris' && (
            <TetrisGame 
              onScoreChange={setCurrentScore}
              onGameEnd={endGame}
            />
          )}
          {gameId === 'snake' && (
            <SnakeGame 
              onScoreChange={setCurrentScore}
              onGameEnd={endGame}
            />
          )}
          {gameId === 'pacman' && (
            <PacManGame 
              onScoreChange={setCurrentScore}
              onGameEnd={endGame}
            />
          )}
          {!['tetris', 'snake', 'pacman'].includes(gameId || '') && (
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
          )}
        </div>

        {/* Game Instructions */}
        <Card className="p-6 bg-gradient-card border-border">
          <h3 className="text-lg font-bold mb-4">Game Instructions</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Use arrow keys to navigate your character</p>
            <p>• Press spacebar for primary actions</p>
            <p>• Score points by completing objectives</p>
            <p>• Higher scores earn more points toward token exchanges</p>
            <p>• Game automatically saves your highest score</p>
          </div>
        </Card>
      </div>
    </div>
  );
};