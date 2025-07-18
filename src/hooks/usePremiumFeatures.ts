import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const usePremiumFeatures = () => {
  const queryClient = useQueryClient();

  // Fetch user's premium features
  const { data: premiumFeatures } = useQuery({
    queryKey: ['premium-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's VIP status
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('vip_status, vip_expires_at')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Purchase premium chips mutation
  const purchasePremiumChips = useMutation({
    mutationFn: async ({ chipAmount, overCost, premiumType }: { 
      chipAmount: number; 
      overCost: number; 
      premiumType: 'standard' | 'premium' 
    }) => {
      const { data, error } = await supabase.rpc('purchase_premium_chips', {
        p_chip_amount: chipAmount,
        p_over_cost: overCost,
        p_premium_type: premiumType
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      if (result?.success) {
        toast.success(`Premium chips purchased! ${result.chips_added} chips (${result.lives_per_chip} lives each)`);
        queryClient.invalidateQueries({ queryKey: ['player-balance'] });
      } else {
        toast.error(result?.error || "Purchase failed");
      }
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    }
  });

  // Purchase VIP status mutation (now uses WOVER instead of OVER)
  const purchaseVipStatus = useMutation({
    mutationFn: async (durationDays: number = 30) => {
      const { data, error } = await supabase.rpc('purchase_vip_status', {
        p_duration_days: durationDays
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      if (result?.success) {
        toast.success(`VIP status activated for ${result.vip_duration} days! Spent ${result.wover_spent} WOVER.`);
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        queryClient.invalidateQueries({ queryKey: ['player-balance'] });
      } else {
        toast.error(result?.error || "VIP purchase failed");
      }
    },
    onError: (error) => {
      toast.error(`VIP purchase failed: ${error.message}`);
    }
  });

  const isVipActive = () => {
    if (!profile?.vip_status || !profile?.vip_expires_at) return false;
    return new Date(profile.vip_expires_at) > new Date();
  };

  const getVipTimeRemaining = () => {
    if (!profile?.vip_expires_at) return null;
    const expiry = new Date(profile.vip_expires_at);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  return {
    premiumFeatures,
    profile,
    isVipActive: isVipActive(),
    vipTimeRemaining: getVipTimeRemaining(),
    purchasePremiumChips,
    purchaseVipStatus
  };
};