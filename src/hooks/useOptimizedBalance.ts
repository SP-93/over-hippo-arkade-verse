import { useState, useEffect, useRef, useCallback } from "react";
import { secureBalanceService } from "@/services/secure-balance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BalanceCache {
  data: any;
  timestamp: number;
  expiresIn: number;
}

export const useOptimizedBalance = (userId?: string) => {
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache and debouncing
  const cacheRef = useRef<BalanceCache | null>(null);
  const lastRequestRef = useRef<number>(0);
  const pendingRequestRef = useRef<Promise<any> | null>(null);
  
  const CACHE_DURATION = 5000; // 5 seconds
  const DEBOUNCE_DELAY = 500; // 500ms debounce
  const MAX_REQUESTS_PER_MINUTE = 20;
  const requestCountRef = useRef<number>(0);
  const requestWindowRef = useRef<number>(Date.now());

  // Rate limiting
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const windowStart = requestWindowRef.current;
    
    // Reset window if more than 1 minute has passed
    if (now - windowStart > 60000) {
      requestCountRef.current = 0;
      requestWindowRef.current = now;
    }
    
    return requestCountRef.current >= MAX_REQUESTS_PER_MINUTE;
  }, []);

  // Check cache validity
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    return Date.now() - cacheRef.current.timestamp < cacheRef.current.expiresIn;
  }, []);

  // Optimized balance loading with caching and debouncing
  const loadBalance = useCallback(async (forceRefresh = false): Promise<any> => {
    if (!userId) {
      setBalance(null);
      setIsLoading(false);
      return null;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid()) {
      console.log('📦 Using cached balance data');
      return cacheRef.current!.data;
    }

    // Rate limiting check
    if (isRateLimited()) {
      console.warn('⚠️ Balance requests rate limited');
      toast.warning("Too many balance requests. Please wait a moment.");
      return cacheRef.current?.data || null;
    }

    // Debouncing - prevent duplicate requests
    const now = Date.now();
    if (now - lastRequestRef.current < DEBOUNCE_DELAY && pendingRequestRef.current) {
      console.log('⏳ Reusing pending balance request');
      return pendingRequestRef.current;
    }

    lastRequestRef.current = now;
    setIsLoading(true);
    setError(null);

    try {

      // Create the request promise
      const balancePromise = secureBalanceService.getBalance();
      pendingRequestRef.current = balancePromise;
      
      // Increment request counter
      requestCountRef.current++;
      
      const balanceData = await balancePromise;
      
      if (balanceData.success) {
        // Cache the result
        cacheRef.current = {
          data: balanceData,
          timestamp: Date.now(),
          expiresIn: CACHE_DURATION
        };
        
        setBalance(balanceData);
        console.log('✅ Balance loaded and cached:', balanceData.game_chips, `WOVER: ${(balanceData as any).wover_balance || 0}`);
        return balanceData;
      } else {
        throw new Error(balanceData.error || 'Failed to load balance');
      }
    } catch (err: any) {
      console.error('❌ Balance load failed:', err);
      setError(err.message);
      
      // Return cached data if available during error
      if (cacheRef.current) {
        console.log('📦 Returning cached data due to error');
        return cacheRef.current.data;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = null;
    }
  }, [isCacheValid, isRateLimited, userId]);

  // Optimized refresh function
  const refreshBalance = useCallback(async () => {
    return loadBalance(true);
  }, [loadBalance]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadBalance();
    }
  }, [loadBalance, userId]);

  // Listen for balance update events with debouncing
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const handleBalanceUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('🔄 Balance update event - refreshing');
        loadBalance(true);
      }, DEBOUNCE_DELAY);
    };

    const events = [
      'balanceUpdated',
      'chipBalanceUpdated', 
      'forceBalanceRefresh',
      'adminBalanceUpdated'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleBalanceUpdate);
    });

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        window.removeEventListener(event, handleBalanceUpdate);
      });
    };
  }, [loadBalance]);

  // Clear cache when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      cacheRef.current = null;
      requestCountRef.current = 0;
      requestWindowRef.current = Date.now();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    balance,
    isLoading,
    error,
    refreshBalance,
    loadBalance,
    isCached: isCacheValid()
  };
};