import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameHeader } from "@/components/game/GameHeader";
import { GameStats } from "@/components/game/GameStats";
import { GameRouter } from "@/components/game/GameRouter";
import { GameInstructions } from "@/components/game/GameInstructions";
import { useGameManager } from "@/hooks/useGameManager";

export const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const {
    gameTime,
    currentScore,
    gameStatus,
    setCurrentScore,
    setGameStatus,
    endGame,
    handleGameStart,
    pauseGame
  } = useGameManager();

  const goBack = () => {
    if (gameStatus === 'playing') {
      pauseGame();
    }
    navigate('/');
  };

  const onGameStart = () => handleGameStart(gameId || '');

  return (
    <div className="min-h-screen max-w-screen-2xl mx-auto bg-gradient-bg p-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        <GameHeader gameId={gameId} onGoBack={goBack} />
        
        <GameStats 
          gameTime={gameTime}
          currentScore={currentScore}
          gameStatus={gameStatus}
        />

        <div className="w-full max-w-4xl mx-auto">
          <GameRouter 
            gameId={gameId}
            onScoreChange={setCurrentScore}
            onGameEnd={endGame}
            onGameStart={onGameStart}
          />
        </div>

        <GameInstructions />
      </div>
    </div>
  );
};