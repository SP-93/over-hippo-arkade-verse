import { useEffect, useCallback, useRef } from 'react';

interface SecurityHandlerOptions {
  onSecurityCleanup: () => void;
  sessionTimeoutMs?: number;
  debounceMs?: number;
}

export const useSecurityHandler = ({
  onSecurityCleanup,
  sessionTimeoutMs = 30 * 60 * 1000, // 30 minutes default
  debounceMs = 1000
}: SecurityHandlerOptions) => {
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const isCleaningUpRef = useRef<boolean>(false);

  // Debounced cleanup to prevent multiple rapid calls
  const debouncedCleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    cleanupTimeoutRef.current = setTimeout(() => {
      isCleaningUpRef.current = true;
      console.log('🔒 Security cleanup triggered');
      onSecurityCleanup();
    }, debounceMs);
  }, [onSecurityCleanup, debounceMs]);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    
    if (timeSinceActivity > sessionTimeoutMs) {
      console.log('🕐 Session timeout - triggering cleanup');
      debouncedCleanup();
    }
  }, [sessionTimeoutMs, debouncedCleanup]);

  useEffect(() => {
    // Page visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - triggering security cleanup');
        debouncedCleanup();
      } else {
        updateActivity();
      }
    };

    // Before unload handler (when closing tab/browser)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚪 Before unload - triggering immediate cleanup');
      onSecurityCleanup(); // Immediate cleanup, no debounce
      
      // Optional: Show confirmation dialog
      // event.preventDefault();
      // return (event.returnValue = '');
    };

    // Unload handler (final cleanup)
    const handleUnload = () => {
      console.log('🔚 Page unload - final cleanup');
      onSecurityCleanup();
    };

    // Page focus/blur handlers
    const handleFocus = () => {
      updateActivity();
    };

    const handleBlur = () => {
      console.log('👁️ Page blur - potential security risk');
      debouncedCleanup();
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