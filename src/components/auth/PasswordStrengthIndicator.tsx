import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { enhancedAuthService } from "@/services/enhanced-auth";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const strength = enhancedAuthService.validatePasswordStrength(password);
  
  const getStrengthColor = () => {
    switch (strength.strength) {
      case 'weak': return 'text-red-500';
      case 'fair': return 'text-arcade-gold';
      case 'good': return 'text-blue-400';
      case 'strong': return 'text-neon-green';
      default: return 'text-muted-foreground';
    }
  };

  const getProgressValue = () => {
    return (strength.score / 6) * 100;
  };

  const getProgressColor = () => {
    switch (strength.strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-arcade-gold';
      case 'good': return 'bg-blue-400';
      case 'strong': return 'bg-neon-green';
      default: return 'bg-muted';
    }
  };

  if (!password) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        {strength.isValid ? (
          <CheckCircle className="h-4 w-4 text-neon-green" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${getStrengthColor()}`}>
          Password strength: {strength.strength}
        </span>
      </div>
      
      <Progress 
        value={getProgressValue()} 
        className="h-2 mb-2"
      />
      
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              {feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};