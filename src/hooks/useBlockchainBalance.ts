import { useState, useEffect, useCallback } from 'react';
import { overProtocolBlockchainService, BlockchainBalance } from '../services/over-protocol-blockchain';
import { toast } from 'sonner';

interface UseBlockchainBalanceReturn {
  balance: BlockchainBalance | null;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  lastUpdated: number;
  networkHealth: 'healthy' | 'slow' | 'down' | 'unknown';
}

export const useBlockchainBalance = (walletAddress: string | null): UseBlockchainBalanceReturn => {
  const [balance, setBalance] = useState<BlockchainBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [networkHealth, setNetworkHealth] = useState<'healthy' | 'slow' | 'down' | 'unknown'>('unknown');

  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkInfo = await overProtocolBlockchainService.getDetailedNetworkInfo();
      if (networkInfo) {
        setNetworkHealth(networkInfo.networkHealth);
        if (networkInfo.networkHealth === 'down') {
          setError('Over Protocol network is currently unavailable');
        }
      }
    } catch (error) {
      console.error('Network status check failed:', error);
      setNetworkHealth('down');
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check network status first
      await checkNetworkStatus();
      
      // Get enhanced balance with caching
      const result = await overProtocolBlockchainService.getEnhancedBalance(walletAddress);
      
      if (result.balance) {
        setBalance(result.balance);
        setLastUpdated(result.lastUpdated);
        
        if (result.cached) {
          console.log('Using cached balance data');
        } else {
          console.log('Fetched fresh balance data');
        }
      } else {
        setError('Failed to fetch balance from Over Protocol network');
        toast.error('Unable to fetch OVER balance');
      }
    } catch (error: any) {
      console.error('Balance refresh failed:', error);
      setError(error.message || 'Unknown error occurred');
      
      if (error.message.includes('network')) {
        toast.error('Network connection issue. Please check your internet connection.');
      } else {
        toast.error('Failed to fetch OVER balance');
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, checkNetworkStatus]);

  // Auto-refresh balance every 30 seconds when wallet is connected
  useEffect(() => {
    if (!walletAddress) return;

    // Initial load
    refreshBalance();

    // Set up auto-refresh
    const interval = setInterval(refreshBalance, 30000);

    return () => clearInterval(interval);
  }, [walletAddress, refreshBalance]);

  // Check network status on mount
  useEffect(() => {
    checkNetworkStatus();
  }, [checkNetworkStatus]);

  return {
    balance,
    isLoading,
    error,
    refreshBalance,
    lastUpdated,
    networkHealth
  };
};