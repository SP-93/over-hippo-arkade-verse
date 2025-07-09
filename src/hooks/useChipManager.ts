import { useState, useEffect } from "react";
import { toast } from "sonner";
import { securePlayerService } from "@/services/secure-player";

export const useChipManager = () => {
  const [playerChips, setPlayerChips] = useState(5);
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);
  const [firstChipConsumed, setFirstChipConsumed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load real chip balance from database
  useEffect(() => {
    const loadChipBalance = async () => {
      setIsLoading(true);
      try {
        const balance = await securePlayerService.getPlayerBalance();
        if (balance) {
          setPlayerChips(balance.gameChips);
        }
      } catch (error) {
        console.error('Failed to load chip balance:', error);
        // Fallback to localStorage
        const savedChips = localStorage.getItem('player_chips');
        const savedResetTime = localStorage.getItem('chip_reset_time');
        const chipConsumed = localStorage.getItem('first_chip_consumed') === 'true';
        
        if (savedChips) {
          setPlayerChips(parseInt(savedChips));
        }
        
        setFirstChipConsumed(chipConsumed);
        
        if (savedResetTime && chipConsumed) {
          const resetTime = new Date(savedResetTime);
          const now = new Date();
          const timeDiff = now.getTime() - resetTime.getTime();
          const hoursElapsed = timeDiff / (1000 * 60 * 60);
          
          if (hoursElapsed >= 24) {
            // Reset chips to 5 after 24 hours
            setPlayerChips(5);
            localStorage.setItem('player_chips', '5');
            localStorage.removeItem('chip_reset_time');
            localStorage.removeItem('first_chip_consumed');
            setLastResetTime(null);
            setFirstChipConsumed(false);
            toast.success("Chips reset! You have 5 new chips!");
          } else {
            setLastResetTime(savedResetTime);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChipBalance();
  }, []);

  // Save chips to localStorage as backup
  useEffect(() => {
    localStorage.setItem('player_chips', playerChips.toString());
  }, [playerChips]);

  const canPlayGame = (gameType: string): boolean => {
    return playerChips > 0;
  };

  const consumeChip = async (gameType: string): Promise<boolean> => {
    if (!canPlayGame(gameType)) {
      toast.error("Not enough chips to play!");
      return false;
    }
    
    try {
      // In a real implementation, this would call the backend to consume a chip
      // For now, just update locally
      
      // Start 24h timer when first chip is consumed
      if (!firstChipConsumed) {
        const now = new Date();
        localStorage.setItem('chip_reset_time', now.toISOString());
        localStorage.setItem('first_chip_consumed', 'true');
        setLastResetTime(now.toISOString());
        setFirstChipConsumed(true);
      }
      
      setPlayerChips(prev => prev - 1);
      toast.success(`Chip consumed! You have ${playerChips - 1} chips remaining.`);
      return true;
    } catch (error) {
      console.error('Failed to consume chip:', error);
      toast.error("Failed to consume chip");
      return false;
    }
  };

  const getTimeUntilReset = (): string => {
    if (!lastResetTime || !firstChipConsumed) return "Play to start timer";
    
    const resetTime = new Date(lastResetTime);
    const nextReset = new Date(resetTime.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    const timeDiff = nextReset.getTime() - now.getTime();
    
    if (timeDiff <= 0) return "00:00:00";
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Each chip gives 3 lives
  const getChipLives = (): number => {
    return 3;
  };

  return {
    playerChips,
    canPlayGame,
    consumeChip,
    getTimeUntilReset,
    getChipLives,
    setPlayerChips,
    isLoading
  };
};