import { supabase } from "@/integrations/supabase/client";
import { sanitizeOperationInput, checkRateLimit } from "@/utils/inputSanitization";
import { securityEscalationService } from './security-escalation';

export interface BalanceInfo {
  success: boolean;
  has_wallet: boolean;
  wallet_address?: string;
  game_chips: number;
  over_balance: number;
  wover_balance: number;
  total_earnings: number;
  last_updated?: string;
  error?: string;
}

export interface BalanceOperationResult {
  success: boolean;
  previous_chips?: number;
  new_chips?: number;
  previous_over?: number;
  new_over?: number;
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
          over_balance: 0,
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
        over_balance: data.over_balance || 0,
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
        over_balance: 0,
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
        // Trigger security escalation for rate limiting
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

      // Input sanitization
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
        previous_over: data.previous_over,
        new_over: data.new_over,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 Chip spend error:', error);
      
      // Check for failed attempts escalation and suspicious patterns
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
      // Rate limiting check
      if (!checkRateLimit('add_chips', 5, 60000)) {
        // Trigger security escalation for rate limiting
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

      // Input sanitization
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
        previous_over: data.previous_over,
        new_over: data.new_over,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 Chip add error:', error);
      
      // Check for failed attempts escalation and suspicious patterns
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

  // Spend OVER tokens securely
  async spendOver(amount: number, purpose?: string): Promise<BalanceOperationResult> {
    try {
      // Rate limiting check
      if (!checkRateLimit('spend_over', 10, 60000)) {
        // Trigger security escalation for rate limiting
        const currentUser = await this.getCurrentUserWallet();
        if (currentUser) {
          await securityEscalationService.checkRateLimitEscalation(currentUser, 'spend_over', 10);
        }
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          error_type: 'operation_locked'
        };
      }

      // Input sanitization
      const sanitized = sanitizeOperationInput({ overAmount: amount });
      console.log(`🎯 Spending ${sanitized.overAmount} OVER for:`, purpose);
      
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { 
          action: 'spend_over',
          over_amount: sanitized.overAmount,
          transaction_ref: `over_spend_${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ OVER spend failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to spend OVER',
          error_type: this.getErrorType(error.message || '')
        };
      }

      console.log('✅ OVER spent successfully:', data);
      return {
        success: data.success || false,
        previous_chips: data.previous_chips,
        new_chips: data.new_chips,
        previous_over: data.previous_over,
        new_over: data.new_over,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 OVER spend error:', error);
      
      // Check for failed attempts escalation and suspicious patterns
      const currentUser = await this.getCurrentUserWallet();
      if (currentUser) {
        await securityEscalationService.checkFailedAttemptsEscalation(currentUser, 'spend_over');
        await securityEscalationService.detectSuspiciousPatterns(currentUser, {
          operationType: 'spend_over',
          overAmount: amount,
          purpose,
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

  // Add OVER tokens securely  
  async addOver(amount: number, transactionRef?: string): Promise<BalanceOperationResult> {
    try {
      // Rate limiting check
      if (!checkRateLimit('add_over', 5, 60000)) {
        // Trigger security escalation for rate limiting
        const currentUser = await this.getCurrentUserWallet();
        if (currentUser) {
          await securityEscalationService.checkRateLimitEscalation(currentUser, 'add_over', 5);
        }
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          error_type: 'operation_locked'
        };
      }

      // Input sanitization
      const sanitized = sanitizeOperationInput({ overAmount: amount, transactionRef });
      console.log(`🎯 Adding ${sanitized.overAmount} OVER`);
      
      const { data, error } = await supabase.functions.invoke('balance-operations', {
        body: { 
          action: 'add_over',
          over_amount: sanitized.overAmount,
          transaction_ref: sanitized.transactionRef || `over_add_${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ OVER add failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to add OVER',
          error_type: this.getErrorType(error.message || '')
        };
      }

      console.log('✅ OVER added successfully:', data);
      return {
        success: data.success || false,
        previous_chips: data.previous_chips,
        new_chips: data.new_chips,
        previous_over: data.previous_over,
        new_over: data.new_over,
        operation_type: data.operation_type,
        wallet_address: data.wallet_address
      };
    } catch (error) {
      console.error('💥 OVER add error:', error);
      
      // Check for failed attempts escalation and suspicious patterns
      const currentUser = await this.getCurrentUserWallet();
      if (currentUser) {
        await securityEscalationService.checkFailedAttemptsEscalation(currentUser, 'add_over');
        await securityEscalationService.detectSuspiciousPatterns(currentUser, {
          operationType: 'add_over',
          overAmount: amount,
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
  async canAfford(chips?: number, overAmount?: number): Promise<boolean> {
    const balance = await this.getBalance();
    
    if (!balance.success || !balance.has_wallet) {
      return false;
    }

    if (chips && balance.game_chips < chips) {
      return false;
    }

    if (overAmount && balance.over_balance < overAmount) {
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