/**
 * WebGL Context Recovery Manager
 * Handles WebGL context loss and recovery for 3D games
 */

export interface WebGLContextManagerOptions {
  canvas?: HTMLCanvasElement;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  autoRestart?: boolean;
}

export class WebGLContextManager {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private contextLostListener: (event: Event) => void;
  private contextRestoredListener: (event: Event) => void;
  private options: WebGLContextManagerOptions;
  private isContextLost = false;

  constructor(options: WebGLContextManagerOptions = {}) {
    this.options = { autoRestart: true, ...options };

    this.contextLostListener = (event: Event) => {
      console.warn('🔥 WebGL context lost');
      event.preventDefault();
      this.isContextLost = true;
      this.options.onContextLost?.();
    };

    this.contextRestoredListener = (event: Event) => {
      console.log('✨ WebGL context restored');
      this.isContextLost = false;
      this.options.onContextRestored?.();
      
      if (this.options.autoRestart) {
        // Auto-restart after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    if (options.canvas) {
      this.attachToCanvas(options.canvas);
    }
  }

  attachToCanvas(canvas: HTMLCanvasElement) {
    if (this.canvas) {
      this.detachFromCanvas();
    }

    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    // Add context event listeners
    canvas.addEventListener('webglcontextlost', this.contextLostListener);
    canvas.addEventListener('webglcontextrestored', this.contextRestoredListener);

    console.log('🎮 WebGL context manager attached to canvas');
  }

  detachFromCanvas() {
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.contextLostListener);
      this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredListener);
      this.canvas = null;
      this.gl = null;
    }
  }

  isContextAvailable(): boolean {
    return !this.isContextLost && this.gl !== null;
  }

  forceContextLoss() {
    if (this.gl) {
      const loseContext = this.gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
  }

  getContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this.isContextLost ? null : this.gl;
  }

  dispose() {
    this.detachFromCanvas();
  }
}

// Global instance for easy access
export const globalWebGLManager = new WebGLContextManager({
  autoRestart: true,
  onContextLost: () => {
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('webglContextLost'));
  },
  onContextRestored: () => {
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('webglContextRestored'));
  }
});

// Helper function to safely execute WebGL operations
export function withWebGLContext<T>(
  operation: (gl: WebGLRenderingContext | WebGL2RenderingContext) => T,
  fallback?: () => T
): T | null {
  try {
    const gl = globalWebGLManager.getContext();
    if (gl && globalWebGLManager.isContextAvailable()) {
      return operation(gl);
    } else {
      console.warn('⚠️ WebGL context not available, using fallback');
      return fallback ? fallback() : null;
    }
  } catch (error) {
    console.error('❌ WebGL operation failed:', error);
    return fallback ? fallback() : null;
  }
}

// Defensive Three.js object operations
export function safeThreeOperation<T>(
  operation: () => T,
  fallback?: () => T,
  errorMessage = 'Three.js operation failed'
): T | null {
  try {
    if (!globalWebGLManager.isContextAvailable()) {
      console.warn('⚠️ WebGL context not available for Three.js operation');
      return fallback ? fallback() : null;
    }
    return operation();
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error);
    return fallback ? fallback() : null;
  }
}