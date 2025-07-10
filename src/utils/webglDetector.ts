// PRIORITET 2: WebGL Detection and Progressive Enhancement

export interface WebGLCapabilities {
  webgl1: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  maxVertices: number;
  extensions: string[];
  vendor: string;
  renderer: string;
  version: string;
  performanceLevel: 'high' | 'medium' | 'low' | 'fallback';
}

export class WebGLDetector {
  private static instance: WebGLDetector;
  private capabilities: WebGLCapabilities | null = null;

  static getInstance(): WebGLDetector {
    if (!WebGLDetector.instance) {
      WebGLDetector.instance = new WebGLDetector();
    }
    return WebGLDetector.instance;
  }

  detect(): WebGLCapabilities {
    if (this.capabilities) return this.capabilities;

    console.log('🔍 Detecting WebGL capabilities...');
    
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    const capabilities: WebGLCapabilities = {
      webgl1: !!gl1,
      webgl2: !!gl2,
      maxTextureSize: 0,
      maxVertices: 0,
      extensions: [],
      vendor: 'unknown',
      renderer: 'unknown', 
      version: 'unknown',
      performanceLevel: 'fallback'
    };

    const gl = gl2 || gl1;
    
    if (gl && (gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext)) {
      try {
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        capabilities.maxVertices = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        capabilities.vendor = gl.getParameter(gl.VENDOR);
        capabilities.renderer = gl.getParameter(gl.RENDERER);
        capabilities.version = gl.getParameter(gl.VERSION);
        
        // Get extensions
        const ext = gl.getSupportedExtensions();
        capabilities.extensions = ext || [];
        
        // Determine performance level
        capabilities.performanceLevel = this.determinePerformanceLevel(capabilities);
        
        console.log('✅ WebGL capabilities detected:', capabilities);
      } catch (error) {
        console.error('❌ Error detecting WebGL capabilities:', error);
      }
    }

    this.capabilities = capabilities;
    return capabilities;
  }

  private determinePerformanceLevel(caps: WebGLCapabilities): 'high' | 'medium' | 'low' | 'fallback' {
    if (!caps.webgl1) return 'fallback';
    
    // Check for high performance indicators
    if (caps.webgl2 && 
        caps.maxTextureSize >= 4096 && 
        caps.extensions.includes('EXT_texture_filter_anisotropic')) {
      return 'high';
    }
    
    // Check for medium performance
    if (caps.webgl1 && caps.maxTextureSize >= 2048) {
      return 'medium';
    }
    
    // Low performance but still usable
    if (caps.webgl1) {
      return 'low';
    }
    
    return 'fallback';
  }

  shouldUse3D(): boolean {
    const caps = this.detect();
    return caps.performanceLevel !== 'fallback';
  }

  getRecommendedSettings() {
    const caps = this.detect();
    
    switch (caps.performanceLevel) {
      case 'high':
        return {
          antialias: true,
          shadows: true,
          particles: true,
          maxLights: 4,
          textureQuality: 'high',
          renderScale: 1.0
        };
      case 'medium':
        return {
          antialias: false,
          shadows: false,
          particles: true,
          maxLights: 2,
          textureQuality: 'medium',
          renderScale: 0.8
        };
      case 'low':
        return {
          antialias: false,
          shadows: false,
          particles: false,
          maxLights: 1,
          textureQuality: 'low',
          renderScale: 0.6
        };
      default:
        return {
          antialias: false,
          shadows: false,
          particles: false,
          maxLights: 0,
          textureQuality: 'minimal',
          renderScale: 0.5
        };
    }
  }
}

export const webglDetector = WebGLDetector.getInstance();