import { useState, useEffect } from 'react';
import { useGlobalBalance } from '@/contexts/GlobalBalanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WoverTransaction {
  id: string;
  wover_amount: number;
  transaction_type: string;
  transaction_hash?: string;
  status: string;
  created_at: string;
  feature_type?: string;
  metadata?: any;
}

export const useWoverBalance = () => {
  const { user } = useAuth();
  const { woverBalance, refreshBalance } = useGlobalBalance();
  const [transactions, setTransactions] = useState<WoverTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch WOVER transaction history
  const fetchWoverTransactions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wover_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch WOVER transactions:', error);
      toast.error('Failed to load WOVER transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  // Add WOVER balance (for testing or admin purposes)
  const addWoverBalance = async (amount: number) => {
    if (!user) {
      toast.error('Authentication required');
      return false;
    }

    try {
      // For now, we'll add this as a manual transaction
      // In production, this would come from blockchain WOVER contract
      const { error } = await supabase
        .from('wover_transactions')
        .insert({
          user_id: user.id,
          wover_amount: amount,
          transaction_type: 'manual_add',
          status: 'completed',
          feature_type: 'balance_adjustment'
        });

      if (error) throw error;

      // Update the balance in player_balances
      const { error: balanceError } = await supabase.rpc('atomic_balance_operation', {
        p_operation_type: 'add_wover',
        p_amount: 0,
        p_over_amount: amount,
        p_transaction_ref: `wover_add_${Date.now()}`
      });

      if (balanceError) throw balanceError;

      toast.success(`Added ${amount} WOVER to your balance`);
      await refreshBalance();
      await fetchWoverTransactions();
      return true;
    } catch (error) {
      console.error('Failed to add WOVER balance:', error);
      toast.error('Failed to add WOVER balance');
      return false;
    }
  };

  // Convert OVER to WOVER (1:1 ratio for now)
  const convertOverToWover = async (overAmount: number) => {
    if (!user) {
      toast.error('Authentication required');
      return false;
    }

    try {
      // First, check if user has enough OVER
      const { data: balance } = await supabase.rpc('get_secure_wallet_balance');
      
      if (!balance || typeof balance !== 'object' || !('success' in balance) || 
          !balance.success || !('over_balance' in balance) || 
          (balance.over_balance as number) < overAmount) {
        toast.error('Insufficient OVER balance for conversion');
        return false;
      }

      // Deduct OVER and add WOVER
      const { error: deductError } = await supabase.rpc('atomic_balance_operation', {
        p_operation_type: 'spend_over',
        p_amount: 0,
        p_over_amount: overAmount,
        p_transaction_ref: `over_to_wover_${Date.now()}`
      });

      if (deductError) throw deductError;

      // Add WOVER
      const { error: addError } = await supabase.rpc('atomic_balance_operation', {
        p_operation_type: 'add_wover',
        p_amount: 0,
        p_over_amount: overAmount,
        p_transaction_ref: `wover_conversion_${Date.now()}`
      });

      if (addError) throw addError;

      // Record the conversion transaction
      const { error: transactionError } = await supabase
        .from('wover_transactions')
        .insert({
          user_id: user.id,
          wover_amount: overAmount,
          transaction_type: 'over_conversion',
          status: 'completed',
          feature_type: 'currency_conversion',
          metadata: { original_over_amount: overAmount, conversion_rate: 1 }
        });

      if (transactionError) throw transactionError;

      toast.success(`Converted ${overAmount} OVER to ${overAmount} WOVER`);
      await refreshBalance();
      await fetchWoverTransactions();
      return true;
    } catch (error) {
      console.error('Failed to convert OVER to WOVER:', error);
      toast.error('Failed to convert OVER to WOVER');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchWoverTransactions();
    }
  }, [user]);

  return {
    woverBalance,
    transactions,
    isLoading,
    addWoverBalance,
    convertOverToWover,
    refreshTransactions: fetchWoverTransactions
  };
};