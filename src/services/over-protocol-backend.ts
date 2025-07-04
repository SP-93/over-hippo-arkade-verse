// Over Protocol Backend Integration Service
import { OVER_PROTOCOL_CONFIG, ChipPurchaseTransaction, PlayerBalance } from '@/types/over-protocol';

export class OverProtocolBackend {
  private apiUrl: string;
  private contractAddress: string;
  
  constructor() {
    this.apiUrl = 'https://api.over.network'; // Official Over Protocol API
    this.contractAddress = OVER_PROTOCOL_CONFIG.ARCADE_CONTRACT;
  }

  // Connect to Over Protocol wallet
  async connectWallet(walletType: 'metamask' | 'okx' | 'phantom' = 'metamask') {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Wallet not found');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      } as any);

      // Switch to Over Protocol network
      await this.switchToOverNetwork();
      
      return {
        address: accounts[0],
        network: 'Over Protocol Mainnet',
        connected: true
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  // Switch to Over Protocol network
  private async switchToOverNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID }]
      } as any);
    } catch (switchError: any) {
      // Network not added to wallet, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID,
            chainName: 'Over Protocol Mainnet',
            nativeCurrency: {
              name: 'OVER',
              symbol: 'OVER',
              decimals: 18
            },
            rpcUrls: [OVER_PROTOCOL_CONFIG.RPC_URL],
            blockExplorerUrls: ['https://scan.over.network']
          }]
        } as any);
      } else {
        throw switchError;
      }
    }
  }

  // Get player balance from Over Protocol
  async getPlayerBalance(walletAddress: string): Promise<PlayerBalance> {
    try {
      // In production, this would call the actual Over Protocol API
      const response = await fetch(`${this.apiUrl}/balance/${walletAddress}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      return {
        address: walletAddress,
        overTokens: data.overBalance || 50.5, // Demo balance
        gameChips: data.chipBalance || 3,     // Demo chips
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Balance fetch failed:', error);
      // Return demo data for development
      return {
        address: walletAddress,
        overTokens: 50.5,
        gameChips: 3,
        lastUpdated: Date.now()
      };
    }
  }

  // Purchase game chips with OVER tokens
  async purchaseChips(walletAddress: string, chipAmount: number): Promise<ChipPurchaseTransaction> {
    const overCost = chipAmount * OVER_PROTOCOL_CONFIG.CHIP_PRICE;
    
    try {
      const transaction: ChipPurchaseTransaction = {
        from: walletAddress,
        to: this.contractAddress,
        amount: overCost,
        chipsPurchased: chipAmount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Demo hash
        status: 'pending'
      };

      // In production, this would interact with the actual smart contract
      await this.simulateTransaction({ txHash: transaction.txHash });
      
      transaction.status = 'confirmed';
      return transaction;
    } catch (error) {
      console.error('Chip purchase failed:', error);
      throw new Error('Transaction failed');
    }
  }

  // Withdraw OVER tokens from game balance
  async withdrawTokens(walletAddress: string, amount: number): Promise<string> {
    try {
      // Simulate blockchain transaction
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      await this.simulateTransaction({ txHash });
      
      return txHash;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      throw new Error('Withdrawal transaction failed');
    }
  }

  // Submit game score and calculate OVER rewards
  async submitGameScore(walletAddress: string, gameType: 'tetris' | 'snake' | 'pacman', score: number): Promise<number> {
    try {
      const rewardRate = this.getGameRewardRate(gameType);
      const overReward = Math.floor(score / 1000) * rewardRate;
      
      // In production, this would update the smart contract
      console.log(`Submitting score: ${score} for ${gameType}, reward: ${overReward} OVER`);
      
      return overReward;
    } catch (error) {
      console.error('Score submission failed:', error);
      return 0;
    }
  }

  private getGameRewardRate(gameType: 'tetris' | 'snake' | 'pacman'): number {
    const rates = {
      tetris: 0.001,  // 0.001 OVER per 1000 points
      snake: 0.0015,  // 0.0015 OVER per 1000 points  
      pacman: 0.002   // 0.002 OVER per 1000 points
    };
    return rates[gameType];
  }

  // Simulate blockchain transaction delay
  private async simulateTransaction(tx: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000 + Math.random() * 1000); // 2-3 second delay
    });
  }

  // Get live tournament data
  async getTournamentData() {
    try {
      // In production, fetch from Over Protocol tournament contracts
      return {
        activeTournaments: 3,
        totalPrizePool: 1250.75,
        playersOnline: 847,
        nextTournament: Date.now() + (2 * 60 * 60 * 1000) // 2 hours from now
      };
    } catch (error) {
      console.error('Tournament data fetch failed:', error);
      return null;
    }
  }
}

// Global instance
export const overProtocolBackend = new OverProtocolBackend();
