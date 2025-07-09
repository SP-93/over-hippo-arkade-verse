import { supabase } from "@/integrations/supabase/client";

// Complete security cleanup function
export const performSecurityCleanup = async () => {
  console.log('🧹 Starting comprehensive security cleanup...');
  
  try {
    // 1. Clear all localStorage data
    clearLocalStorage();
    
    // 2. Clear all sessionStorage data
    clearSessionStorage();
    
    // 3. Disconnect wallet extensions
    await disconnectWalletExtensions();
    
    // 4. Sign out from Supabase (with global scope)
    await performSupabaseSignOut();
    
    console.log('✅ Security cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during security cleanup:', error);
    // Continue with cleanup even if some steps fail
  }
};

// Clear localStorage with specific focus on auth and wallet data
const clearLocalStorage = () => {
  try {
    console.log('🗄️ Clearing localStorage...');
    
    // Supabase auth keys to remove
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || 
      key.includes('sb-') ||
      key.startsWith('sb-')
    );
    
    // App-specific keys to remove
    const appKeys = [
      'wallet_connection',
      'current_view',
      'player_chips',
      'user_session',
      'auth_state'
    ];
    
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
    
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Clear sessionStorage
const clearSessionStorage = () => {
  try {
    console.log('📋 Clearing sessionStorage...');
    
    if (typeof sessionStorage !== 'undefined') {
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('supabase') || 
        key.includes('auth') ||
        key.includes('wallet')
      );
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage key: ${key}`);
      });
    }
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

// Disconnect wallet extensions
const disconnectWalletExtensions = async () => {
  try {
    console.log('🔌 Disconnecting wallet extensions...');
    
    // MetaMask disconnect
    if (window.ethereum && window.ethereum.isMetaMask) {
      try {
        // Clear MetaMask permissions (if supported)
        if (window.ethereum.request) {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          }).catch(() => {
            // Fallback: request accounts to trigger disconnect
            window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => {});
          });
        }
        console.log('🦊 MetaMask disconnected');
      } catch (error) {
        console.log('MetaMask disconnect error (expected):', error);
      }
    }
    
    // OKX Wallet disconnect
    if (window.okxwallet) {
      try {
        await window.okxwallet.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        }).catch(() => {});
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