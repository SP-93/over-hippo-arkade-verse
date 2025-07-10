import { useState, useEffect } from "react";
import { useChipManager } from "./useChipManager";
import { toast } from "sonner";

export const useGameManager = () => {
  const [gameTime, setGameTime] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [currentLives, setCurrentLives] = useState(2);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initialize chip manager
  const chipManager = useChipManager();

  // Check for existing session on load
  useEffect(() => {
    const existingSession = chipManager.getCurrentSession();
    if (existingSession && existingSession.livesRemaining > 0) {
      setCurrentSessionId(existingSession.sessionId);
      setCurrentLives(existingSession.livesRemaining);
      setHasGameStarted(true);
      setGameStatus('paused'); // Resume as paused
      toast.info(`Postojeća igra pronađena! Imate ${existingSession.livesRemaining} života.`);
    }
  }, []);

  const loseLife = async (): Promise<boolean> => {
    if (!currentSessionId) {
      return false;
    }

    const result = await chipManager.loseLife(currentSessionId);
    if (!result) {
      return false;
    }

    setCurrentLives(result.livesRemaining);
    
    if (result.gameOver) {
      toast.error("Izgubili ste sve živote! Igra završena.");
      setGameStatus('finished');
      setHasGameStarted(false);
      await chipManager.endGameSession(currentSessionId, currentScore);
      setCurrentSessionId(null);
      return false;
    } else {
      toast.warning(`Izgubili ste život! Ostalo: ${result.livesRemaining}`);
      return true;
    }
  };

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus]);

  const endGame = async () => {
    setGameStatus('finished');
    const finalScore = currentScore;
    
    if (currentSessionId) {
      await chipManager.endGameSession(currentSessionId, finalScore);
      setCurrentSessionId(null);
    }
    
    toast.success(`Game finished! Final score: ${finalScore.toLocaleString()} points`);
    
    // Simulate adding points to player account
    setTimeout(() => {
      toast.success(`${finalScore} points added to your account!`);
    }, 1000);
  };

  const handleGameStart = async (gameId: string): Promise<boolean> => {
    if (!hasGameStarted) {
      if (!chipManager.canPlayGame(gameId)) {
        toast.error("Nemate dovoljno chipova za igru!");
        return false;
      }
      
      const sessionResult = await chipManager.startGameSession(gameId);
      if (sessionResult) {
        setCurrentSessionId(sessionResult.sessionId || null);
        setCurrentLives(sessionResult.livesRemaining);
        setHasGameStarted(true);
        setGameStatus('playing');
        return true;
      }
      return false;
    }
    return true;
  };

  const resetLives = () => {
    setCurrentLives(2);
  };

  const pauseGame = () => {
    setGameStatus('paused');
    toast.info("Game paused");
  };

  return {
    gameTime,
    currentScore,
    gameStatus,
    playerChips: chipManager.playerChips,
    hasGameStarted,
    currentLives,
    chipManager,
    setCurrentScore,
    setGameStatus,
    endGame,
    handleGameStart,
    pauseGame,
    loseLife,
    resetLives
  };
};