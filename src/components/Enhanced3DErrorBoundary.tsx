import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  gameId?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  errorType: 'webgl' | 'texture' | 'font' | 'memory' | 'unknown';
}

export class Enhanced3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Classify error type based on error message
    const errorMessage = error.message.toLowerCase();
    let errorType: State['errorType'] = 'unknown';

    if (errorMessage.includes('webgl') || errorMessage.includes('context')) {
      errorType = 'webgl';
    } else if (errorMessage.includes('texture') || errorMessage.includes('loading')) {
      errorType = 'texture';
    } else if (errorMessage.includes('font') || errorMessage.includes('typeface')) {
      errorType = 'font';
    } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      errorType = 'memory';
    }

    return { 
      hasError: true, 
      error, 
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Enhanced 3D Error Boundary:', {
      error,
      errorInfo,
      gameId: this.props.gameId,
      errorType: this.state.errorType
    });

    // Force garbage collection if available
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        console.warn('Garbage collection failed:', e);
      }
    }

    // Clear any problematic Three.js resources
    this.cleanup3DResources();
  }

  cleanup3DResources = () => {
    try {
      // Clear Three.js cache
      if ((window as any).THREE) {
        // Clear cache if available
        if ((window as any).THREE.Cache) {
          (window as any).THREE.Cache.clear();
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup 3D resources:', e);
    }
  };

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      console.warn('Max retry attempts reached');
      return;
    }

    this.cleanup3DResources();
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));

    this.props.onReset?.();
  };

  getErrorMessage = () => {
    switch (this.state.errorType) {
      case 'webgl':
        return "WebGL context error. Your browser may not support 3D graphics or the GPU is unavailable.";
      case 'texture':
        return "3D texture loading failed. Some game assets couldn't be loaded.";
      case 'font':
        return "3D font loading failed. Using fallback display.";
      case 'memory':
        return "Memory allocation error. Try closing other browser tabs.";
      default:
        return "An unexpected 3D rendering error occurred.";
    }
  };

  getSuggestion = () => {
    switch (this.state.errorType) {
      case 'webgl':
        return "Try updating your browser or graphics drivers.";
      case 'texture':
        return "Check your internet connection and try again.";
      case 'font':
        return "The game will work without 3D text effects.";
      case 'memory':
        return "Close other tabs and refresh the page.";
      default:
        return "Please try refreshing the page.";
    }
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < 3;

      return (
        <Card className="p-8 bg-gradient-card border-destructive min-h-96">
          <div className="text-center space-y-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-destructive mb-2">
                3D Game Error - {this.state.errorType.toUpperCase()}
              </h3>
              <p className="text-muted-foreground mb-2">
                {this.getErrorMessage()}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {this.getSuggestion()}
              </p>
              
              <div className="flex gap-4 justify-center">
                {canRetry && (
                  <Button 
                    variant="destructive" 
                    onClick={this.handleRetry}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry ({3 - this.state.retryCount} attempts left)
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Arcade
                </Button>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-muted p-4 rounded-lg mt-4">
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