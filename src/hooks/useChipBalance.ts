import { useState, useEffect } from "react";
import { toast } from "sonner";
import { securePlayerService } from "@/services/secure-player";
import { supabase } from "@/integrations/supabase/client";

export const useChipBalance = () => {
  const [playerChips, setPlayerChips] = useState(3);
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);
  const [firstChipConsumed, setFirstChipConsumed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load chip balance (only after authentication)
  useEffect(() => {
    const loadChipBalance = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated first
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Only try to load from backend if authenticated
          const balance = await securePlayerService.getPlayerBalance();
          if (balance) {
            setPlayerChips(balance.gameChips);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to localStorage (for non-authenticated users)
        const savedChips = localStorage.getItem('player_chips');
        const savedResetTime = localStorage.getItem('chip_reset_time');
        const chipConsumed = localStorage.getItem('first_chip_consumed') === 'true';
        
        if (savedChips) {
          setPlayerChips(parseInt(savedChips));
        } else {
          // New default is 3 chips instead of 5
          setPlayerChips(3);
        }
        
        setFirstChipConsumed(chipConsumed);
        
        if (savedResetTime && chipConsumed) {
          const resetTime = new Date(savedResetTime);
          const now = new Date();
          const timeDiff = now.getTime() - resetTime.getTime();
          const hoursElapsed = timeDiff / (1000 * 60 * 60);
          
          if (hoursElapsed >= 24) {
            // Reset chips to 3 after 24 hours (new monetization model)
            setPlayerChips(3);
            localStorage.setItem('player_chips', '3');
            localStorage.removeItem('chip_reset_time');
            localStorage.removeItem('first_chip_consumed');
            setLastResetTime(null);
            setFirstChipConsumed(false);
            toast.success("Chips reset! You have 3 new chips!");
          } else {
            setLastResetTime(savedResetTime);
          }
        }
      } catch (error) {
        console.error('Failed to load chip balance:', error);
        // Set default values (reduced from 5 to 3)
        setPlayerChips(3);
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

  // Each chip gives 2 lives
  const getChipLives = (): number => {
    return 2;
  };

  return {
    playerChips,
    setPlayerChips,
    isLoading,
    canPlayGame,
    getTimeUntilReset,
    getChipLives
  };
};