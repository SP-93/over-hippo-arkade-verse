import { useState, useEffect } from 'react';
import { overProtocolBlockchainService } from '@/services/over-protocol-blockchain';
import { toast } from 'sonner';

interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
}

interface UseOverProtocolTransactionsReturn {
  sendTransaction: (to: string, amount: string) => Promise<TransactionResult | null>;
  isTransacting: boolean;
  recentTransactions: any[];
  refreshTransactions: () => Promise<void>;
  gasPrice: string;
  networkStatus: 'healthy' | 'slow' | 'down' | 'unknown';
}

export const useOverProtocolTransactions = (walletAddress: string | null): UseOverProtocolTransactionsReturn => {
  const [isTransacting, setIsTransacting] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [gasPrice, setGasPrice] = useState('0');
  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'slow' | 'down' | 'unknown'>('unknown');

  // Send OVER tokens
  const sendTransaction = async (to: string, amount: string): Promise<TransactionResult | null> => {
    if (!walletAddress) {
      toast.error('No wallet connected');
      return null;
    }

    setIsTransacting(true);
    try {
      // Check network health first
      const networkInfo = await overProtocolBlockchainService.getDetailedNetworkInfo();
      if (!networkInfo?.isOverProtocol) {
        toast.error('Please switch to Over Protocol network');
        return null;
      }

      if (networkInfo.networkHealth === 'down') {
        toast.error('Over Protocol network is currently unavailable');
        return null;
      }

      // Validate inputs
      if (!to || !amount || parseFloat(amount) <= 0) {
        toast.error('Invalid transaction parameters');
        return null;
      }

      // Check balance
      const balance = await overProtocolBlockchainService.getOverBalance(walletAddress);
      if (!balance || parseFloat(balance.overBalance) < parseFloat(amount)) {
        toast.error('Insufficient OVER balance');
        return null;
      }

      toast.loading('Preparing transaction...');

      // Send transaction
      const result = await overProtocolBlockchainService.sendOverTokens(
        walletAddress,
        to,
        amount
      );

      if (result) {
        toast.success(`Transaction submitted: ${result.hash.slice(0, 10)}...`);
        
        // Refresh transactions list
        await refreshTransactions();
        
        return result;
      } else {
        toast.error('Transaction failed');
        return null;
      }
    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      return null;
    } finally {
      setIsTransacting(false);
    }
  };

  // Refresh transaction history
  const refreshTransactions = async () => {
    if (!walletAddress) return;

    try {
      const transactions = await overProtocolBlockchainService.getTransactionHistory(walletAddress, 10);
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  };

  // Update gas price and network status
  const updateNetworkInfo = async () => {
    try {
      const [price, networkInfo] = await Promise.all([
        overProtocolBlockchainService.getGasPrice(),
        overProtocolBlockchainService.getDetailedNetworkInfo()
      ]);
      
      setGasPrice(price);
      setNetworkStatus(networkInfo?.networkHealth || 'unknown');
    } catch (error) {
      console.error('Failed to update network info:', error);
      setNetworkStatus('down');
    }
  };

  // Initialize and set up periodic updates
  useEffect(() => {
    if (walletAddress) {
      updateNetworkInfo();
      refreshTransactions();

      // Update every 30 seconds
      const interval = setInterval(() => {
        updateNetworkInfo();
        refreshTransactions();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  return {
    sendTransaction,
    isTransacting,
    recentTransactions,
    refreshTransactions,
    gasPrice,
    networkStatus
  };
};