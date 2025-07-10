import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  networkRequests: number;
}

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  enableVirtualization: boolean;
  maxRenderTime: number;
}

export const usePerformanceOptimizer = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
    networkRequests: 0
  });

  const [settings, setSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableMemoization: true,
    enableVirtualization: false,
    maxRenderTime: 16 // 60fps target
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  // Performance measurement
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));

      // Auto-optimize if render time exceeds threshold
      if (renderTime > settings.maxRenderTime && !isOptimizing) {
        setIsOptimizing(true);
        optimizePerformance();
      }
    };
  }, [settings.maxRenderTime, isOptimizing]);

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  // Network request counting
  const trackNetworkRequests = useCallback(() => {
    const entries = performance.getEntriesByType('resource');
    setMetrics(prev => ({
      ...prev,
      networkRequests: entries.length
    }));
  }, []);

  // Performance optimization engine
  const optimizePerformance = useCallback(async () => {
    console.log('🚀 Performance optimization triggered');
    
    // Enable aggressive optimizations
    setSettings(prev => ({
      ...prev,
      enableLazyLoading: true,
      enableMemoization: true,
      enableVirtualization: metrics.componentCount > 50
    }));

    // Log performance metrics
    try {
      await supabase.rpc('record_performance_metric', {
        p_metric_type: 'optimization',
        p_metric_name: 'auto_optimization_triggered',
        p_metric_value: metrics.renderTime,
        p_metric_unit: 'ms',
        p_tags: {
          component_count: metrics.componentCount,
          memory_usage: metrics.memoryUsage,
          network_requests: metrics.networkRequests
        }
      });
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }

    setTimeout(() => setIsOptimizing(false), 1000);
  }, [metrics]);

  // Debounced performance tracking
  useEffect(() => {
    const interval = setInterval(() => {
      trackMemoryUsage();
      trackNetworkRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [trackMemoryUsage, trackNetworkRequests]);

  // Memoized optimization recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    
    if (metrics.renderTime > 16) {
      recs.push('Enable component memoization');
    }
    if (metrics.memoryUsage > 100) {
      recs.push('Implement memory cleanup');
    }
    if (metrics.networkRequests > 20) {
      recs.push('Add request caching');
    }
    if (metrics.componentCount > 50) {
      recs.push('Enable virtualization');
    }

    return recs;
  }, [metrics]);

  return {
    metrics,
    settings,
    recommendations,
    isOptimizing,
    measureRenderTime,
    optimizePerformance,
    updateSettings: setSettings
  };
};