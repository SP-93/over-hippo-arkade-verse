// Enhanced wallet persistence utility with backup storage and debugging
export interface WalletData {
  isConnected: boolean;
  address: string;
  type: string;
  verified: boolean;
  timestamp: number;
}

export interface ViewData {
  currentView: string;
  timestamp: number;
}

// Storage keys
const WALLET_KEY = 'wallet_connection';
const VIEW_KEY = 'current_view';
const WALLET_BACKUP_KEY = 'wallet_connection_backup';
const VIEW_BACKUP_KEY = 'current_view_backup';

export class WalletPersistenceManager {
  private static instance: WalletPersistenceManager;
  
  static getInstance(): WalletPersistenceManager {
    if (!WalletPersistenceManager.instance) {
      WalletPersistenceManager.instance = new WalletPersistenceManager();
    }
    return WalletPersistenceManager.instance;
  }

  // Save wallet data to both localStorage and sessionStorage
  saveWalletData(data: Omit<WalletData, 'timestamp'>): void {
    const walletData: WalletData = {
      ...data,
      timestamp: Date.now()
    };

    try {
      const jsonData = JSON.stringify(walletData);
      
      // Primary storage - localStorage
      localStorage.setItem(WALLET_KEY, jsonData);
      
      // Backup storage - sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(WALLET_BACKUP_KEY, jsonData);
      }
      
      console.log('💾 Wallet data saved to both storages:', walletData);
    } catch (error) {
      console.error('Failed to save wallet data:', error);
    }
  }

  // Load wallet data with fallback to backup storage
  loadWalletData(): WalletData | null {
    try {
      // Try primary storage first
      let walletJson = localStorage.getItem(WALLET_KEY);
      let source = 'localStorage';
      
      // Fallback to backup storage if primary fails
      if (!walletJson && typeof sessionStorage !== 'undefined') {
        walletJson = sessionStorage.getItem(WALLET_BACKUP_KEY);
        source = 'sessionStorage (backup)';
      }
      
      if (walletJson) {
        const walletData = JSON.parse(walletJson) as WalletData;
        
        // Check if data is not too old (24 hours)
        const now = Date.now();
        const dataAge = now - (walletData.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (dataAge > maxAge) {
          console.warn('🕐 Wallet data is too old, clearing...');
          this.clearWalletData();
          return null;
        }
        
        console.log(`✅ Wallet data loaded from ${source}:`, walletData);
        return walletData;
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
    
    return null;
  }

  // Save view data
  saveViewData(currentView: string): void {
    const viewData: ViewData = {
      currentView,
      timestamp: Date.now()
    };

    try {
      const jsonData = JSON.stringify(viewData);
      localStorage.setItem(VIEW_KEY, jsonData);
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(VIEW_BACKUP_KEY, jsonData);
      }
      
      console.log('📍 View data saved:', viewData);
    } catch (error) {
      console.error('Failed to save view data:', error);
    }
  }

  // Load view data
  loadViewData(): ViewData | null {
    try {
      let viewJson = localStorage.getItem(VIEW_KEY);
      
      if (!viewJson && typeof sessionStorage !== 'undefined') {
        viewJson = sessionStorage.getItem(VIEW_BACKUP_KEY);
      }
      
      if (viewJson) {
        const viewData = JSON.parse(viewJson) as ViewData;
        console.log('📍 View data loaded:', viewData);
        return viewData;
      }
    } catch (error) {
      console.error('Failed to load view data:', error);
    }
    
    return null;
  }

  // Clear wallet data from all storages
  clearWalletData(): void {
    try {
      localStorage.removeItem(WALLET_KEY);
      localStorage.removeItem(VIEW_KEY);
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(WALLET_BACKUP_KEY);
        sessionStorage.removeItem(VIEW_BACKUP_KEY);
      }
      
      console.log('🗑️ Wallet and view data cleared from all storages');
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
    }
  }

  // Get debug info about storage state
  getDebugInfo(): { localStorage: any; sessionStorage: any; timestamp: number } {
    return {
      localStorage: {
        wallet: localStorage.getItem(WALLET_KEY),
        view: localStorage.getItem(VIEW_KEY)
      },
      sessionStorage: typeof sessionStorage !== 'undefined' ? {
        walletBackup: sessionStorage.getItem(WALLET_BACKUP_KEY),
        viewBackup: sessionStorage.getItem(VIEW_BACKUP_KEY)
      } : null,
      timestamp: Date.now()
    };
  }

  // Check if wallet connection can be restored
  canRestoreWallet(): boolean {
    const walletData = this.loadWalletData();
    return walletData?.isConnected === true && !!walletData.address;
  }

  // Attempt to reconnect wallet silently
  async attemptSilentReconnection(): Promise<boolean> {
    const walletData = this.loadWalletData();
    
    if (!walletData?.isConnected || !walletData.address) {
      return false;
    }

    try {
      // Try to verify wallet is still connected without prompting user
      if (walletData.type === 'MetaMask' && typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const isStillConnected = accounts.length > 0 && 
          accounts[0].toLowerCase() === walletData.address.toLowerCase();
        
        if (isStillConnected) {
          console.log('🔄 Silent wallet reconnection successful');
          return true;
        }
      }
      
      if (walletData.type === 'OKX Web3' && typeof window.okxwallet !== 'undefined') {
        const accounts = await window.okxwallet.request({ method: 'eth_accounts' });
        const isStillConnected = accounts.length > 0 && 
          accounts[0].toLowerCase() === walletData.address.toLowerCase();
        
        if (isStillConnected) {
          console.log('🔄 Silent OKX wallet reconnection successful');
          return true;
        }
      }
      
    } catch (error) {
      console.error('Silent reconnection failed:', error);
    }
    
    console.log('❌ Silent reconnection failed, clearing stale data');
    this.clearWalletData();
    return false;
  }
}

// Export singleton instance
export const walletPersistence = WalletPersistenceManager.getInstance();