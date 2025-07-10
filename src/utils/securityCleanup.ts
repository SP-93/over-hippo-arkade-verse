import { supabase } from "@/integrations/supabase/client";

// Complete security cleanup function with options
export const performSecurityCleanup = async (preserveWallet: boolean = false) => {
  console.log('🧹 Starting comprehensive security cleanup...', preserveWallet ? '(preserving wallet)' : '');
  
  try {
    // 1. Clear localStorage data (optionally preserve wallet)
    clearLocalStorage(preserveWallet);
    
    // 2. Clear sessionStorage data (but preserve wallet backup if needed)
    clearSessionStorage(preserveWallet);
    
    // 3. Disconnect wallet extensions only if not preserving
    if (!preserveWallet) {
      await disconnectWalletExtensions();
    }
    
    // 4. Sign out from Supabase (with global scope)
    await performSupabaseSignOut();
    
    console.log('✅ Security cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during security cleanup:', error);
    // Continue with cleanup even if some steps fail
  }
};

// Gentle cleanup that preserves wallet connection
export const performGentleCleanup = async () => {
  console.log('🧽 Starting gentle cleanup (preserving wallet)...');
  await performSecurityCleanup(true);
};

// Clear localStorage with specific focus on auth and wallet data
// Enhanced with whitelist to preserve critical wallet data during normal cleanup
const clearLocalStorage = (preserveWallet: boolean = false) => {
  try {
    console.log('🗄️ Clearing localStorage...', preserveWallet ? '(preserving wallet)' : '');
    
    // Supabase auth keys to remove
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || 
      key.includes('sb-') ||
      key.startsWith('sb-')
    );
    
    // App-specific keys to remove (conditional wallet preservation)
    const appKeys = [
      'player_chips',
      'user_session',
      'auth_state'
    ];
    
    // Only add wallet keys if not preserving
    if (!preserveWallet) {
      appKeys.push('wallet_connection', 'current_view');
    }
    
    // Remove Supabase auth keys
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });
    
    // Remove app-specific keys
    appKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage key: ${key}`);
      }
    });
    
    if (preserveWallet) {
      console.log('💾 Preserved wallet connection data during cleanup');
    }
    
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Clear sessionStorage with optional wallet preservation
const clearSessionStorage = (preserveWallet: boolean = false) => {
  try {
    console.log('📋 Clearing sessionStorage...', preserveWallet ? '(preserving wallet backup)' : '');
    
    if (typeof sessionStorage !== 'undefined') {
      const sessionKeys = Object.keys(sessionStorage).filter(key => {
        const isAuth = key.startsWith('supabase') || key.includes('auth');
        const isWallet = key.includes('wallet');
        
        // If preserving wallet, only remove auth keys, not wallet keys
        return preserveWallet ? isAuth : (isAuth || isWallet);
      });
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage key: ${key}`);
      });
      
      if (preserveWallet) {
        console.log('💾 Preserved wallet backup in sessionStorage');
      }
    }
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

// Disconnect wallet extensions
const disconnectWalletExtensions = async () => {
  try {
    console.log('🔌 Disconnecting wallet extensions...');
    
    // MetaMask disconnect - only clear without triggering dialogs
    if (window.ethereum && window.ethereum.isMetaMask) {
      try {
        // Try to clear permissions silently (newer MetaMask versions)
        if (window.ethereum.request) {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          }).catch(() => {
            // If revoke fails, just log - don't trigger account requests
            console.log('🦊 MetaMask permission revoke not available');
          });
        }
        console.log('🦊 MetaMask disconnected');
      } catch (error) {
        console.log('MetaMask disconnect error (expected):', error);
      }
    }
    
    // OKX Wallet disconnect - only clear without triggering dialogs
    if (window.okxwallet) {
      try {
        await window.okxwallet.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        }).catch(() => {
          // If revoke fails, just log - don't trigger account requests
          console.log('🔶 OKX Wallet permission revoke not available');
        });
        console.log('🔶 OKX Wallet disconnected');
      } catch (error) {
        console.log('OKX disconnect error (expected):', error);
      }
    }
    
    // Generic ethereum provider disconnect
    if (window.ethereum) {
      try {
        // Try to clear any cached accounts using type assertion
        const ethProvider = window.ethereum as any;
        if (ethProvider.selectedAddress) {
          ethProvider.selectedAddress = null;
        }
        console.log('⚡ Generic wallet provider cleared');
      } catch (error) {
        console.log('Generic wallet disconnect error:', error);
      }
    }
    
  } catch (error) {
    console.error('Error disconnecting wallets:', error);
  }
};

// Supabase sign out with error handling
const performSupabaseSignOut = async () => {
  try {
    console.log('🔐 Signing out from Supabase...');
    
    // Attempt global sign out
    const { error } = await supabase.auth.signOut({ 
      scope: 'global' 
    });
    
    if (error) {
      console.warn('Supabase signOut warning:', error);
    } else {
      console.log('✅ Supabase sign out successful');
    }
    
  } catch (error) {
    console.error('Supabase signOut error:', error);
    // Continue - don't throw as this shouldn't block cleanup
  }
};

// Browser compatibility check
export const isBrowserCompatible = () => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' &&
         'addEventListener' in document;
};

// Emergency cleanup (synchronous version for unload events)
export const emergencyCleanup = () => {
  console.log('🚨 Emergency cleanup triggered');
  
  try {
    // Only synchronous operations for unload events
    clearLocalStorage();
    clearSessionStorage();
    
    // Quick wallet cleanup (no async calls)
    const ethProvider = window.ethereum as any;
    if (ethProvider?.selectedAddress) {
      ethProvider.selectedAddress = null;
    }
    
  } catch (error) {
    console.error('Emergency cleanup error:', error);
  }
};