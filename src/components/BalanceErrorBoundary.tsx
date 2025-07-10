import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class BalanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Balance operation error:', error, errorInfo);
    
    // Log balance-related errors for monitoring
    if (error.message.includes('balance') || error.message.includes('chip')) {
      console.error('💰 Balance Error Context:', {
        error: error.message,
        stack: error.stack,
        props: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      toast.error("Maximum retry attempts reached. Please refresh the page.");
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
    
    // Trigger balance refresh
    window.dispatchEvent(new Event('balanceUpdated'));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const isBalanceError = this.state.error?.message.includes('balance') ||
                            this.state.error?.message.includes('chip') ||
                            this.state.error?.message.includes('insufficient');
      
      return (
        <Card className="p-6 bg-gradient-card border-destructive">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                {isBalanceError ? "Balance Operation Failed" : "Something went wrong"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isBalanceError 
                  ? "Unable to process balance operation. Please try again."
                  : "An unexpected error occurred. Your progress is safe."
                }
              </p>
              {this.state.retryCount < 3 && (
                <Button 
                  variant="destructive" 
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry ({3 - this.state.retryCount} attempts left)
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-muted p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}