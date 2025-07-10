import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import { useSecurityAlerts, SecurityAlert } from '@/hooks/useSecurityAlerts';
import { formatDistanceToNow } from 'date-fns';

interface SecurityAlertPanelProps {
  isAdmin: boolean;
  className?: string;
}

export const SecurityAlertPanel = ({ isAdmin, className = '' }: SecurityAlertPanelProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    alerts,
    unreadCount,
    isConnected,
    isLoading,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearAllAlerts,
    loadRecentAlerts
  } = useSecurityAlerts({ 
    isAdmin, 
    autoConnect: true, 
    toastAlerts: true 
  });

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'rate_limit_warning':
      case 'rate_limit_block':
        return <Clock className="h-4 w-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'admin_alert':
        return <Shield className="h-4 w-4" />;
      case 'critical_security':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <Card className={`p-6 bg-gradient-card border-destructive ${className}`}>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">Admin privileges required.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-card ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-primary" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h3 className="font-bold">Security Alerts</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span>Real-time monitoring active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <span>Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecentAlerts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Real-time Monitoring</span>
              <Button
                variant={isConnected ? "destructive" : "default"}
                size="sm"
                onClick={isConnected ? disconnect : connect}
                disabled={isLoading}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAlerts}
                disabled={alerts.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-[400px]">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-green-600 mb-1">All Clear</h4>
            <p className="text-sm text-muted-foreground">No security alerts detected</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`p-3 transition-colors ${
                  alert.read 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-background border-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-1 rounded ${getSeverityColor(alert.severity)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm truncate">{alert.title}</h5>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                      
                      {!alert.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="text-xs h-6"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                    
                    {alert.source && (
                      <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                        {alert.source.walletAddress && (
                          <div>Wallet: {alert.source.walletAddress.slice(0, 6)}...{alert.source.walletAddress.slice(-4)}</div>
                        )}
                        {alert.source.actionType && (
                          <div>Action: {alert.source.actionType}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};