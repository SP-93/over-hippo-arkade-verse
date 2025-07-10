import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface Game3DFallbackProps {
  loading?: boolean;
  error?: boolean;
  retryCount?: number;
  onRetry?: () => void;
  onBackToArcade?: () => void;
}

export const Game3DFallback = ({ 
  loading = false, 
  error = false, 
  retryCount = 0,
  onRetry,
  onBackToArcade 
}: Game3DFallbackProps) => {
  if (loading) {
    return (
      <div className="h-[600px] bg-black rounded-lg overflow-hidden border-2 border-neon-green shadow-lg shadow-neon-green/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-neon-green animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-neon-green font-bold">Loading 3D Engine...</p>
            <p className="text-sm text-muted-foreground">Initializing WebGL context</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] bg-black rounded-lg overflow-hidden border-2 border-destructive shadow-lg shadow-destructive/20 flex items-center justify-center">
        <Card className="p-6 bg-gradient-card border-destructive max-w-md">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-destructive mb-2">
                3D Engine Failed
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to initialize 3D graphics. Your device might not support WebGL.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {retryCount < 3 && onRetry && (
                <Button variant="destructive" size="sm" onClick={onRetry}>
                  Retry ({3 - retryCount} attempts left)
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onBackToArcade}>
                Back to Arcade
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-black rounded-lg overflow-hidden border-2 border-neon-green shadow-lg shadow-neon-green/20 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-neon-green">3D Engine Ready</p>
      </div>
    </div>
  );
};