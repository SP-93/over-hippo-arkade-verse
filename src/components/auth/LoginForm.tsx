import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, AlertTriangle, Clock } from "lucide-react";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { lockoutInfo, checkAccountLockout } = useEnhancedAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  // Check for lockout when email changes
  useEffect(() => {
    if (email && email.includes('@')) {
      checkAccountLockout(email);
    }
  }, [email, checkAccountLockout]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account Lockout Warning */}
      {lockoutInfo.isLocked && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Account is temporarily locked due to multiple failed login attempts.
              {lockoutInfo.lockedUntil && (
                <span>Try again after {new Date(lockoutInfo.lockedUntil).toLocaleTimeString()}.</span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="pl-10"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        variant="neon"
        disabled={isLoading || lockoutInfo.isLocked}
      >
        {isLoading ? "Signing In..." : lockoutInfo.isLocked ? "Account Locked" : "Sign In"}
      </Button>
    </form>
  );
};