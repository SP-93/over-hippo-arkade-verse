import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Database, 
  Server, 
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Activity,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    maxConnections: number;
    responseTime: number;
  };
  cache: {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    memoryUsage: number;
    maxMemory: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    used: number;
    total: number;
    freeSpace: number;
  };
  performance: {
    avgResponseTime: number;
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

interface SystemMaintenancePanelProps {
  isAdmin: boolean;
}

export const SystemMaintenancePanel = ({ isAdmin }: SystemMaintenancePanelProps) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);

  const loadSystemStatus = async () => {
    setLoading(true);
    try {
      // Simulate system status - in real app, this would call backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSystemStatus({
        database: {
          status: 'healthy',
          connections: 45,
          maxConnections: 100,
          responseTime: 12
        },
        cache: {
          status: 'healthy',
          hitRate: 94.5,
          memoryUsage: 2.1,
          maxMemory: 4.0
        },
        storage: {
          status: 'warning',
          used: 78.3,
          total: 100,
          freeSpace: 21.7
        },
        performance: {
          avgResponseTime: 185,
          activeUsers: 1247,
          requestsPerMinute: 3420,
          errorRate: 0.03
        }
      });
    } catch (error) {
      console.error('Failed to load system status:', error);
      toast.error("Failed to load system status");
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      setMaintenanceMode(!maintenanceMode);
      toast.success(`Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      toast.error("Failed to toggle maintenance mode");
    }
  };

  const runSystemCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupProgress(0);

    try {
      // Simulate cleanup process
      const steps = [
        "Clearing expired sessions...",
        "Cleaning temporary files...",
        "Optimizing database...",
        "Refreshing cache...",
        "Updating indexes..."
      ];

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCleanupProgress(((i + 1) / steps.length) * 100);
      }

      toast.success("System cleanup completed successfully");
      await loadSystemStatus();
    } catch (error) {
      console.error('System cleanup failed:', error);
      toast.error("System cleanup failed");
    } finally {
      setIsRunningCleanup(false);
      setCleanupProgress(0);
    }
  };

  const restartServices = async () => {
    const confirmation = confirm("Are you sure you want to restart system services? This may cause temporary downtime.");
    if (!confirmation) return;

    try {
      toast.info("Restarting services...");
      // Simulate service restart
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.success("Services restarted successfully");
      await loadSystemStatus();
    } catch (error) {
      console.error('Service restart failed:', error);
      toast.error("Service restart failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSystemStatus();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(loadSystemStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">System maintenance requires highest admin privileges.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-primary">System Maintenance</h3>
              <p className="text-muted-foreground">Monitor and maintain system health</p>
            </div>
          </div>
          <div className="flex gap-2">
            {maintenanceMode && (
              <Badge variant="destructive" className="animate-pulse">
                Maintenance Mode Active
              </Badge>
            )}
            <Button onClick={loadSystemStatus} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Database Status */}
          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Database</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.database.status)}`}>
                {getStatusIcon(systemStatus.database.status)}
                <span className="text-sm capitalize">{systemStatus.database.status}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Connections: {systemStatus.database.connections}/{systemStatus.database.maxConnections}</div>
              <div>Response: {systemStatus.database.responseTime}ms</div>
              <Progress 
                value={(systemStatus.database.connections / systemStatus.database.maxConnections) * 100} 
                className="h-2" 
              />
            </div>
          </Card>

          {/* Cache Status */}
          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Cache</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.cache.status)}`}>
                {getStatusIcon(systemStatus.cache.status)}
                <span className="text-sm capitalize">{systemStatus.cache.status}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Hit Rate: {systemStatus.cache.hitRate}%</div>
              <div>Memory: {systemStatus.cache.memoryUsage}GB/{systemStatus.cache.maxMemory}GB</div>
              <Progress 
                value={(systemStatus.cache.memoryUsage / systemStatus.cache.maxMemory) * 100} 
                className="h-2" 
              />
            </div>
          </Card>

          {/* Storage Status */}
          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-500" />
                <span className="font-medium">Storage</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.storage.status)}`}>
                {getStatusIcon(systemStatus.storage.status)}
                <span className="text-sm capitalize">{systemStatus.storage.status}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Used: {systemStatus.storage.used}%</div>
              <div>Free: {systemStatus.storage.freeSpace}GB</div>
              <Progress 
                value={systemStatus.storage.used} 
                className="h-2" 
              />
            </div>
          </Card>

          {/* Performance */}
          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Performance</span>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Optimal</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Response: {systemStatus.performance.avgResponseTime}ms</div>
              <div>Active Users: {systemStatus.performance.activeUsers.toLocaleString()}</div>
              <div>Requests/min: {systemStatus.performance.requestsPerMinute.toLocaleString()}</div>
              <div>Error Rate: {systemStatus.performance.errorRate}%</div>
            </div>
          </Card>
        </div>
      )}

      {/* Maintenance Actions */}
      <Card className="p-6 bg-gradient-card">
        <h3 className="text-lg font-bold mb-4">Maintenance Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Quick Actions</h4>
            
            <Button 
              onClick={toggleMaintenanceMode}
              variant={maintenanceMode ? "destructive" : "outline"}
              className="w-full justify-start"
            >
              <Shield className="h-4 w-4 mr-2" />
              {maintenanceMode ? "Disable" : "Enable"} Maintenance Mode
            </Button>

            <Button 
              onClick={runSystemCleanup}
              disabled={isRunningCleanup}
              variant="outline"
              className="w-full justify-start"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunningCleanup ? 'animate-spin' : ''}`} />
              Run System Cleanup
            </Button>

            <Button 
              onClick={restartServices}
              variant="outline"
              className="w-full justify-start"
            >
              <Server className="h-4 w-4 mr-2" />
              Restart Services
            </Button>
          </div>

          {/* Cleanup Progress */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">System Operations</h4>
            
            {isRunningCleanup && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cleanup Progress</span>
                  <span className="text-sm">{Math.round(cleanupProgress)}%</span>
                </div>
                <Progress value={cleanupProgress} className="h-2" />
              </div>
            )}

            <div className="p-3 bg-card/50 rounded-lg border">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Last Cleanup:</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <span className="text-muted-foreground">6 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="text-muted-foreground">7 days, 14h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};