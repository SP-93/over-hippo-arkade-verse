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
    <div className="min-h-screen bg-gradient-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <GameHeader gameId={gameId} onGoBack={goBack} />
        
        <GameStats 
          gameTime={gameTime}
          currentScore={currentScore}
          gameStatus={gameStatus}
        />

        <div className="w-full">
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