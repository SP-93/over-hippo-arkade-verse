import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { webglDetector } from "@/utils/webglDetector";

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  frameCount: number;
}

export const usePerformanceMonitor = (gameType: string, sessionId?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    frameCount: 0
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let animationFrame: number;
    
    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      // Calculate FPS every second
      if (delta >= 1000) {
        const fps = (frameCountRef.current * 1000) / delta;
        fpsHistoryRef.current.push(fps);
        
        // Keep only last 10 FPS readings
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        
        // Get memory usage if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
        
        setMetrics({
          fps: Math.round(avgFps),
          renderTime: delta / frameCountRef.current,
          memoryUsage: Math.round(memoryUsage),
          frameCount: frameCountRef.current
        });
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationFrame = requestAnimationFrame(measurePerformance);
    };
    
    measurePerformance();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Log performance data to database periodically
  useEffect(() => {
    if (!sessionId || metrics.frameCount === 0) return;
    
    const interval = setInterval(async () => {
      try {
        const capabilities = webglDetector.detect();
        
        await supabase.from('game_performance').insert({
          game_type: gameType,
          session_id: sessionId,
          fps_average: metrics.fps,
          render_time_ms: metrics.renderTime,
          memory_usage_mb: metrics.memoryUsage,
          webgl_version: capabilities.webgl2 ? 'WebGL 2.0' : capabilities.webgl1 ? 'WebGL 1.0' : 'None',
          device_info: {
            vendor: capabilities.vendor,
            renderer: capabilities.renderer,
            maxTextureSize: capabilities.maxTextureSize,
            performanceLevel: capabilities.performanceLevel,
            userAgent: navigator.userAgent
          }
        });
      } catch (error) {
        console.error('Failed to log performance data:', error);
      }
    }, 30000); // Log every 30 seconds
    
    return () => clearInterval(interval);
  }, [sessionId, gameType, metrics]);

  return metrics;
};
