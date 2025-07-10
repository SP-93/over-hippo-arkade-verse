import { useState } from "react";
import { enhancedAuthService } from "@/services/enhanced-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEnhancedAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    lockedUntil?: string;
    attemptsRemaining?: number;
  }>({ isLocked: false });

  const handleEnhancedSignIn = async (
    email: string, 
    password: string, 
    onSuccess: () => void
  ) => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setLockoutInfo({ isLocked: false });

    try {
      toast.loading("Signing in...");
      
      const result = await enhancedAuthService.enhancedSignIn(email, password);
      
      if (result.success && result.user) {
        toast.success("Successfully signed in!");
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else if (result.locked) {
        setLockoutInfo({
          isLocked: true,
          lockedUntil: result.lockedUntil
        });
        toast.error(result.error || "Account is locked");
      } else {
        toast.error(result.error || "Failed to sign in");
      }
    } catch (error: any) {
      console.error('Enhanced sign in error:', error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancedSignUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    onSuccess: () => void
  ) => {
    if (!email || !password || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate password strength
    const passwordValidation = enhancedAuthService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast.error("Password does not meet security requirements");
      return;
    }

    setIsLoading(true);
    try {
      toast.loading("Creating account...");
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast.success("Account created successfully!");
          setTimeout(() => {
            onSuccess();
          }, 100);
        } else {
          toast.success("Account created! Please check your email to confirm your account.");
        }
      }
    } catch (error: any) {
      console.error('Enhanced sign up error:', error);
      if (error.message.includes('already registered')) {
        toast.error("Email already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccountLockout = async (email: string) => {
    try {
      const isLocked = await enhancedAuthService.checkAccountLockout(email);
      setLockoutInfo({ isLocked });
      return isLocked;
    } catch (error) {
      console.error('Error checking lockout:', error);
      return false;
    }
  };

  return {
    isLoading,
    lockoutInfo,
    handleEnhancedSignIn,
    handleEnhancedSignUp,
    checkAccountLockout,
    validatePassword: enhancedAuthService.validatePasswordStrength,
    unlockAccount: enhancedAuthService.unlockAccount,
    forceLogoutUser: enhancedAuthService.forceLogoutUser
  };
};