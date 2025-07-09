import { ethers } from 'ethers';
import { OVER_PROTOCOL_CONFIG } from './web3-auth';

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

  // Send OVER tokens (for future implementation)
  async sendOverTokens(
    fromAddress: string, 
    toAddress: string, 
    amount: string, 
    privateKey?: string
  ): Promise<string | null> {
    try {
      if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
        throw new Error('Invalid wallet addresses');
      }

      // For now, we'll just return a mock transaction hash
      // In real implementation, this would require a signer with private key
      console.log(`Would send ${amount} OVER from ${fromAddress} to ${toAddress}`);
      
      // This is just a placeholder - real implementation would need proper signing
      return null;
    } catch (error) {
      console.error('Failed to send OVER tokens:', error);
      return null;
    }
  }

  // Get current gas price
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
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
}

export const overProtocolBlockchainService = new OverProtocolBlockchainService();