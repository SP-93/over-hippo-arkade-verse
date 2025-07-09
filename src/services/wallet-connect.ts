import { WalletConnectModal } from '@walletconnect/modal';
import { web3AuthService, WalletConnectionResult } from './web3-auth';

interface WalletConnectConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  chains: string[];
}

export class WalletConnectService {
  private modal: WalletConnectModal | null = null;
  private config: WalletConnectConfig;

  constructor() {
    this.config = {
      projectId: 'ea4c99bb78a1ce3fdb5b72bcb42b32e5', // Over Hippo Arkade project ID
      metadata: {
        name: 'Over Hippo Arkade',
        description: 'Blockchain Gaming Platform on Over Protocol',
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`]
      },
      chains: ['eip155:54176'] // Over Protocol Mainnet
    };
  }

  // Initialize WalletConnect Modal
  async initialize(): Promise<void> {
    try {
      this.modal = new WalletConnectModal({
        projectId: this.config.projectId,
        chains: this.config.chains,
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '9999',
          '--wcm-background-color': '#0a0a0a',
          '--wcm-accent-color': '#3b82f6',
          '--wcm-background-border-radius': '12px'
        }
      });

      console.log('WalletConnect Modal initialized');
    } catch (error) {
      console.error('WalletConnect initialization failed:', error);
      throw error;
    }
  }

  // Open WalletConnect QR code modal - simplified for now
  async openModal(): Promise<WalletConnectionResult> {
    if (!this.modal) {
      await this.initialize();
    }

    // For now, just open the modal and show info message
    // WalletConnect v2 API is different, will need to implement proper connection handling
    this.modal?.openModal();
    
    // Return a promise that rejects after timeout since we can't properly handle connection yet
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('WalletConnect integration is still under development for Over Protocol'));
      }, 3000);
    });
  }

  // Switch connected wallet to Over Protocol network
  private async switchToOverProtocol(provider: any): Promise<void> {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xd3a0' }] // 54176 in hex
      });
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xd3a0',
            chainName: 'Over Protocol Mainnet',
            nativeCurrency: {
              name: 'OVER',
              symbol: 'OVER',
              decimals: 18
            },
            rpcUrls: ['https://rpc.overprotocol.com'],
            blockExplorerUrls: ['https://scan.over.network']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Generate challenge message for signature verification
  private generateChallengeMessage(address: string): string {
    const timestamp = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    return `Over Hippo Arkade Authentication

Please sign this message to verify wallet ownership.

Wallet: ${address}
Timestamp: ${timestamp}
Nonce: ${nonce}

This signature proves you own this wallet and grants access to Over Hippo Arkade platform.`;
  }

  // Close modal programmatically
  closeModal(): void {
    this.modal?.closeModal();
  }

  // Get supported wallet list
  getSupportedWallets(): string[] {
    return [
      'MetaMask',
      'OKX Wallet', 
      'Trust Wallet',
      'Coinbase Wallet',
      'Rainbow',
      'Phantom',
      'Binance Wallet',
      'Kaikas',
      'Klip'
    ];
  }

  // Check if mobile device
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

export const walletConnectService = new WalletConnectService();