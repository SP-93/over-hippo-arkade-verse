import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameGrid } from '@/components/GameGrid';
import { useGlobalBalance } from '@/contexts/GlobalBalanceContext';

export const Games: React.FC = () => {
  const navigate = useNavigate();
  const { gameChips } = useGlobalBalance();

  const handlePlayGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Arcade Games
        </h1>
        <p className="text-muted-foreground">
          Choose your favorite retro game and start earning OVER tokens
        </p>
      </div>

      {/* Game Grid */}
      <GameGrid 
        playerChips={gameChips} 
        onPlayGame={handlePlayGame} 
      />
    </div>
  );
};