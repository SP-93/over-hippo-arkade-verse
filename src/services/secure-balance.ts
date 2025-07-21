import { supabase } from "@/integrations/supabase/client";
import { sanitizeOperationInput, checkRateLimit } from "@/utils/inputSanitization";
import { securityEscalationService } from './security-escalation';

export interface BalanceInfo {
  success: boolean;
  has_wallet: boolean;
  wallet_address?: string;
  game_chips: number;
  wover_balance: number;
  total_earnings: number;
  last_updated?: string;
  error?: string;
}

export interface BalanceOperationResult {
  success: boolean;
  previous_chips?: number;
  new_chips?: number;
  previous_wover?: number;
  new_wover?: number;
  operation_type?: string;
  wallet_address?: string;
  error?: string;
  error_type?: 'insufficient_funds' | 'operation_locked' | 'other';
}

export class SecureBalanceService {
  
  // Get wallet balance securely
  async getBalance(): Promise<BalanceInfo> {
    try {
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { action: 'get_balance' }
      });

      if (error) {
        console.error('❌ Balance fetch failed:', error);
        return {
          success: false,
          has_wallet: false,
          game_chips: 0,
          wover_balance: 0,
          total_earnings: 0,
          error: error.message || 'Failed to fetch balance'
        };
      }

