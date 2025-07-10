import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  activeTournaments: number;
  totalChipsInCirculation: number;
}

export interface AdminTransaction {
  id: string;
  wallet_address: string;
  transaction_hash: string;
  transaction_type: string;
  amount_over: number;
  amount_chips: number;
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    wallet_address: string;
  };
}

export class SecureAdminService {
  
  // Check if current user is admin
  async checkAdminStatus(): Promise<{ isAdmin: boolean; wallet?: string }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return { isAdmin: false };
      }

      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'check_admin' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Admin check failed:', error);
      return { isAdmin: false };
    }
  }

  // Get platform statistics (admin only)
  async getPlatformStats(): Promise<AdminStats | null> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Stats fetch failed:', error);
      return null;
    }
  }

  // Update user balance (admin only)
  async updateUserBalance(userId: string, chips?: number, over?: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'update_user_balance',
          user_id: userId,
          chip_amount: chips,
          over_amount: over
        }
      });

      if (error) throw error;
      
      if (data.success) {
        // Trigger balance update events if the updated user is the current admin
        const { data: session } = await supabase.auth.getSession();
        if (session.session?.user?.id === userId) {
          console.log('🔄 ADMIN: Updated own balance, triggering refresh');
          await this.forceRefreshBalances();
        }
      }
      
      return data.success;
    } catch (error) {
      console.error('User balance update failed:', error);
      return false;
    }
  }

  // Withdraw funds to admin wallet (admin only)
  async withdrawFunds(amount: number): Promise<{ success: boolean; txHash?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'withdraw_funds',
          withdrawal_amount: amount
        }
      });

      if (error) throw error;
      return { success: true, txHash: data.txHash };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return { success: false };
    }
  }

  // Get all transactions (admin only)
  async getAllTransactions(): Promise<AdminTransaction[]> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_transactions' }
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Transactions fetch failed:', error);
      return [];
    }
  }

  // Add chips to admin's own account
  async addChipsToSelf(chipAmount: number): Promise<boolean> {
    try {
      console.log('🎯 FRONTEND: Starting addChipsToSelf with amount:', chipAmount);
      
      // First check session
      const { data: session } = await supabase.auth.getSession();
      console.log('🔐 FRONTEND: Current session:', !!session.session, session.session?.user?.id);
      
      if (!session.session) {
        throw new Error('No authenticated session found');
      }
      
      const requestData = { 
        action: 'add_chips_to_self',
        chip_amount: chipAmount
      };
      
      console.log('📤 FRONTEND: Calling edge function with data:', requestData);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: requestData
      });

      console.log('📥 FRONTEND: Edge function response:', { data, error });

      if (error) {
        console.error('❌ FRONTEND: Edge function error:', error);
        throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
      }

      if (data?.success) {
        console.log('✅ FRONTEND: Chips added successfully:', data);
        
        // 🔥 CRITICAL: Trigger balance update events to sync UI
        console.log('🔄 FRONTEND: Triggering balance update events');
        window.dispatchEvent(new Event('balanceUpdated'));
        window.dispatchEvent(new Event('chipBalanceUpdated'));
        window.dispatchEvent(new CustomEvent('adminBalanceUpdated', { 
          detail: { 
            chipAmount, 
            newBalance: data.new_balance,
            previousBalance: data.previous_balance 
          }
        }));
        
        return true;
      } else {
        console.error('❌ FRONTEND: Add chips failed - invalid response:', data);
        throw new Error(data?.error || data?.message || 'Failed to add chips - invalid response');
      }
    } catch (error) {
      console.error('💥 FRONTEND: Add chips operation failed:', error);
      throw error;
    }
  }

  // Force refresh all balance-related UI components
  async forceRefreshBalances(): Promise<void> {
    console.log('🔄 ADMIN: Force refreshing all balances');
    window.dispatchEvent(new Event('balanceUpdated'));
    window.dispatchEvent(new Event('chipBalanceUpdated'));
    window.dispatchEvent(new Event('forceBalanceRefresh'));
  }

  // Get users list for admin panel
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Users fetch failed:', error);
      return [];
    }
  }
}

export const secureAdminService = new SecureAdminService();