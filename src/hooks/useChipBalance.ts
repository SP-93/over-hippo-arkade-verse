import { useState, useEffect } from "react";
import { toast } from "sonner";
import { securePlayerService } from "@/services/secure-player";
import { supabase } from "@/integrations/supabase/client";

export const useChipBalance = () => {
  const [playerChips, setPlayerChips] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Load chip balance with new simplified logic
  useEffect(() => {
    const loadChipBalance = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // For authenticated users: ONLY use backend data from player_balances
          console.log('Authenticated user - loading chips from backend');
          const balance = await securePlayerService.getPlayerBalance();
          if (balance) {
            console.log('Backend chips loaded:', balance.gameChips);
            setPlayerChips(balance.gameChips);
            // Clear any old localStorage data to prevent conflicts
            localStorage.removeItem('player_chips');
            localStorage.removeItem('chip_reset_time');
            localStorage.removeItem('first_chip_consumed');
          } else {
            // If backend fails, default to 3 chips
            console.log('Backend failed, defaulting to 3 chips');
            setPlayerChips(3);
          }
        } else {
          // For non-authenticated users: use localStorage with 3 chip default
          console.log('Non-authenticated user - using localStorage');
          const savedChips = localStorage.getItem('player_chips');
          setPlayerChips(savedChips ? parseInt(savedChips) : 3);
        }
      } catch (error) {
        console.error('Failed to load chip balance:', error);
        setPlayerChips(3); // Always default to 3 chips
      } finally {
        setIsLoading(false);
      }
    };

    loadChipBalance();
  }, []);

  // Only save to localStorage for non-authenticated users
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        localStorage.setItem('player_chips', playerChips.toString());
      }
    };
    checkAuth();
  }, [playerChips]);

  const canPlayGame = (gameType: string): boolean => {
    return playerChips > 0;
  };

  // Simplified - no more complex timer logic
  const getTimeUntilReset = (): string => {
    return "24:00:00"; // Static display
  };

  // Each chip gives 2 lives (unchanged)
  const getChipLives = (): number => {
    return 2;
  };

  // Refresh function to reload chips from backend
  const refreshChips = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const balance = await securePlayerService.getPlayerBalance();
      if (balance) {
        console.log('Chips refreshed:', balance.gameChips);
        setPlayerChips(balance.gameChips);
      }
    }
  };

  return {
    playerChips,
    setPlayerChips,
    isLoading,
    canPlayGame,
    getTimeUntilReset,
    getChipLives,
    refreshChips
  };
};
