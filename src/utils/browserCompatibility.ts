// Browser compatibility utilities for security features

export interface BrowserCapabilities {
  supportsVisibilityAPI: boolean;
  supportsBeforeUnload: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  hasWalletExtensions: boolean;
  browserType: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
}

// Detect browser capabilities
export const detectBrowserCapabilities = (): BrowserCapabilities => {
  const capabilities: BrowserCapabilities = {
    supportsVisibilityAPI: false,
    supportsBeforeUnload: false,
    supportsLocalStorage: false,
    supportsSessionStorage: false,
    hasWalletExtensions: false,
    browserType: 'unknown'
  };

  // Safe feature detection
  try {
    // Visibility API support
    capabilities.supportsVisibilityAPI = 
      typeof document !== 'undefined' && 
      'visibilityState' in document && 
      'addEventListener' in document;

    // Before unload support
    capabilities.supportsBeforeUnload = 
      typeof window !== 'undefined' && 
      'addEventListener' in window;

    // Storage support
    capabilities.supportsLocalStorage = 
      typeof localStorage !== 'undefined' && 
      localStorage !== null;

    capabilities.supportsSessionStorage = 
      typeof sessionStorage !== 'undefined' && 
      sessionStorage !== null;

    // Wallet extensions detection
    capabilities.hasWalletExtensions = 
      typeof window !== 'undefined' && 
      (window.ethereum !== undefined || window.okxwallet !== undefined);

    // Browser type detection
    capabilities.browserType = detectBrowserType();

  } catch (error) {
    console.warn('Browser capability detection failed:', error);
  }

  return capabilities;
};

// Detect browser type
export const detectBrowserType = (): BrowserCapabilities['browserType'] => {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'chrome';
  } else if (userAgent.includes('firefox')) {
    return 'firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari';
  } else if (userAgent.includes('edg')) {
    return 'edge';
  }
  
  return 'unknown';
};

// Fallback security cleanup for older browsers
export const fallbackSecurityCleanup = () => {
  console.log('🔄 Using fallback security cleanup for older browser');
  
  try {
    // Basic localStorage cleanup
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('wallet') || key.includes('auth')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Fallback removed: ${key}`);
        }
      });
    }

    // Basic sessionStorage cleanup
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      console.log('🗑️ Fallback cleared sessionStorage');
    }

    // Basic wallet cleanup
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Simple disconnect attempt
        (window.ethereum as any).selectedAddress = null;
        console.log('🔌 Fallback wallet disconnect attempted');
      } catch (error) {
        console.log('Fallback wallet disconnect failed (expected)');
      }
    }

  } catch (error) {
    console.error('Fallback cleanup error:', error);
  }
};

// Check if current browser needs fallback
export const needsFallbackCleanup = (): boolean => {
  const capabilities = detectBrowserCapabilities();
  
  return (
    !capabilities.supportsVisibilityAPI ||
    !capabilities.supportsBeforeUnload ||
    !capabilities.supportsLocalStorage
  );
};

// Enhanced wallet extension detection
export const detectWalletExtensions = () => {
  const extensions = {
    metamask: false,
    okx: false,
    trustwallet: false,
    coinbase: false,
    phantom: false
  };

  try {
    if (typeof window !== 'undefined') {
      const ethereum = window.ethereum as any;
      const windowAny = window as any;
      
      // MetaMask
      extensions.metamask = !!(ethereum && ethereum.isMetaMask);
      
      // OKX Wallet
      extensions.okx = !!(window.okxwallet || (ethereum && ethereum.isOKX));
      
      // Trust Wallet
      extensions.trustwallet = !!(ethereum && ethereum.isTrust);
      
      // Coinbase Wallet
      extensions.coinbase = !!(ethereum && ethereum.isCoinbaseWallet);
      
      // Phantom (Solana, but sometimes available)
      extensions.phantom = !!(windowAny.phantom || windowAny.solana);
      
      console.log('🔍 Detected wallet extensions:', extensions);
    }
  } catch (error) {
    console.warn('Wallet detection failed:', error);
  }

  return extensions;
};

// Browser-specific optimization
export const getBrowserOptimizedSettings = () => {
  const browserType = detectBrowserType();
  
  const settings = {
    debounceMs: 500,
    sessionTimeoutMs: 15 * 60 * 1000, // 15 minutes
    useVisibilityAPI: true,
    useBeforeUnload: true
  };

  // Browser-specific adjustments
  switch (browserType) {
    case 'safari':
      // Safari has stricter beforeunload handling
      settings.debounceMs = 300;
      settings.useBeforeUnload = false; // Safari blocks it in many cases
      break;
      
    case 'firefox':
      // Firefox handles visibility API well
      settings.debounceMs = 400;
      break;
      
    case 'chrome':
      // Chrome handles everything well
      settings.debounceMs = 500;
      break;
      
    case 'edge':
      // Edge is Chromium-based
      settings.debounceMs = 500;
      break;
      
    default:
      // Conservative settings for unknown browsers
      settings.debounceMs = 1000;
      settings.sessionTimeoutMs = 10 * 60 * 1000; // 10 minutes
      break;
  }

  console.log(`⚙️ Browser-optimized settings for ${browserType}:`, settings);
  return settings;
};