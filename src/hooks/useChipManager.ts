import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useChipManager = () => {
  const [playerChips, setPlayerChips] = useState(5);
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);
  const [firstChipConsumed, setFirstChipConsumed] = useState(false);

  // Load saved data on mount
  useEffect(() => {
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
  }, []);

  // Save chips to localStorage when changed
  useEffect(() => {
    localStorage.setItem('player_chips', playerChips.toString());
  }, [playerChips]);

  const canPlayGame = (gameType: string): boolean => {
    return playerChips > 0;
  };

  const consumeChip = (gameType: string): boolean => {
    if (!canPlayGame(gameType)) {
      toast.error("Nemate dovoljno chipova za igru!");
      return false;
    }
    
    // Start 24h timer when first chip is consumed
    if (!firstChipConsumed) {
      const now = new Date();
      localStorage.setItem('chip_reset_time', now.toISOString());
      localStorage.setItem('first_chip_consumed', 'true');
      setLastResetTime(now.toISOString());
      setFirstChipConsumed(true);
    }
    
    setPlayerChips(prev => prev - 1);
    toast.success(`Chip potrošen! Imate ${playerChips - 1} chipova preostalo.`);
    return true;
  };

  const getTimeUntilReset = (): string => {
    if (!lastResetTime || !firstChipConsumed) return "Igrajte da pokrenete tajmer";
    
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
    setPlayerChips
  };
};