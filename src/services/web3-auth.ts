// Real Web3 Authentication Service
import { supabase } from "@/integrations/supabase/client";

// Over Protocol Network Configuration
export const OVER_PROTOCOL_CONFIG = {
  NETWORK_NAME: 'Over Protocol Mainnet',
  CHAIN_ID: '0xd3a0', // 54176 in hex
  RPC_URL: 'https://rpc.overprotocol.com',
  BLOCK_EXPLORER: 'https://scan.over.network',
  NATIVE_CURRENCY: {
    name: 'OVER',
    symbol: 'OVER',
    decimals: 18
  }
};

export interface WalletConnectionResult {
  address: string;
  signature: string;
  message: string;
  verified: boolean;
}

export class Web3AuthService {
  
  // Generate challenge message for wallet signature
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

  // Connect MetaMask wallet
  async connectMetaMask(): Promise<WalletConnectionResult> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Switch to Over Protocol network
      await this.switchToOverProtocol();

      // Generate challenge and request signature
      const message = this.generateChallengeMessage(address);
      const signature = await this.requestSignature(address, message);

      // Verify signature
      const verified = await this.verifyWalletSignature(address, message, signature);

      return {
        address,
        signature,
        message,
        verified
      };

    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  }

  // Connect OKX Wallet
  async connectOKX(): Promise<WalletConnectionResult> {
    try {
      if (typeof window.okxwallet === 'undefined') {
        throw new Error('OKX Wallet not installed');
      }

      // Request account access
      const accounts = await window.okxwallet.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Switch to Over Protocol network
      await this.switchToOverProtocolOKX();

      // Generate challenge and request signature
      const message = this.generateChallengeMessage(address);
      const signature = await this.requestSignatureOKX(address, message);

      // Verify signature
      const verified = await this.verifyWalletSignature(address, message, signature);

      return {
        address,
        signature,
        message,
        verified
      };

    } catch (error) {
      console.error('OKX Wallet connection failed:', error);
      throw error;
    }
  }

  // Switch to Over Protocol network in MetaMask
  private async switchToOverProtocol(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID }]
      });
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID,
            chainName: OVER_PROTOCOL_CONFIG.NETWORK_NAME,
            nativeCurrency: OVER_PROTOCOL_CONFIG.NATIVE_CURRENCY,
            rpcUrls: [OVER_PROTOCOL_CONFIG.RPC_URL],
            blockExplorerUrls: [OVER_PROTOCOL_CONFIG.BLOCK_EXPLORER]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Switch to Over Protocol network in OKX
  private async switchToOverProtocolOKX(): Promise<void> {
    try {
      await window.okxwallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID }]
      });
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902) {
        await window.okxwallet.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: OVER_PROTOCOL_CONFIG.CHAIN_ID,
            chainName: OVER_PROTOCOL_CONFIG.NETWORK_NAME,
            nativeCurrency: OVER_PROTOCOL_CONFIG.NATIVE_CURRENCY,
            rpcUrls: [OVER_PROTOCOL_CONFIG.RPC_URL],
            blockExplorerUrls: [OVER_PROTOCOL_CONFIG.BLOCK_EXPLORER]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Request signature from MetaMask
  private async requestSignature(address: string, message: string): Promise<string> {
    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });
      return signature;
    } catch (error) {
      console.error('Signature request failed:', error);
      throw error;
    }
  }

  // Request signature from OKX
  private async requestSignatureOKX(address: string, message: string): Promise<string> {
    try {
      const signature = await window.okxwallet.request({
        method: 'personal_sign',
        params: [message, address]
      });
      return signature;
    } catch (error) {
      console.error('Signature request failed:', error);
      throw error;
    }
  }

  // Verify wallet signature and store in database
  async verifyWalletSignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // Normalize address to lowercase for consistent storage
      const normalizedAddress = address.toLowerCase();
      
      // Call Supabase function to verify signature
      const { data, error } = await supabase.rpc('verify_wallet_signature', {
        p_wallet_address: normalizedAddress,
        p_message: message,
        p_signature: signature
      });

      if (error) {
        console.error('Signature verification failed:', error);
        return false;
      }

      if (data) {
        // Store verification in database
        await this.storeWalletVerification(normalizedAddress, message, signature);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Verification process failed:', error);
      return false;
    }
  }

  // Store wallet verification in database
  private async storeWalletVerification(address: string, message: string, signature: string): Promise<void> {
    try {
      // First store the wallet verification
      const { error } = await supabase
        .from('wallet_verifications')
        .insert({
          wallet_address: address, // Already normalized
          message: message,
          signature: signature,
          user_id: null // Will be updated later when user logs in
        });

      if (error) {
        console.error('Failed to store wallet verification:', error);
        throw error;
      }

      // Try to update user profile if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verified_wallet_address: address, // Already normalized
            wallet_verified_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Failed to update profile:', profileError);
          // Don't throw error here as wallet verification succeeded
        }
      }

    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  // Check if wallet is already verified for current user
  async isWalletVerified(address: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wallet_verifications')
        .select('id')
        .eq('wallet_address', address)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Wallet verification check failed:', error);
      return false;
    }
  }

  // Get current network info
  async getCurrentNetwork(): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId;
      }
      return null;
    } catch (error) {
      console.error('Failed to get network:', error);
      return null;
    }
  }
}

// Global instance
export const web3AuthService = new Web3AuthService();