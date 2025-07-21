import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { secureBalanceService } from '@/services/secure-balance';

interface WoverPurchaseOptions {
  chipAmount: number;
  vipDiscount?: boolean;
}

interface WoverPurchaseResult {
  success: boolean;
  chipsReceived?: number;
  woverSpent?: number;
  vipDiscount?: number;
  error?: string;
}

export const useWoverOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  // Standard WOVER to chip conversion rates
  const CHIP_PRICES = {
    standard: 1.0, // 1 WOVER = 1 chip
    vip: 0.8,      // VIP users get 20% discount
    bulk_10: 0.9,  // 10% discount for 10+ chips
    bulk_50: 0.8   // 20% discount for 50+ chips
  };

  // Calculate chip purchase cost with discounts
  const calculateCost = useCallback((chipAmount: number, isVip: boolean = false): {
    cost: number;
    discount: number;
    discountType: string;
  } => {
    let pricePerChip = CHIP_PRICES.standard;
    let discountType = 'standard';

    // Apply bulk discounts first
    if (chipAmount >= 50) {
      pricePerChip = CHIP_PRICES.bulk_50;
      discountType = 'bulk_50';
    } else if (chipAmount >= 10) {
      pricePerChip = CHIP_PRICES.bulk_10;
      discountType = 'bulk_10';
    }

    // Apply VIP discount if better
    if (isVip && CHIP_PRICES.vip < pricePerChip) {
      pricePerChip = CHIP_PRICES.vip;
      discountType = 'vip';
    }

    const cost = Number((chipAmount * pricePerChip).toFixed(2));
    const standardCost = chipAmount * CHIP_PRICES.standard;
    const discount = Number(((standardCost - cost) / standardCost * 100).toFixed(1));

    return { cost, discount, discountType };
  }, []);

  // Check if user has VIP status
  const checkVipStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('vip_status, vip_expires_at')
        .eq('user_id', user.id)
        .single();

      if (!profile?.vip_status) return false;

      // Check if VIP is still valid
      if (profile.vip_expires_at) {
        const expiresAt = new Date(profile.vip_expires_at);
        return expiresAt > new Date();
      }

      return true;
    } catch (error) {
      console.error('Failed to check VIP status:', error);
      return false;
    }
  }, []);

  // Purchase chips with WOVER
  const purchaseChips = useCallback(async (options: WoverPurchaseOptions): Promise<WoverPurchaseResult> => {
    if (isProcessing) {
      return { success: false, error: 'Another purchase is in progress' };
    }

    setIsProcessing(true);

    try {
      const { chipAmount } = options;
      
      if (chipAmount <= 0) {
        return { success: false, error: 'Invalid chip amount' };
      }

      // Check VIP status
      const isVip = await checkVipStatus();
      
      // Calculate cost with discounts
      const { cost, discount, discountType } = calculateCost(chipAmount, isVip);

      // Check if user has enough WOVER
      const canAfford = await secureBalanceService.canAfford(undefined, cost);
      if (!canAfford) {
        return { 
          success: false, 
          error: `Insufficient WOVER balance. Need ${cost} WOVER.` 
        };
      }

      // Perform the purchase
      const result = await secureBalanceService.buyChipsWithWover(chipAmount, cost, isVip);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Purchase failed'
        };
      }

      setTotalSpent(prev => prev + cost);

      // Show success message with discount info
      let successMessage = `✅ Purchased ${chipAmount} chips for ${cost} WOVER`;
      if (discount > 0) {
        successMessage += ` (${discount}% ${discountType} discount!)`;
      }

      toast.success(successMessage, {
        duration: 5000,
        description: isVip ? 'VIP benefits applied' : undefined
      });

      // Trigger balance refresh events
      window.dispatchEvent(new Event('balanceUpdated'));
      window.dispatchEvent(new Event('chipBalanceUpdated'));

      return {
        success: true,
        chipsReceived: chipAmount,
        woverSpent: cost,
        vipDiscount: discount
      };

    } catch (error) {
      console.error('WOVER chip purchase error:', error);
      return {
        success: false,
        error: 'Network error during purchase'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, calculateCost, checkVipStatus]);

  // Get purchase preview without actually buying
  const previewPurchase = useCallback(async (chipAmount: number): Promise<{
    cost: number;
    discount: number;
    discountType: string;
    isVip: boolean;
    canAfford: boolean;
  }> => {
    const isVip = await checkVipStatus();
    const { cost, discount, discountType } = calculateCost(chipAmount, isVip);
    const canAfford = await secureBalanceService.canAfford(undefined, cost);

    return {
      cost,
      discount,
      discountType,
      isVip,
      canAfford
    };
  }, [calculateCost, checkVipStatus]);

  // Bulk purchase options
  const getBulkOptions = useCallback(async () => {
    const isVip = await checkVipStatus();
    const options = [
      { chips: 5, ...calculateCost(5, isVip) },
      { chips: 10, ...calculateCost(10, isVip) },
      { chips: 25, ...calculateCost(25, isVip) },
      { chips: 50, ...calculateCost(50, isVip) },
      { chips: 100, ...calculateCost(100, isVip) }
    ];

    return options.map(option => ({
      ...option,
      isVip,
      recommended: option.chips === 10 || option.chips === 50
    }));
  }, [calculateCost, checkVipStatus]);

  return {
    // Core operations
    purchaseChips,
    previewPurchase,
    getBulkOptions,
    
    // State
    isProcessing,
    totalSpent,
    
    // Utilities
    calculateCost,
    checkVipStatus,
    chipPrices: CHIP_PRICES
  };
};