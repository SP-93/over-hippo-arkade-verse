import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WoverRewardOptions {
  gameType: string;
  baseMultiplier?: number;
  scoreThreshold?: number;
}

interface WoverReward {
  amount: number;
  reason: string;
  multiplier: number;
}

export const useWoverRewards = (options: WoverRewardOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  const calculateReward = useCallback((score: number, isVip: boolean = false): WoverReward => {
    const baseAmount = Math.floor(score / 1000); // 1 WOVER per 1000 points
    const vipMultiplier = isVip ? 2 : 1;
    const gameMultiplier = options.baseMultiplier || 1;
    
    let bonusMultiplier = 1;
    let reason = 'Game completion';

    // High score bonus
    if (options.scoreThreshold && score >= options.scoreThreshold) {
      bonusMultiplier = 1.5;
      reason = 'High score bonus';
    }

    // Super high score bonus
    if (options.scoreThreshold && score >= options.scoreThreshold * 2) {
      bonusMultiplier = 2;
      reason = 'Super high score bonus';
    }

    const finalAmount = Math.max(0.1, baseAmount * gameMultiplier * bonusMultiplier * vipMultiplier);
    
    return {
      amount: Number(finalAmount.toFixed(2)),
      reason: isVip ? `${reason} (VIP 2x)` : reason,
      multiplier: gameMultiplier * bonusMultiplier * vipMultiplier
    };
  }, [options.baseMultiplier, options.scoreThreshold]);

  const processReward = useCallback(async (score: number): Promise<boolean> => {
    if (isProcessing || score <= 0) return false;

    setIsProcessing(true);

    try {
      // Get user profile to check VIP status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to earn WOVER rewards');
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('vip_status')
        .eq('user_id', user.id)
        .single();

      const isVip = profile?.vip_status || false;
      const reward = calculateReward(score, isVip);

      // Record WOVER transaction
      const { error: transactionError } = await supabase
        .from('wover_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'game_reward',
          wover_amount: reward.amount,
          feature_type: options.gameType,
          status: 'completed',
          metadata: {
            score,
            reason: reward.reason,
            multiplier: reward.multiplier,
            isVip
          }
        });

      if (transactionError) {
        console.error('WOVER transaction error:', transactionError);
        toast.error('Failed to record WOVER reward');
        return false;
      }

      // Update profile WOVER balance - note this should ideally be done via edge function
      // but for now we'll update directly
      const { error: updateError } = await supabase.rpc('increment_wover_balance', {
        user_id: user.id,
        amount: reward.amount
      });

      if (updateError) {
        console.warn('WOVER balance update warning:', updateError);
        // Don't fail the whole operation if balance update fails
      }

      setTotalEarned(prev => prev + reward.amount);
      
      toast.success(
        `🏆 Earned ${reward.amount} WOVER! ${reward.reason}`,
        {
          duration: 5000,
          description: `Score: ${score.toLocaleString()} | Multiplier: x${reward.multiplier}`
        }
      );

      return true;

    } catch (error) {
      console.error('WOVER reward processing error:', error);
      toast.error('Failed to process WOVER reward');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, calculateReward, options.gameType]);

  const previewReward = useCallback((score: number, isVip: boolean = false): WoverReward => {
    return calculateReward(score, isVip);
  }, [calculateReward]);

  return {
    processReward,
    previewReward,
    isProcessing,
    totalEarned
  };
};