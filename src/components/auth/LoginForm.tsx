import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
};