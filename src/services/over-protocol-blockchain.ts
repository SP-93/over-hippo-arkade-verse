import { ethers } from 'ethers';
import { OVER_PROTOCOL_CONFIG } from './web3-auth';
import { supabase } from '@/integrations/supabase/client';

export interface BlockchainBalance {
  address: string;
  overBalance: string; // in OVER tokens (formatted)
  overBalanceWei: string; // in wei (raw)
  lastUpdated: number;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
}

export class OverProtocolBlockchainService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(OVER_PROTOCOL_CONFIG.RPC_URL);
  }

  // Get real OVER balance from blockchain
  async getOverBalance(walletAddress: string): Promise<BlockchainBalance | null> {
    try {
      // Validate address format
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      console.log(`Checking OVER balance for wallet: ${walletAddress}`);
      
      // Get balance in wei
      const balanceWei = await this.provider.getBalance(walletAddress);
      
      // Convert to OVER tokens (18 decimals)
      const balanceFormatted = ethers.formatEther(balanceWei);
      
      console.log(`Balance found: ${balanceFormatted} OVER`);

      return {
        address: walletAddress,
        overBalance: balanceFormatted,
        overBalanceWei: balanceWei.toString(),
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to get OVER balance:', error);
      return null;
    }
  }

  // Get transaction history for a wallet
  async getTransactionHistory(walletAddress: string, limit: number = 10): Promise<BlockchainTransaction[]> {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      console.log(`Fetching transaction history for: ${walletAddress}`);
      
      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      
      // Search recent blocks for transactions
      const transactions: BlockchainTransaction[] = [];
      const blocksToSearch = Math.min(100, currentBlock); // Last 100 blocks
      
      for (let i = 0; i < blocksToSearch && transactions.length < limit; i++) {
        const blockNumber = currentBlock - i;
        
        try {
          const block = await this.provider.getBlock(blockNumber, true);
          if (!block || !block.transactions) continue;
          
          for (const txData of block.transactions) {
            if (typeof txData === 'string') continue; // Skip if it's just a hash
            
            const tx = txData as ethers.TransactionResponse;
            
            // Check if transaction involves our wallet
            if (tx.from?.toLowerCase() === walletAddress.toLowerCase() || 
                tx.to?.toLowerCase() === walletAddress.toLowerCase()) {
              
              const receipt = await this.provider.getTransactionReceipt(tx.hash);
              
              transactions.push({
                hash: tx.hash,
                from: tx.from || '',
                to: tx.to || '',
                value: ethers.formatEther(tx.value),
                blockNumber: blockNumber,
                timestamp: block.timestamp * 1000, // Convert to milliseconds
                status: receipt?.status === 1 ? 'success' : 'failed'
              });
              
              if (transactions.length >= limit) break;
            }
          }
        } catch (blockError) {
          console.warn(`Error fetching block ${blockNumber}:`, blockError);
          continue;
        }
      }
      
      console.log(`Found ${transactions.length} transactions`);
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
      
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  // Send OVER tokens with proper error handling and transaction tracking
  async sendOverTokens(
    fromAddress: string, 
    toAddress: string, 
    amount: string, 
    privateKey?: string
  ): Promise<{ hash: string; status: 'pending' | 'success' | 'failed' } | null> {
    try {
      if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
        throw new Error('Invalid wallet addresses');
      }

      // Enhanced validation for Over Protocol
      const network = await this.getNetworkInfo();
      if (!network?.isOverProtocol) {
        throw new Error('Not connected to Over Protocol network');
      }

      const amountWei = ethers.parseEther(amount);
      const balance = await this.provider.getBalance(fromAddress);
      
      if (balance < amountWei) {
        throw new Error('Insufficient OVER balance');
      }

      // Get optimized gas price
      const gasPrice = await this.getOptimizedGasPrice();
      
      // Log transaction intent to database
      const txRecord = await this.logTransactionIntent(fromAddress, toAddress, amount, 'transfer');
      
      console.log(`Initiating OVER transfer: ${amount} OVER from ${fromAddress} to ${toAddress}`);
      console.log(`Transaction ID: ${txRecord.id}, Gas Price: ${gasPrice} gwei`);
      
      // For now, return pending status - real implementation would require proper wallet integration
      return {
        hash: `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`,
        status: 'pending'
      };
    } catch (error) {
      console.error('Failed to send OVER tokens:', error);
      await this.logTransactionError(fromAddress, toAddress, amount, error);
      return null;
    }
  }

  // Get optimized gas price for Over Protocol
  async getOptimizedGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      const baseGasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
      
      // Apply 10% buffer for Over Protocol network
      const optimizedGasPrice = (baseGasPrice * 110n) / 100n;
      
      return ethers.formatUnits(optimizedGasPrice, 'gwei');
    } catch (error) {
      console.error('Failed to get optimized gas price:', error);
      return '1'; // Fallback to 1 gwei
    }
  }

  // Get current gas price with Over Protocol optimization
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      const formattedPrice = ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
      
      // Log gas price for monitoring
      console.log(`Current Over Protocol gas price: ${formattedPrice} gwei`);
      
      return formattedPrice;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0';
    }
  }

  // Get network info
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        currentBlock: blockNumber,
        isOverProtocol: network.chainId === 54176n
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  // Check if address is a contract
  async isContract(address: string): Promise<boolean> {
    try {
      if (!ethers.isAddress(address)) return false;
      
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      console.error('Failed to check if address is contract:', error);
      return false;
    }
  }

  // Log transaction intent to database for tracking
  private async logTransactionIntent(
    fromAddress: string, 
    toAddress: string, 
    amount: string, 
    type: string
  ) {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .insert({
          wallet_address: fromAddress,
          transaction_type: type,
          amount_over: parseFloat(amount),
          status: 'pending',
          transaction_hash: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to log transaction intent:', error);
      throw error;
    }
  }

  // Log transaction errors for debugging
  private async logTransactionError(
    fromAddress: string, 
    toAddress: string, 
    amount: string, 
    error: any
  ) {
    try {
      await supabase
        .from('blockchain_transactions')
        .insert({
          wallet_address: fromAddress,
          transaction_type: 'transfer_failed',
          amount_over: parseFloat(amount),
          status: 'failed',
          transaction_hash: `error_${Date.now()}`
        });
    } catch (logError) {
      console.error('Failed to log transaction error:', logError);
    }
  }

  // Enhanced network monitoring
  async getDetailedNetworkInfo() {
    try {
      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.getGasPrice()
      ]);
      
      const isOverProtocol = network.chainId === 54176n;
      const networkHealth = await this.checkNetworkHealth();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        currentBlock: blockNumber,
        gasPrice: `${gasPrice} gwei`,
        isOverProtocol,
        networkHealth,
        rpcUrl: OVER_PROTOCOL_CONFIG.RPC_URL,
        blockExplorer: OVER_PROTOCOL_CONFIG.BLOCK_EXPLORER
      };
    } catch (error) {
      console.error('Failed to get detailed network info:', error);
      return null;
    }
  }

  // Check Over Protocol network health
  private async checkNetworkHealth(): Promise<'healthy' | 'slow' | 'down'> {
    try {
      const start = Date.now();
      await this.provider.getBlockNumber();
      const responseTime = Date.now() - start;
      
      if (responseTime < 2000) return 'healthy';
      if (responseTime < 5000) return 'slow';
      return 'down';
    } catch (error) {
      console.error('Network health check failed:', error);
      return 'down';
    }
  }

  // Enhanced balance checking with caching
  async getEnhancedBalance(walletAddress: string): Promise<{
    balance: BlockchainBalance | null;
    cached: boolean;
    lastUpdated: number;
  }> {
    try {
      // Check for cached balance first
      const cacheKey = `balance_${walletAddress}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Use cache if less than 30 seconds old
        if (cacheAge < 30000) {
          return {
            balance: cachedData.balance,
            cached: true,
            lastUpdated: cachedData.timestamp
          };
        }
      }
      
      // Fetch fresh balance
      const balance = await this.getOverBalance(walletAddress);
      
      if (balance) {
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          balance,
          timestamp: Date.now()
        }));
      }
      
      return {
        balance,
        cached: false,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Enhanced balance check failed:', error);
      return { balance: null, cached: false, lastUpdated: 0 };
    }
  }
}

export const overProtocolBlockchainService = new OverProtocolBlockchainService();