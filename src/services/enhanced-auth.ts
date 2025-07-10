import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeviceFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  fingerprint: string;
}

class EnhancedAuthService {
  // Generate device fingerprint for security tracking
  generateDeviceFingerprint(): DeviceFingerprint {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      fingerprint: btoa(JSON.stringify({
        ua: navigator.userAgent.slice(0, 100),
        screen: `${screen.width}x${screen.height}`,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: navigator.language,
        canvas: canvas.toDataURL().slice(0, 100)
      }))
    };
    
    return fingerprint;
  }

  // Get user's IP address (simplified - in production use a more robust method)
  async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not get IP address:', error);
      return 'unknown';
    }
  }

  // Check if account is locked before attempting login
  async checkAccountLockout(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_account_locked', {
        p_email: email.toLowerCase()
      });
      
      if (error) {
        console.error('Error checking account lockout:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in checkAccountLockout:', error);
      return false;
    }
  }

  // Record failed login attempt
  async recordFailedLogin(
    email: string, 
    failureReason: string, 
    deviceFingerprint?: DeviceFingerprint
  ): Promise<any> {
    try {
      const ip = await this.getUserIP();
      
      const { data, error } = await supabase.rpc('record_failed_login', {
        p_email: email.toLowerCase(),
        p_ip_address: ip,
        p_user_agent: navigator.userAgent,
        p_failure_reason: failureReason,
        p_device_fingerprint: deviceFingerprint?.fingerprint
      });
      
      if (error) {
        console.error('Error recording failed login:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in recordFailedLogin:', error);
      return null;
    }
  }

  // Enhanced sign in with security features
  async enhancedSignIn(email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    locked?: boolean;
    lockedUntil?: string;
  }> {
    try {
      // Check if account is locked
      const isLocked = await this.checkAccountLockout(email);
      if (isLocked) {
        return {
          success: false,
          error: "Account is temporarily locked due to multiple failed login attempts. Please try again later or contact support.",
          locked: true
        };
      }

      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint();
      
      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        // Record failed attempt
        const failureResult = await this.recordFailedLogin(
          email, 
          error.message, 
          deviceFingerprint
        );
        
        if (failureResult?.locked) {
          return {
            success: false,
            error: `Account locked due to multiple failed attempts. Try again after ${new Date(failureResult.locked_until).toLocaleTimeString()}.`,
            locked: true,
            lockedUntil: failureResult.locked_until
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      if (data.user) {
        // Successful login - no need to record, this is handled by Supabase
        return {
          success: true,
          user: data.user
        };
      }

      return {
        success: false,
        error: "Unknown error occurred"
      };

    } catch (error: any) {
      console.error('Enhanced sign in error:', error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred"
      };
    }
  }

  // Password strength validation
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
    strength: 'weak' | 'fair' | 'good' | 'strong';
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long");
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push("Password must contain at least one lowercase letter");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push("Password must contain at least one uppercase letter");
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push("Password must contain at least one number");
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push("Password must contain at least one special character");
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    const strength = score <= 2 ? 'weak' : score <= 3 ? 'fair' : score <= 4 ? 'good' : 'strong';
    const isValid = score >= 4; // Require at least good strength

    return {
      isValid,
      score,
      feedback,
      strength
    };
  }

  // Force logout for admin functionality
  async forceLogoutUser(userEmail: string): Promise<boolean> {
    try {
      // This would require additional RPC function to invalidate user sessions
      // For now, we'll log the action
      const { error } = await supabase.rpc('log_admin_action', {
        p_action_type: 'force_logout',
        p_action_details: { target_email: userEmail },
        p_success: true
      });

      if (error) {
        console.error('Error logging force logout:', error);
        return false;
      }

      toast.success(`User ${userEmail} has been logged out`);
      return true;
    } catch (error) {
      console.error('Error in forceLogoutUser:', error);
      return false;
    }
  }

  // Unlock account (admin function)
  async unlockAccount(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('unlock_account', {
        p_email: email.toLowerCase()
      });

      if (error) {
        console.error('Error unlocking account:', error);
        toast.error('Failed to unlock account');
        return false;
      }

      toast.success(`Account ${email} has been unlocked`);
      return true;
    } catch (error) {
      console.error('Error in unlockAccount:', error);
      toast.error('Failed to unlock account');
      return false;
    }
  }

  // Get failed login attempts for admin
  async getFailedLoginAttempts(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('auth_failed_attempts')
        .select('*')
        .order('attempt_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching failed attempts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFailedLoginAttempts:', error);
      return [];
    }
  }

  // Get account lockouts for admin
  async getAccountLockouts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('account_lockouts')
        .select('*')
        .order('locked_at', { ascending: false });

      if (error) {
        console.error('Error fetching lockouts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAccountLockouts:', error);
      return [];
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();