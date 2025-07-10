import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionInfo {
  isActive: boolean;
  timeRemaining: number;
  warningShown: boolean;
  lastActivity: number;
}

export const useSessionManager = (timeoutMinutes: number = 30) => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isActive: false,
    timeRemaining: timeoutMinutes * 60,
    warningShown: false,
    lastActivity: Date.now()
  });

  const warningThreshold = 5 * 60; // 5 minutes warning
  
  // Update last activity
  const updateActivity = useCallback(() => {
    setSessionInfo(prev => ({
      ...prev,
      lastActivity: Date.now(),
      timeRemaining: timeoutMinutes * 60,
      warningShown: false
    }));
  }, [timeoutMinutes]);

  // Force logout
  const forceLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.info("Session expired. Please sign in again.");
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during force logout:', error);
    }
  }, []);

  // Extend session
  const extendSession = useCallback(() => {
    updateActivity();
    toast.success("Session extended");
  }, [updateActivity]);

  // Check session validity
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionInfo(prev => ({ ...prev, isActive: true }));
        updateActivity();
      }
    };

    checkSession();
  }, [updateActivity]);

  // Session countdown timer
  useEffect(() => {
    if (!sessionInfo.isActive) return;

    const interval = setInterval(() => {
      setSessionInfo(prev => {
        const elapsed = Math.floor((Date.now() - prev.lastActivity) / 1000);
        const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);
        
        // Show warning at threshold
        if (remaining <= warningThreshold && !prev.warningShown && remaining > 0) {
          toast.warning(
            `Session will expire in ${Math.floor(remaining / 60)} minutes. Click to extend.`,
            {
              duration: 10000,
              action: {
                label: "Extend Session",
                onClick: extendSession
              }
            }
          );
          return { ...prev, timeRemaining: remaining, warningShown: true };
        }
        
        // Force logout when expired
        if (remaining === 0) {
          forceLogout();
          return { ...prev, timeRemaining: 0, isActive: false };
        }
        
        return { ...prev, timeRemaining: remaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo.isActive, timeoutMinutes, warningThreshold, extendSession, forceLogout]);

  // Listen for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (sessionInfo.isActive) {
        updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [sessionInfo.isActive, updateActivity]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSessionInfo(prev => ({ 
          ...prev, 
          isActive: true,
          lastActivity: Date.now(),
          timeRemaining: timeoutMinutes * 60,
          warningShown: false
        }));
      } else if (event === 'SIGNED_OUT') {
        setSessionInfo(prev => ({ 
          ...prev, 
          isActive: false,
          timeRemaining: 0
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [timeoutMinutes]);

  return {
    sessionInfo,
    extendSession,
    forceLogout,
    updateActivity,
    formatTimeRemaining: () => {
      const minutes = Math.floor(sessionInfo.timeRemaining / 60);
      const seconds = sessionInfo.timeRemaining % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };
};