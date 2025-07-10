import { useState, useEffect } from "react";
import { toast } from "sonner";
import { secureBalanceService } from "@/services/secure-balance";
import { supabase } from "@/integrations/supabase/client";

export const useChipBalance = () => {
  const [playerChips, setPlayerChips] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Load chip balance using secure service
  useEffect(() => {
    const loadChipBalance = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // For authenticated users: use secure balance service
          console.log('🔐 Authenticated user - loading chips from secure service');
          const balance = await secureBalanceService.getBalance();
          
          if (balance.success && balance.has_wallet) {
            console.log('✅ Secure chips loaded:', balance.game_chips);
            setPlayerChips(balance.game_chips);
            // Clear any old localStorage data to prevent conflicts
            localStorage.removeItem('player_chips');
            localStorage.removeItem('chip_reset_time');
            localStorage.removeItem('first_chip_consumed');
          } else {
            // If secure service fails, default to 3 chips
            console.log('⚠️ Secure service failed, defaulting to 3 chips:', balance.error);
            setPlayerChips(3);
            if (balance.error) {
              toast.error("Failed to load balance: " + balance.error);
            }
          }
        } else {
          // For non-authenticated users: use localStorage with 3 chip default
          console.log('👤 Non-authenticated user - using localStorage');
          const savedChips = localStorage.getItem('player_chips');
          setPlayerChips(savedChips ? parseInt(savedChips) : 3);
        }
      } catch (error) {
        console.error('💥 Failed to load chip balance:', error);
        setPlayerChips(3); // Always default to 3 chips
        toast.error("Error loading balance");
      } finally {
        setIsLoading(false);
      }
    };

    loadChipBalance();

    // Listen for chip balance updates
    const handleChipUpdate = () => {
      console.log('🔄 Chip balance update event received');
      loadChipBalance();
    };

    window.addEventListener('chipBalanceUpdated', handleChipUpdate);
    
    return () => {
      window.removeEventListener('chipBalanceUpdated', handleChipUpdate);
    };
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

  // Refresh function to reload chips from secure service
  const refreshChips = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('🔄 Refreshing chips via secure service');
      const balance = await secureBalanceService.getBalance();
      if (balance.success && balance.has_wallet) {
        console.log('✅ Chips refreshed:', balance.game_chips);
        setPlayerChips(balance.game_chips);
      } else {
        console.error('❌ Chip refresh failed:', balance.error);
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
