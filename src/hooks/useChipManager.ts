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

  // Enhanced startGameSession that updates local chip count and refreshes from backend
  const startGameSession = async (gameType: string) => {
    const result = await originalStartGameSession(gameType);
    
    // If chip was consumed, refresh balance from backend to get accurate count
    if (result && result.livesRemaining === 2 && !result.resumed) {
      try {
        const balance = await require('@/services/secure-player').securePlayerService.getPlayerBalance();
        if (balance) {
          console.log('Refreshed chips after game start:', balance.gameChips);
          setPlayerChips(balance.gameChips);
        } else {
          // Fallback to local decrement if backend fails
          setPlayerChips(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Failed to refresh balance after game start:', error);
        setPlayerChips(prev => Math.max(0, prev - 1));
      }
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