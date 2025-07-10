import React, { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MemoryStats {
  usedHeapSize: number;
  totalHeapSize: number;
  heapSizeLimit: number;
}

export const useMemoryOptimizer = () => {
  const cleanupTasks = useRef<(() => void)[]>([]);
  const lastCleanupTime = useRef<number>(Date.now());

  // Get memory statistics if available
  const getMemoryStats = useCallback((): MemoryStats | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedHeapSize: memory.usedJSHeapSize,
        totalHeapSize: memory.totalJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // Register cleanup task
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupTasks.current.push(cleanupFn);
    
    return () => {
      const index = cleanupTasks.current.indexOf(cleanupFn);
      if (index > -1) {
        cleanupTasks.current.splice(index, 1);
      }
    };
  }, []);

  // Force garbage collection and cleanup
  const performCleanup = useCallback(async () => {
    console.log('🧹 Performing memory cleanup...');
    
    // Run all registered cleanup tasks
    cleanupTasks.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });

    // Clear WeakMap and WeakSet references
    if (typeof window !== 'undefined') {
      // Clear any cached data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(name => caches.delete(name))
          );
        } catch (error) {
          console.error('Cache cleanup failed:', error);
        }
      }
    }

    // Log memory stats after cleanup
    const memStats = getMemoryStats();
    if (memStats) {
      console.log('📊 Memory after cleanup:', {
        used: `${(memStats.usedHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memStats.totalHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memStats.heapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });

      // Log to database
      try {
        await supabase.rpc('record_performance_metric', {
          p_metric_type: 'memory',
          p_metric_name: 'cleanup_performed',
          p_metric_value: memStats.usedHeapSize / 1024 / 1024,
          p_metric_unit: 'MB'
        });
      } catch (error) {
        console.error('Failed to log memory metric:', error);
      }
    }

    lastCleanupTime.current = Date.now();
  }, [getMemoryStats]);

  // Auto cleanup based on memory pressure
  const checkMemoryPressure = useCallback(() => {
    const memStats = getMemoryStats();
    if (!memStats) return;

    const usagePercent = (memStats.usedHeapSize / memStats.heapSizeLimit) * 100;
    const timeSinceLastCleanup = Date.now() - lastCleanupTime.current;

    // Trigger cleanup if memory usage is high or it's been a while
    if (usagePercent > 75 || timeSinceLastCleanup > 300000) { // 5 minutes
      performCleanup();
    }
  }, [getMemoryStats, performCleanup]);

  // Monitor memory pressure
  useEffect(() => {
    const interval = setInterval(checkMemoryPressure, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(interval);
      // Run final cleanup on unmount
      performCleanup();
    };
  }, [checkMemoryPressure, performCleanup]);

  // Memory-aware component factory
  const createMemoryAwareComponent = useCallback(<T extends Record<string, any>>(
    component: React.ComponentType<T>,
    displayName: string
  ) => {
    const MemoryAwareComponent = React.memo(component);
    MemoryAwareComponent.displayName = `MemoryOptimized(${displayName})`;
    
    // Register cleanup for this component
    registerCleanup(() => {
      console.log(`🧹 Cleaning up ${displayName}`);
    });
    
    return MemoryAwareComponent;
  }, [registerCleanup]);

  return {
    getMemoryStats,
    performCleanup,
    registerCleanup,
    createMemoryAwareComponent,
    checkMemoryPressure
  };
};