      return {
        success: data.success || false,
        has_wallet: data.has_wallet || false,
        wallet_address: data.wallet_address,
        game_chips: data.game_chips || 0,
        wover_balance: data.wover_balance || 0,
        total_earnings: data.total_earnings || 0,
        last_updated: data.last_updated,
        error: data.error
      };
    } catch (error) {
      console.error('💥 Balance service error:', error);
      return {
        success: false,
        has_wallet: false,
        game_chips: 0,
        wover_balance: 0,
        total_earnings: 0,
        error: 'Network error'
      };
    }
  }

  // Spend chip securely (for game sessions)
  async spendChip(amount: number = 1, gameType?: string): Promise<BalanceOperationResult> {
    try {
      // Rate limiting check
      if (!checkRateLimit('spend_chip', 10, 60000)) {
        const currentUser = await this.getCurrentUserWallet();
        if (currentUser) {
          await securityEscalationService.checkRateLimitEscalation(currentUser, 'spend_chip', 10);
        }
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          error_type: 'operation_locked'
        };
      }

      const sanitized = sanitizeOperationInput({ amount, gameType });
      console.log(`🎯 Spending ${sanitized.amount} chip(s) for game:`, sanitized.gameType);
      
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { 
          action: 'spend_chip',
          amount: sanitized.amount,
          game_type: sanitized.gameType,
          transaction_ref: `game_start_${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ Chip spend failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to spend chip',
          error_type: this.getErrorType(error.message || '')
        };
      }

      console.log('✅ Chip spent successfully:', data);
      return {
        success: data.success || false,
        previous_chips: data.previous_chips,
        new_chips: data.new_chips,
        previous_wover: data.previous_wover,
        new_wover: data.new_wover,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 Chip spend error:', error);
      
      const currentUser = await this.getCurrentUserWallet();
      if (currentUser) {
        await securityEscalationService.checkFailedAttemptsEscalation(currentUser, 'spend_chip');
        await securityEscalationService.detectSuspiciousPatterns(currentUser, {
          operationType: 'spend_chip',
          amount,
          gameType,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return {
        success: false,
        error: 'Network error',
        error_type: 'other'
      };
    }
  }

  // Add chips securely (for purchases)
  async addChips(amount: number, transactionRef?: string): Promise<BalanceOperationResult> {
    try {
      if (!checkRateLimit('add_chips', 5, 60000)) {
        const currentUser = await this.getCurrentUserWallet();
        if (currentUser) {
          await securityEscalationService.checkRateLimitEscalation(currentUser, 'add_chips', 5);
        }
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          error_type: 'operation_locked'
        };
      }

      const sanitized = sanitizeOperationInput({ amount, transactionRef });
      console.log(`🎯 Adding ${sanitized.amount} chip(s)`);
      
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { 
          action: 'add_chips',
          amount: sanitized.amount,
          transaction_ref: sanitized.transactionRef || `chip_purchase_${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ Chip add failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to add chips',
          error_type: this.getErrorType(error.message || '')
        };
      }

      console.log('✅ Chips added successfully:', data);
      return {
        success: data.success || false,
        previous_chips: data.previous_chips,
        new_chips: data.new_chips,
        previous_wover: data.previous_wover,
        new_wover: data.new_wover,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 Chip add error:', error);
      
      const currentUser = await this.getCurrentUserWallet();
      if (currentUser) {
        await securityEscalationService.checkFailedAttemptsEscalation(currentUser, 'add_chips');
        await securityEscalationService.detectSuspiciousPatterns(currentUser, {
          operationType: 'add_chips',
          amount,
          transactionRef,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return {
        success: false,
        error: 'Network error',
        error_type: 'other'
      };
    }
  }

  // Buy chips with WOVER tokens
  async buyChipsWithWover(chipAmount: number, woverCost: number, isVip: boolean = false): Promise<BalanceOperationResult> {
    try {
      if (!checkRateLimit('buy_chips_wover', 5, 60000)) {
        const currentUser = await this.getCurrentUserWallet();
        if (currentUser) {
          await securityEscalationService.checkRateLimitEscalation(currentUser, 'buy_chips_wover', 5);
        }
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          error_type: 'operation_locked'
        };
      }

      const sanitized = sanitizeOperationInput({ amount: chipAmount, overAmount: woverCost });
      console.log(`🎯 Buying ${sanitized.amount} chips with ${sanitized.overAmount} WOVER`);
      
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { 
          action: 'buy_chips_with_wover',
          chip_amount: sanitized.amount,
          wover_cost: sanitized.overAmount,
          is_vip: isVip
        }
      });
        p_chip_amount: sanitized.amount,
        p_wover_cost: sanitized.overAmount,
        p_is_vip: isVip
      });

      if (error) {
        console.error('❌ WOVER chip purchase failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to buy chips with WOVER',
          error_type: this.getErrorType(error.message || '')
        };
      }

      console.log('✅ Chips purchased with WOVER successfully:', data);
      return {
        success: (data as any)?.success || false,
        previous_chips: (data as any)?.previous_chips,
        new_chips: (data as any)?.new_chips,
        previous_wover: (data as any)?.previous_wover,
        new_wover: (data as any)?.new_wover,
        operation_type: (data as any)?.operation_type,
        wallet_address: (data as any)?.wallet_address
      };
    } catch (error) {
      console.error('💥 WOVER chip purchase error:', error);
      
      const currentUser = await this.getCurrentUserWallet();
      if (currentUser) {
        await securityEscalationService.checkFailedAttemptsEscalation(currentUser, 'buy_chips_wover');
        await securityEscalationService.detectSuspiciousPatterns(currentUser, {
          operationType: 'buy_chips_wover',
          amount: chipAmount,
          overAmount: woverCost,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return {
        success: false,
        error: 'Network error',
        error_type: 'other'
      };
    }
  }

  // Helper method to categorize errors
  private getErrorType(errorMessage: string): 'insufficient_funds' | 'operation_locked' | 'other' {
    if (errorMessage.includes('Insufficient')) {
      return 'insufficient_funds';
    }
    if (errorMessage.includes('already in progress')) {
      return 'operation_locked';
    }
    return 'other';
  }

  // Check if user has sufficient balance for an operation
  async canAfford(chips?: number, woverAmount?: number): Promise<boolean> {
    const balance = await this.getBalance();
    
    if (!balance.success || !balance.has_wallet) {
      return false;
    }

    if (chips && balance.game_chips < chips) {
      return false;
    }

    if (woverAmount && balance.wover_balance < woverAmount) {
      return false;
    }

    return true;
  }

  // Get current user wallet for security checks
  private async getCurrentUserWallet(): Promise<string | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_wallet_address')
        .eq('user_id', session.session.user.id)
        .single();

      return profile?.verified_wallet_address || null;
    } catch (error) {
      console.error('Failed to get current user wallet:', error);
      return null;
    }
  }
}

export const secureBalanceService = new SecureBalanceService();