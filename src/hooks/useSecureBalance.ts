import { useState, useEffect } from "react";
import { toast } from "sonner";
import { secureBalanceService, BalanceInfo } from "@/services/secure-balance";
import { supabase } from "@/integrations/supabase/client";

export const useSecureBalance = () => {
  const [balance, setBalance] = useState<BalanceInfo>({
    success: false,
    has_wallet: false,
    game_chips: 0,
    over_balance: 0,
    total_earnings: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load balance securely
  const loadBalance = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('🔐 Loading secure balance for authenticated user');
        const balanceData = await secureBalanceService.getBalance();
        setBalance(balanceData);
        
        if (!balanceData.success && balanceData.error) {
          console.error('❌ Balance load failed:', balanceData.error);
        }
      } else {
        console.log('👤 No authenticated user - using default balance');
        // For non-authenticated users, show default state
        setBalance({
          success: false,
          has_wallet: false,
          game_chips: 3, // Default chips for non-authenticated users
          over_balance: 0,
          total_earnings: 0
        });
      }
    } catch (error) {
      console.error('💥 Failed to load secure balance:', error);
      setBalance({
        success: false,
        has_wallet: false,
        game_chips: 3,
        over_balance: 0,
        total_earnings: 0,
        error: 'Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBalance();

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      console.log('🔄 Balance update event received - reloading');
      loadBalance();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('chipBalanceUpdated', handleBalanceUpdate); // Legacy compatibility
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('chipBalanceUpdated', handleBalanceUpdate);
    };
  }, []);

  // Chip operations
  const spendChip = async (amount: number = 1, gameType?: string) => {
    const result = await secureBalanceService.spendChip(amount, gameType);
    if (result.success) {
      // Update local state and trigger refresh
      setBalance(prev => ({
        ...prev,
        game_chips: result.new_chips || prev.game_chips
      }));
      
      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));
    }
    return result;
  };

  const addChips = async (amount: number, transactionRef?: string) => {
    const result = await secureBalanceService.addChips(amount, transactionRef);
    if (result.success) {
      // Update local state and trigger refresh
      setBalance(prev => ({
        ...prev,
        game_chips: result.new_chips || prev.game_chips
      }));
      
      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));
    }
    return result;
  };

  const spendOver = async (amount: number, purpose?: string) => {
    const result = await secureBalanceService.spendOver(amount, purpose);
    if (result.success) {
      // Update local state and trigger refresh
      setBalance(prev => ({
        ...prev,
        over_balance: result.new_over || prev.over_balance
      }));
      
      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));
    }
    return result;
  };

  const addOver = async (amount: number, transactionRef?: string) => {
    const result = await secureBalanceService.addOver(amount, transactionRef);
    if (result.success) {
      // Update local state and trigger refresh
      setBalance(prev => ({
        ...prev,
        over_balance: result.new_over || prev.over_balance
      }));
      
      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));
    }
    return result;
  };

  // Utility functions
  const canAfford = async (chips?: number, overAmount?: number) => {
    return await secureBalanceService.canAfford(chips, overAmount);
  };

  const canPlayGame = (gameType: string): boolean => {
    return balance.game_chips > 0;
  };

  const refreshBalance = async () => {
    await loadBalance();
  };

  return {
    // Balance data
    balance,
    isLoading,
    
    // Quick access to individual values
    gameChips: balance.game_chips,
    overBalance: balance.over_balance,
    totalEarnings: balance.total_earnings,
    hasWallet: balance.has_wallet,
    
    // Operations
    spendChip,
    addChips,
    spendOver,
    addOver,
    
    // Utilities
    canAfford,
    canPlayGame,
    refreshBalance,
    loadBalance
  };
};