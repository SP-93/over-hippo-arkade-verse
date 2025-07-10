import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  gameId?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class Game3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Game Error:', error, errorInfo);
    
    // Log WebGL context issues
    if (error.message.includes('WebGL') || error.message.includes('context')) {
      console.error('WebGL Context Error detected');
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const isWebGLError = this.state.error?.message.includes('WebGL') || 
                          this.state.error?.message.includes('context');
      
      return (
        <Card className="p-8 bg-gradient-card border-destructive min-h-96">
          <div className="text-center space-y-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-destructive mb-2">
                3D Game Error
              </h3>
              <p className="text-muted-foreground mb-4">
                {isWebGLError 
                  ? "WebGL is not available or has issues. Your browser might not support 3D graphics."
                  : "The 3D game engine encountered an error."
                }
              </p>
              {this.state.retryCount < 3 && (
                <Button 
                  variant="destructive" 
                  onClick={this.handleRetry}
                  className="mr-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Game ({3 - this.state.retryCount} attempts left)
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Return to Arcade
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details (Development)
                </summary>
                <pre className="text-xs mt-2 whitespace-pre-wrap">
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