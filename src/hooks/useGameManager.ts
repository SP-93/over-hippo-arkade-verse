import { useState, useEffect } from "react";
import { ChipManager } from "@/components/ChipManager";
import { toast } from "sonner";

export const useGameManager = () => {
  const [gameTime, setGameTime] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [playerChips, setPlayerChips] = useState(5);
  const [hasGameStarted, setHasGameStarted] = useState(false);

  // Initialize chip manager
  const chipManager = ChipManager({ playerChips, onChipChange: setPlayerChips });

  // Load player chips from localStorage
  useEffect(() => {
    const savedChips = localStorage.getItem('player_chips');
    if (savedChips) {
      setPlayerChips(parseInt(savedChips));
    }
  }, []);

  // Save chips to localStorage when changed
  useEffect(() => {
    localStorage.setItem('player_chips', playerChips.toString());
  }, [playerChips]);

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
        toast.success("Chip je potrošen! Uživajte u igri!");
        setHasGameStarted(true);
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
    playerChips,
    hasGameStarted,
    setCurrentScore,
    setGameStatus,
    endGame,
    handleGameStart,
    pauseGame
  };
};