import { useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { globalWebGLManager, withWebGLContext } from '@/utils/webglContextManager';

interface MemoryOptimizerOptions {
  gameId: string;
  autoCleanupInterval?: number;
  maxMemoryUsage?: number;
  enableProfiling?: boolean;
}

export const useMemoryOptimizer = (options: MemoryOptimizerOptions) => {
  const {
    gameId,
    autoCleanupInterval = 30000, // 30 seconds
    maxMemoryUsage = 100, // 100MB
    enableProfiling = true
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const memoryProfileRef = useRef<{
    geometries: Set<THREE.BufferGeometry>;
    materials: Set<THREE.Material>;
    textures: Set<THREE.Texture>;
  }>({
    geometries: new Set(),
    materials: new Set(),
    textures: new Set()
  });

  // Register Three.js objects for tracking
  const registerGeometry = useCallback((geometry: THREE.BufferGeometry) => {
    if (enableProfiling) {
      memoryProfileRef.current.geometries.add(geometry);
    }
  }, [enableProfiling]);

  const registerMaterial = useCallback((material: THREE.Material) => {
    if (enableProfiling) {
      memoryProfileRef.current.materials.add(material);
    }
  }, [enableProfiling]);

  const registerTexture = useCallback((texture: THREE.Texture) => {
    if (enableProfiling) {
      memoryProfileRef.current.textures.add(texture);
    }
  }, [enableProfiling]);

  // Cleanup specific object types
  const cleanupGeometries = useCallback(() => {
    withWebGLContext(() => {
      memoryProfileRef.current.geometries.forEach(geometry => {
        try {
          if (geometry && typeof geometry.dispose === 'function') {
            geometry.dispose();
          }
        } catch (error) {
          console.warn('Error disposing geometry:', error);
        }
      });
      memoryProfileRef.current.geometries.clear();
      console.log(`🧹 Cleaned up geometries for ${gameId}`);
    });
  }, [gameId]);

  const cleanupMaterials = useCallback(() => {
    withWebGLContext(() => {
      memoryProfileRef.current.materials.forEach(material => {
        try {
          if (material && typeof material.dispose === 'function') {
            material.dispose();
          }
        } catch (error) {
          console.warn('Error disposing material:', error);
        }
      });
      memoryProfileRef.current.materials.clear();
      console.log(`🧹 Cleaned up materials for ${gameId}`);
    });
  }, [gameId]);

  const cleanupTextures = useCallback(() => {
    withWebGLContext(() => {
      memoryProfileRef.current.textures.forEach(texture => {
        try {
          if (texture && typeof texture.dispose === 'function') {
            texture.dispose();
          }
        } catch (error) {
          console.warn('Error disposing texture:', error);
        }
      });
      memoryProfileRef.current.textures.clear();
      console.log(`🧹 Cleaned up textures for ${gameId}`);
    });
  }, [gameId]);

  // Comprehensive memory cleanup
  const performMemoryCleanup = useCallback(() => {
    withWebGLContext((gl) => {
      console.log(`🧽 Starting memory cleanup for ${gameId}...`);
      
      // Cleanup tracked objects
      cleanupGeometries();
      cleanupMaterials();
      cleanupTextures();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
        console.log(`♻️ Forced garbage collection for ${gameId}`);
      }
      
      // WebGL context cleanup
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext && Math.random() < 0.01) { // Rare context reset
          console.log(`🔄 Performing rare WebGL context reset for ${gameId}`);
          ext.restoreContext();
        }
      }
      
      console.log(`✅ Memory cleanup completed for ${gameId}`);
    });
  }, [gameId, cleanupGeometries, cleanupMaterials, cleanupTextures]);

  // Check memory usage and trigger cleanup if needed
  const checkMemoryUsage = useCallback(() => {
    if ((performance as any).memory) {
      const memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      
      if (memoryUsage > maxMemoryUsage) {
        console.log(`⚠️ High memory usage detected: ${memoryUsage.toFixed(2)}MB for ${gameId}`);
        performMemoryCleanup();
      }
    }
  }, [maxMemoryUsage, gameId, performMemoryCleanup]);

  // Force cleanup (for manual trigger)
  const forceCleanup = useCallback(() => {
    performMemoryCleanup();
  }, [performMemoryCleanup]);

  // Get memory stats
  const getMemoryStats = useCallback(() => {
    const stats = {
      geometries: memoryProfileRef.current.geometries.size,
      materials: memoryProfileRef.current.materials.size,
      textures: memoryProfileRef.current.textures.size,
      totalObjects: memoryProfileRef.current.geometries.size + 
                   memoryProfileRef.current.materials.size + 
                   memoryProfileRef.current.textures.size
    };
    
    if ((performance as any).memory) {
      return {
        ...stats,
        heapUsed: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        heapTotal: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        heapLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    
    return stats;
  }, []);

  // Setup automatic cleanup interval
  useEffect(() => {
    if (autoCleanupInterval > 0) {
      intervalRef.current = setInterval(() => {
        checkMemoryUsage();
      }, autoCleanupInterval);
      
      console.log(`⏰ Memory optimizer started for ${gameId} (interval: ${autoCleanupInterval}ms)`);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoCleanupInterval, checkMemoryUsage, gameId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🧹 Final cleanup for ${gameId} on unmount`);
      performMemoryCleanup();
    };
  }, [gameId, performMemoryCleanup]);

  return {
    registerGeometry,
    registerMaterial,
    registerTexture,
    forceCleanup,
    getMemoryStats,
    checkMemoryUsage
  };
};