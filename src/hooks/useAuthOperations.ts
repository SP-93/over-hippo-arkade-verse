import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (email: string, password: string, onSuccess: () => void) => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      toast.loading("Signing in...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Successfully signed in!");
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, displayName: string, onSuccess: () => void) => {
    if (!email || !password || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      toast.loading("Creating account...");
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
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
          // Email already confirmed, can proceed
          toast.success("Account created successfully!");
          setTimeout(() => {
            onSuccess();
          }, 100);
        } else {
          // Email confirmation required
          toast.success("Account created! Please check your email to confirm your account.");
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message.includes('already registered')) {
        toast.error("Email already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSignIn,
    handleSignUp,
    cleanupAuthState
  };
};