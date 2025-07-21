import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { secureBalanceService, BalanceInfo } from "@/services/secure-balance";
import { supabase } from "@/integrations/supabase/client";

export const useSecureBalance = () => {
  const [balance, setBalance] = useState<BalanceInfo>(() => ({
    success: false,
    has_wallet: false,
    game_chips: 0,
    wover_balance: 0,
    total_earnings: 0
  }));
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
          wover_balance: 0,
          total_earnings: 0
        });
      }
    } catch (error) {
      console.error('💥 Failed to load secure balance:', error);
      setBalance({
        success: false,
        has_wallet: false,
        game_chips: 3,
        wover_balance: 0,
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

    const handleForceRefresh = () => {
      console.log('🔄 Force balance refresh event received');
      loadBalance();
    };

    const handleAdminBalanceUpdate = (event: any) => {
      console.log('🔄 Admin balance update event received:', event.detail);
      loadBalance();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('chipBalanceUpdated', handleBalanceUpdate); // Legacy compatibility
    window.addEventListener('forceBalanceRefresh', handleForceRefresh);
    window.addEventListener('adminBalanceUpdated', handleAdminBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('chipBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('forceBalanceRefresh', handleForceRefresh);
      window.removeEventListener('adminBalanceUpdated', handleAdminBalanceUpdate);
    };
  }, []);

  // Real-time synchronization with Supabase
  useEffect(() => {
    const setupRealtimeListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get user's wallet address
      const getUserWallet = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('verified_wallet_address')
          .eq('user_id', session.user.id)
          .single();
        
        return profile?.verified_wallet_address;
      };

      const walletAddress = await getUserWallet();
      if (!walletAddress) return;

      console.log('🔄 Setting up realtime listener for wallet:', walletAddress);
      
      const channel = supabase
        .channel('balance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'player_balances',
            filter: `wallet_address=eq.${walletAddress}`
          },
          (payload) => {
            console.log('🔄 Realtime balance change detected:', payload);
            loadBalance();
          }
        )
        .subscribe();

      return () => {
        console.log('🔄 Cleaning up realtime listener');
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeListener();
  }, []);

  // Chip operations
  const spendChip = useCallback(async (amount: number = 1, gameType?: string): Promise<any> => {
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
  }, []);

  const addChips = useCallback(async (amount: number, transactionRef?: string): Promise<any> => {
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
  }, []);

  // Buy chips with WOVER tokens
  const buyChipsWithWover = useCallback(async (chipAmount: number, woverCost: number, isVip: boolean = false): Promise<any> => {
    const result = await secureBalanceService.buyChipsWithWover(chipAmount, woverCost, isVip);
    
    if (result.success) {
      setBalance(prev => ({
        ...prev,
        game_chips: result.new_chips || prev.game_chips,
        wover_balance: result.new_wover || prev.wover_balance
      }));
      
      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));
    }
    
    return result;
  }, []);

  // Check if user can afford an operation
  const canAfford = useCallback(async (chips?: number, woverAmount?: number): Promise<any> => {
    return await secureBalanceService.canAfford(chips, woverAmount);
  }, []);

  const canPlayGame = useCallback((gameType: string): boolean => {
    return balance.game_chips > 0;
  }, [balance.game_chips]);

  const refreshBalance = useCallback(async () => {
    await loadBalance();
  }, []);

  return {
    // Balance data
    balance,
    isLoading,
    
    // Individual balance values for convenience
    gameChips: balance.game_chips,
    woverBalance: balance.wover_balance,
    totalEarnings: balance.total_earnings,
    hasWallet: balance.has_wallet,
    
    // Operations
    spendChip,
    addChips,
    buyChipsWithWover,
    canAfford,
    
    // Utilities
    canPlayGame,
    refreshBalance,
    loadBalance
  };
};