import { useChipBalance } from "./useChipBalance";
import { useGameSession } from "./useGameSession";

export const useChipManager = () => {
  const {
    playerChips,
    setPlayerChips,
    isLoading,
    canPlayGame,
    getTimeUntilReset,
    getChipLives,
    refreshChips
  } = useChipBalance();

  const {
    startGameSession: originalStartGameSession,
    loseLife,
    endGameSession,
    getCurrentSession
  } = useGameSession();

  // Enhanced startGameSession that refreshes chips after consumption
  const startGameSession = async (gameType: string) => {
    const result = await originalStartGameSession(gameType);
    
    // If chip was consumed, refresh balance from backend
    if (result && result.livesRemaining === 2 && !result.resumed) {
      await refreshChips(); // Use the new refresh function
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
    isLoading,
    refreshChips
  };
};