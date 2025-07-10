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
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'add_chips_to_self',
          chip_amount: chipAmount
        }
      });

      if (error) {
        console.error('Add chips error:', error);
        throw error;
      }

      if (data.success) {
        console.log('Chips added successfully:', data);
        return true;
      } else {
        console.error('Add chips failed:', data);
        throw new Error(data.error || 'Failed to add chips');
      }
    } catch (error) {
      console.error('Add chips operation failed:', error);
      throw error;
    }
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