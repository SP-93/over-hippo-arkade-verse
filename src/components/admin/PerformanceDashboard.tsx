import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Activity, Cpu, HardDrive, Network, Zap, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceMonitor } from "../PerformanceMonitor";

interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_type: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
  tags: any;
}

interface PerformanceDashboardProps {
  isAdmin: boolean;
}

export const PerformanceDashboard = ({ isAdmin }: PerformanceDashboardProps) => {
  const [activeTimeRange, setActiveTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  // Fetch performance metrics
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['performance-metrics', activeTimeRange],
    queryFn: async () => {
      const timeFilter = {
        "1h": "1 hour",
        "24h": "24 hours", 
        "7d": "7 days"
      }[activeTimeRange];

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', `now() - interval '${timeFilter}'`)
        .order('recorded_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as PerformanceMetric[];
    },
    enabled: isAdmin,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Calculate aggregated metrics
  const aggregatedMetrics = React.useMemo(() => {
    if (!metrics || metrics.length === 0) return null;

    const byType = metrics.reduce((acc, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = [];
      }
      acc[metric.metric_type].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    const calculateStats = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0 };
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    };

    return {
      render: calculateStats(byType.render?.map(m => m.metric_value) || []),
      memory: calculateStats(byType.memory?.map(m => m.metric_value) || []),
      network: calculateStats(byType.network?.map(m => m.metric_value) || []),
      fps: calculateStats(byType.fps?.map(m => m.metric_value) || []),
      total_metrics: metrics.length
    };
  }, [metrics]);

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">Admin access required</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Monitor system performance and optimization metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {(["1h", "24h", "7d"] as const).map((range) => (
          <Button
            key={range}
            variant={activeTimeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTimeRange(range)}
          >
            {range === "1h" ? "Last Hour" : range === "24h" ? "Last 24 Hours" : "Last 7 Days"}
          </Button>
        ))}
      </div>

      {/* Live Performance Monitor */}
      <PerformanceMonitor gameType="admin_dashboard" />

      {/* Aggregated Metrics */}
      {aggregatedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="font-medium">Render Performance</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg:</span>
                <span>{aggregatedMetrics.render.avg.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Max:</span>
                <span>{aggregatedMetrics.render.max.toFixed(1)}ms</span>
              </div>
              <Progress 
                value={Math.min((aggregatedMetrics.render.avg / 32) * 100, 100)} 
                className="h-2"
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <HardDrive className="h-4 w-4 text-primary" />
              <span className="font-medium">Memory Usage</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg:</span>
                <span>{aggregatedMetrics.memory.avg.toFixed(0)}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Peak:</span>
                <span>{aggregatedMetrics.memory.max.toFixed(0)}MB</span>
              </div>
              <Progress 
                value={Math.min((aggregatedMetrics.memory.avg / 200) * 100, 100)} 
                className="h-2"
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Frame Rate</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg:</span>
                <span>{aggregatedMetrics.fps.avg.toFixed(0)} FPS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Min:</span>
                <span>{aggregatedMetrics.fps.min.toFixed(0)} FPS</span>
              </div>
              <Progress 
                value={(aggregatedMetrics.fps.avg / 60) * 100} 
                className="h-2"
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">System Load</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Metrics:</span>
                <span>{aggregatedMetrics.total_metrics}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={aggregatedMetrics.render.avg < 16 ? "default" : "destructive"}>
                  {aggregatedMetrics.render.avg < 16 ? "Optimal" : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="alerts">Performance Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
          <TabsTrigger value="settings">Monitoring Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Performance Trends</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Loading performance data...</p>
            ) : metrics && metrics.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Showing {metrics.length} performance metrics from the last {activeTimeRange}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(
                    metrics.reduce((acc, metric) => {
                      if (!acc[metric.metric_type]) acc[metric.metric_type] = 0;
                      acc[metric.metric_type]++;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="p-3 bg-muted/20 rounded-lg">
                      <div className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <span className="font-medium">{count} records</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No performance data available</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Performance Alerts</h3>
            <p className="text-muted-foreground">
              Performance alerting system will be implemented in future updates.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="font-medium">✅ Enable Component Memoization</p>
                <p className="text-sm text-muted-foreground">Use React.memo() for expensive components</p>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="font-medium">✅ Implement Lazy Loading</p>
                <p className="text-sm text-muted-foreground">Load components only when needed</p>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="font-medium">⚡ Monitor Memory Usage</p>
                <p className="text-sm text-muted-foreground">Regular cleanup and garbage collection</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Monitoring Configuration</h3>
            <p className="text-muted-foreground">
              Performance monitoring settings and thresholds can be configured here.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};