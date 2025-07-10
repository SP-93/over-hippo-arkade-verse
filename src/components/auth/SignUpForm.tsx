import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";

interface SignUpFormProps {
  onSubmit: (email: string, password: string, displayName: string) => void;
  isLoading: boolean;
}

export const SignUpForm = ({ onSubmit, isLoading }: SignUpFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { validatePassword } = useEnhancedAuth();

  const passwordValidation = validatePassword(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValidation.isValid && password) {
      return; // Don't submit if password is invalid
    }
    onSubmit(email, password, displayName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Display Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="pl-10"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
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
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password (min 6 characters)"
            className="pl-10"
            disabled={isLoading}
            minLength={6}
            required
          />
        </div>
        {password && (
          <PasswordStrengthIndicator 
            password={password} 
            className="mt-2"
          />
        )}
      </div>

      <Button
        type="submit" 
        className="w-full" 
        variant="arcade"
        disabled={isLoading || (password && !passwordValidation.isValid)}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
};