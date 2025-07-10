import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info } from "lucide-react";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { LoginForm } from "./auth/LoginForm";
import { SignUpForm } from "./auth/SignUpForm";
import { PlatformInfoModal } from "./PlatformInfoModal";

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthPage = ({ onSuccess, onBack }: AuthPageProps) => {
  const [showPlatformInfo, setShowPlatformInfo] = useState(false);
  const { isLoading, handleEnhancedSignIn, handleEnhancedSignUp } = useEnhancedAuth();

  const onSignInSubmit = (email: string, password: string) => {
    handleEnhancedSignIn(email, password, onSuccess);
  };

  const onSignUpSubmit = (email: string, password: string, displayName: string) => {
    handleEnhancedSignUp(email, password, displayName, onSuccess);
  };

  return (
    <Card className="p-8 bg-gradient-card border-neon-blue max-w-md mx-auto animate-glow">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-neon-blue">Authentication</h2>
      </div>
      
      <p className="text-muted-foreground mb-6 text-center">
        Sign in or create an account to connect your wallet
      </p>

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <LoginForm onSubmit={onSignInSubmit} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <SignUpForm onSubmit={onSignUpSubmit} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />
      
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={() => setShowPlatformInfo(true)}
          variant="outline"
          size="sm"
          className="border-neon-blue text-neon-blue hover:bg-neon-blue/10"
        >
          <Info className="h-4 w-4 mr-2" />
          Platform Information
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          After authentication, you'll be able to connect your wallet and start playing!
        </p>
      </div>

      <PlatformInfoModal 
        isOpen={showPlatformInfo} 
        onClose={() => setShowPlatformInfo(false)} 
      />
    </Card>
  );
};