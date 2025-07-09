import { supabase } from "@/integrations/supabase/client";

export interface PlayerBalance {
  address: string;
  overTokens: number;
  gameChips: number;
  totalEarnings: number;
  lastUpdated: string;
}

export interface ChipPurchaseResult {
  txHash: string;
  chipAmount: number;
  overCost: number;
  status: string;
}

export interface ScoreSubmissionResult {
  score: number;
  overReward: number;
  gameType: string;
}

export interface WithdrawalResult {
  txHash: string;
  amount: number;
  status: string;
}

export class SecurePlayerService {
  
  // Get player balance from secure backend
  async getPlayerBalance(): Promise<PlayerBalance | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('player-operations', {
        body: { action: 'get_balance' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Balance fetch failed:', error);
      return null;
    }
  }

  // Purchase chips with OVER tokens
  async purchaseChips(chipAmount: number, overAmount: number): Promise<ChipPurchaseResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('player-operations', {
        body: { 
          action: 'purchase_chips',
          chip_amount: chipAmount,
          over_amount: overAmount
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Chip purchase failed:', error);
      return null;
    }
  }

  // Submit game score and get OVER rewards
  async submitGameScore(gameType: string, score: number): Promise<ScoreSubmissionResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('player-operations', {
        body: { 
          action: 'submit_score',
          game_type: gameType,
          score: score
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Score submission failed:', error);
      return null;
    }
  }

  // Withdraw OVER tokens to wallet
  async withdrawTokens(amount: number): Promise<WithdrawalResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('player-operations', {
        body: { 
          action: 'withdraw_tokens',
          over_amount: amount
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return null;
    }
  }

  // Get player's transaction history
  async getTransactionHistory() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      // Get user's verified wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_wallet_address')
        .eq('user_id', session.session.user.id)
        .single();

      if (!profile?.verified_wallet_address) {
        return [];
      }

      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .eq('wallet_address', profile.verified_wallet_address)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Transaction history fetch failed:', error);
      return [];
    }
  }

  // Get player's game scores
  async getGameScores() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Game scores fetch failed:', error);
      return [];
    }
  }
}

export const securePlayerService = new SecurePlayerService();