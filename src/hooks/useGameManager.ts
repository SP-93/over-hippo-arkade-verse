import { useState, useEffect } from "react";
import { useChipManager } from "./useChipManager";
import { toast } from "sonner";

export const useGameManager = () => {
  const [gameTime, setGameTime] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [currentLives, setCurrentLives] = useState(1);

  // Initialize chip manager
  const chipManager = useChipManager();

  // Reset lives when new game starts
  const resetLives = () => {
    setCurrentLives(chipManager.getChipLives());
  };

  const loseLife = (): boolean => {
    const newLives = currentLives - 1;
    setCurrentLives(newLives);
    
    if (newLives <= 0) {
      toast.error("Izgubili ste sve živote! Igra završena.");
      setGameStatus('finished');
      setHasGameStarted(false);
      return false;
    } else {
      toast.warning(`Izgubili ste život! Ostalo: ${newLives}`);
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

  const endGame = () => {
    setGameStatus('finished');
    const finalScore = currentScore;
    toast.success(`Game finished! Final score: ${finalScore.toLocaleString()} points`);
    
    // Simulate adding points to player account
    setTimeout(() => {
      toast.success(`${finalScore} points added to your account!`);
    }, 1000);
  };

  const handleGameStart = (gameId: string) => {
    if (!hasGameStarted) {
      if (!chipManager.canPlayGame(gameId)) {
        toast.error("Nemate dovoljno chipova za igru!");
        return false;
      }
      
      if (chipManager.consumeChip(gameId)) {
        resetLives();
        toast.success(`Chip potrošen! Imate ${chipManager.getChipLives()} život za igru!`);
        setHasGameStarted(true);
        setGameStatus('playing');
        return true;
      }
      return false;
    }
    return true;
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