import { useChipBalance } from "./useChipBalance";
import { useGameSession } from "./useGameSession";

export const useChipManager = () => {
  const {
    playerChips,
    setPlayerChips,
    isLoading,
    canPlayGame,
    getTimeUntilReset,
    getChipLives
  } = useChipBalance();

  const {
    startGameSession: originalStartGameSession,
    loseLife,
    endGameSession,
    getCurrentSession
  } = useGameSession();

  // Enhanced startGameSession that updates local chip count
  const startGameSession = async (gameType: string) => {
    const result = await originalStartGameSession(gameType);
    
    // Update local chip count if chip was consumed
    if (result && result.livesRemaining === 2 && !result.resumed) {
      setPlayerChips(prev => Math.max(0, prev - 1));
    }
    
    return result;
  };

  const consumeChip = async (gameType: string): Promise<boolean> => {
    const result = await startGameSession(gameType);
    return result !== null;
  };

  return {
    playerChips,
    canPlayGame,
    consumeChip,
    startGameSession,
    loseLife,
    endGameSession,
    getCurrentSession,
    getTimeUntilReset,
    getChipLives,
    setPlayerChips,
    isLoading
  };
};