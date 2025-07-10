// Enhanced 3D Game Detection and Browser Compatibility
export interface Game3DCapabilities {
  webglSupported: boolean;
  webgl2Supported: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  recommendedMode: '2d' | '3d' | 'hybrid';
  browserCompatibility: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
    mobile: boolean;
  };
}

export class Game3DDetection {
  private static canvas: HTMLCanvasElement | null = null;
  
  static detect(): Game3DCapabilities {
    const canvas = this.getCanvas();
    const webglSupported = this.testWebGL(canvas);
    const webgl2Supported = this.testWebGL2(canvas);
    const performanceLevel = this.assessPerformance();
    const browserCompatibility = this.checkBrowserCompatibility();
    
    // Determine recommended mode based on capabilities
    let recommendedMode: '2d' | '3d' | 'hybrid' = '2d';
    
    if (webglSupported && performanceLevel !== 'low') {
      recommendedMode = '3d';
    } else if (webglSupported) {
      recommendedMode = 'hybrid'; // 2D gameplay with 3D effects
    }
    
    return {
      webglSupported,
      webgl2Supported,
      performanceLevel,
      recommendedMode,
      browserCompatibility
    };
  }
  
  private static getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    return this.canvas;
  }
  
  private static testWebGL(canvas: HTMLCanvasElement): boolean {
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(gl && gl instanceof WebGLRenderingContext);
    } catch (error) {
      console.warn('WebGL test failed:', error);
      return false;
    }
  }
  
  private static testWebGL2(canvas: HTMLCanvasElement): boolean {
    try {
      const gl2 = canvas.getContext('webgl2');
      return !!(gl2 && gl2 instanceof WebGL2RenderingContext);
    } catch (error) {
      console.warn('WebGL2 test failed:', error);
      return false;
    }
  }
  
  private static assessPerformance(): 'low' | 'medium' | 'high' {
    // Simple performance assessment based on available features
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 1;
    
    if (hardwareConcurrency >= 8 && memory >= 4) {
      return 'high';
    } else if (hardwareConcurrency >= 4 && memory >= 2) {
      return 'medium';
    }
    return 'low';
  }
  
  private static checkBrowserCompatibility() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    return {
      chrome: userAgent.includes('chrome') && !userAgent.includes('edge'),
      firefox: userAgent.includes('firefox'),
      safari: userAgent.includes('safari') && !userAgent.includes('chrome'),
      edge: userAgent.includes('edge'),
      mobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    };
  }
  
  static getRecommendationMessage(capabilities: Game3DCapabilities): string {
    if (!capabilities.webglSupported) {
      return "WebGL not supported. Games will run in 2D mode for best compatibility.";
    }
    
    if (capabilities.recommendedMode === '3d') {
      return `Great! Your browser supports 3D games. Performance: ${capabilities.performanceLevel}`;
    }
    
    if (capabilities.recommendedMode === 'hybrid') {
      return "3D supported with basic performance. Some games may run in hybrid 2D/3D mode.";
    }
    
    return "Running in 2D mode for optimal performance on your device.";
  }
}

export const game3DDetection = Game3DDetection;