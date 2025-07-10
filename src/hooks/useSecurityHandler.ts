import { useEffect, useCallback, useRef } from 'react';
import { 
  detectBrowserCapabilities, 
  getBrowserOptimizedSettings, 
  fallbackSecurityCleanup, 
  needsFallbackCleanup,
  detectWalletExtensions 
} from '@/utils/browserCompatibility';

interface SecurityHandlerOptions {
  onSecurityCleanup: () => void;
  sessionTimeoutMs?: number;
  debounceMs?: number;
}

export const useSecurityHandler = ({
  onSecurityCleanup,
  sessionTimeoutMs,
  debounceMs
}: SecurityHandlerOptions) => {
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const isCleaningUpRef = useRef<boolean>(false);

  // Get browser-optimized settings
  const browserSettings = getBrowserOptimizedSettings();
  const capabilities = detectBrowserCapabilities();
  
  // Use browser-optimized values or provided values
  const finalSessionTimeout = sessionTimeoutMs ?? browserSettings.sessionTimeoutMs;
  const finalDebounceMs = debounceMs ?? browserSettings.debounceMs;

  // Log browser compatibility on mount (without triggering wallet detection)
  useEffect(() => {
    console.log('🌐 Browser capabilities:', capabilities);
    console.log('⚙️ Browser-optimized settings for', capabilities.browserType, ':', browserSettings);
    
    if (needsFallbackCleanup()) {
      console.warn('⚠️ Browser needs fallback cleanup methods');
    }
  }, []);

  // Enhanced cleanup with fallback support
  const performCleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    isCleaningUpRef.current = true;
    console.log('🔒 Enhanced security cleanup triggered');
    
    try {
      if (needsFallbackCleanup()) {
        console.log('🔄 Using fallback cleanup for browser compatibility');
        fallbackSecurityCleanup();
      }
      
      // Call the main cleanup function
      onSecurityCleanup();
      
    } catch (error) {
      console.error('❌ Security cleanup failed, using emergency fallback:', error);
      fallbackSecurityCleanup();
    }
  }, [onSecurityCleanup]);

  // Debounced cleanup to prevent multiple rapid calls
  const debouncedCleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    cleanupTimeoutRef.current = setTimeout(() => {
      performCleanup();
    }, finalDebounceMs);
  }, [performCleanup, finalDebounceMs]);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    
    if (timeSinceActivity > finalSessionTimeout) {
      console.log('🕐 Session timeout - triggering cleanup');
      debouncedCleanup();
    }
  }, [finalSessionTimeout, debouncedCleanup]);

  useEffect(() => {
    // Page visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - starting inactivity timer');
        // Only cleanup after extended inactivity, not immediate page hide
        setTimeout(() => {
          if (document.hidden) {
            console.log('📱 Page still hidden after timeout - triggering cleanup');
            debouncedCleanup();
          }
        }, 30000); // 30 seconds before cleanup
      } else {
        updateActivity();
      }
    };

    // Before unload handler - only warn, don't cleanup (page refresh safe)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚪 Before unload - page refresh or navigation detected');
      // Don't cleanup here - this fires on page refresh too!
      // Optional: Show confirmation dialog only for actual navigation
      // event.preventDefault();
      // return (event.returnValue = '');
    };

    // Unload handler (final cleanup) - only for actual page close
    const handleUnload = () => {
      console.log('🔚 Page unload - emergency cleanup only');
      // Use emergency cleanup for unload (synchronous only)
      try {
        // Only clear truly sensitive data, preserve wallet for page refresh
        const sensitiveKeys = ['user_session', 'auth_state'];
        sensitiveKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        });
        console.log('🗑️ Emergency cleanup: cleared auth data only (preserved wallet)');
      } catch (error) {
        console.error('Emergency cleanup error:', error);
      }
    };

    // Page focus/blur handlers
    const handleFocus = () => {
      updateActivity();
    };

    const handleBlur = () => {
      console.log('👁️ Page blur - updating activity');
      updateActivity(); // Just update activity, don't cleanup on blur
    };

    // Activity tracking handlers
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Session timeout checker (runs every minute)
    const timeoutChecker = setInterval(checkSessionTimeout, 60000);

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    console.log('🛡️ Security handler initialized');

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      clearInterval(timeoutChecker);
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      console.log('🛡️ Security handler cleaned up');
    };
  }, [debouncedCleanup, onSecurityCleanup, updateActivity, checkSessionTimeout]);

  // Manual trigger for testing
  const triggerCleanup = useCallback(() => {
    debouncedCleanup();
  }, [debouncedCleanup]);

  return {
    triggerCleanup,
    updateActivity
  };
};