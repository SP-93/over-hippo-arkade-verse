import React, { memo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, HardDrive, Network, Zap, AlertTriangle } from "lucide-react";
import { usePerformanceOptimizer } from "@/hooks/usePerformanceOptimizer";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

interface PerformanceMonitorProps {
  gameType?: string;
  sessionId?: string;
}

export const PerformanceMonitor = memo(({ gameType = "system", sessionId }: PerformanceMonitorProps) => {
  const { metrics, settings, recommendations, isOptimizing, optimizePerformance, updateSettings } = usePerformanceOptimizer();
  const gameMetrics = usePerformanceMonitor(gameType, sessionId);
  const [isExpanded, setIsExpanded] = useState(false);

  // Performance status calculation
  const getPerformanceStatus = () => {
    if (metrics.renderTime > 32) return { status: "poor", color: "destructive" };
    if (metrics.renderTime > 16) return { status: "warning", color: "warning" };
    return { status: "good", color: "default" };
  };

  const { status, color } = getPerformanceStatus();

  return (
    <Card className="p-4 bg-gradient-card border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Performance Monitor</h3>
          <Badge variant={color as any} className="text-xs">
            {status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={optimizePerformance}
            disabled={isOptimizing}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Render</span>
          </div>
          <p className="text-lg font-semibold">{metrics.renderTime.toFixed(1)}ms</p>
          <Progress value={Math.min((metrics.renderTime / 32) * 100, 100)} className="h-1" />
        </div>

        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Memory</span>
          </div>
          <p className="text-lg font-semibold">{metrics.memoryUsage.toFixed(0)}MB</p>
          <Progress value={Math.min((metrics.memoryUsage / 200) * 100, 100)} className="h-1" />
        </div>

        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Network className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Requests</span>
          </div>
          <p className="text-lg font-semibold">{metrics.networkRequests}</p>
          <Progress value={Math.min((metrics.networkRequests / 50) * 100, 100)} className="h-1" />
        </div>

        <div className="p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">FPS</span>
          </div>
          <p className="text-lg font-semibold">{gameMetrics.fps}</p>
          <Progress value={(gameMetrics.fps / 60) * 100} className="h-1" />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-medium text-warning">Performance Recommendations</span>
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed View */}
      {isExpanded && (
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Render Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Frame Rate</span>
                    <span className="font-medium">{gameMetrics.fps} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Render Time</span>
                    <span className="font-medium">{gameMetrics.renderTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Frame Count</span>
                    <span className="font-medium">{gameMetrics.frameCount}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">System Resources</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="font-medium">{gameMetrics.memoryUsage}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Network Load</span>
                    <span className="font-medium">{metrics.networkRequests} req</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Components</span>
                    <span className="font-medium">{metrics.componentCount}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lazy Loading</span>
                <Button
                  variant={settings.enableLazyLoading ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings(prev => ({ ...prev, enableLazyLoading: !prev.enableLazyLoading }))}
                >
                  {settings.enableLazyLoading ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memoization</span>
                <Button
                  variant={settings.enableMemoization ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings(prev => ({ ...prev, enableMemoization: !prev.enableMemoization }))}
                >
                  {settings.enableMemoization ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Virtualization</span>
                <Button
                  variant={settings.enableVirtualization ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings(prev => ({ ...prev, enableVirtualization: !prev.enableVirtualization }))}
                >
                  {settings.enableVirtualization ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Performance history tracking will be available in future updates.
            </p>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
});

PerformanceMonitor.displayName = "PerformanceMonitor";