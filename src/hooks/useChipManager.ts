import { useSecureBalance } from "./useSecureBalance";
import { useGameSession } from "./useGameSession";
import { secureBalanceService } from "@/services/secure-balance";
import { toast } from "sonner";

export const useChipManager = () => {
  const {
    gameChips: playerChips,
    isLoading,
    canPlayGame,
    refreshBalance: refreshChips
  } = useSecureBalance();

  const {
    startGameSession: originalStartGameSession,
    loseLife,
    endGameSession,
    getCurrentSession
  } = useGameSession();

  // Enhanced startGameSession with secure balance operations
  const startGameSession = async (gameType: string) => {
    console.log(`🎮 Starting game session for: ${gameType}`);
    
    // First check if user can afford the game
    const canAfford = await secureBalanceService.canAfford(1);
    if (!canAfford) {
      console.log('❌ Cannot afford game - insufficient chips');
      toast.error("Not enough chips to play!");
      return null;
    }

    // Spend chip securely before starting session
    const spendResult = await secureBalanceService.spendChip(1, gameType);
    if (!spendResult.success) {
      console.error('❌ Failed to spend chip:', spendResult.error);
      
      if (spendResult.error_type === 'insufficient_funds') {
        toast.error("Not enough chips to play!");
      } else if (spendResult.error_type === 'operation_locked') {
        toast.error("Another operation in progress, please wait");
      } else {
        toast.error("Failed to start game: " + spendResult.error);
      }
      return null;
    }

    console.log('✅ Chip spent successfully:', spendResult);
    toast.success(`Chip consumed! Previous: ${spendResult.previous_chips}, New: ${spendResult.new_chips}`);

    // Now start the actual game session
    const result = await originalStartGameSession(gameType);
    
    // Force immediate refresh of balance to sync UI
    await refreshChips();
    
    // Trigger global balance refresh events
    window.dispatchEvent(new Event('balanceUpdated'));
    window.dispatchEvent(new Event('forceBalanceRefresh'));
    
    return result;
  };

  const consumeChip = async (gameType: string): Promise<boolean> => {
    const result = await startGameSession(gameType);
    return result !== null;
  };

  // Simple utility functions for backwards compatibility
  const getTimeUntilReset = (): string => "24:00:00";
  const getChipLives = (): number => 2;

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
    setPlayerChips: () => {}, // No-op since we use secure balance
    isLoading,
    refreshChips
  };
};