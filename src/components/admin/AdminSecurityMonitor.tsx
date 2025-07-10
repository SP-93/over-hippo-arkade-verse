import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Clock, TrendingUp, RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SecurityAlertPanel } from "./SecurityAlertPanel";

interface RateLimitInfo {
  admin_wallet_address: string;
  action_type: string;
  request_count: number;
  window_start: string;
  blocked_until: string | null;
  last_request: string;
}

interface AdminSecurityMonitorProps {
  isAdmin: boolean;
}

export const AdminSecurityMonitor = ({ isAdmin }: AdminSecurityMonitorProps) => {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSecurityData = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Load rate limit data
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .from('admin_rate_limit')
        .select('*')
        .order('last_request', { ascending: false })
        .limit(20);

      if (rateLimitError) {
        console.error('Failed to load rate limits:', rateLimitError);
      } else {
        setRateLimits(rateLimitData || []);
      }

      // Load suspicious activity from audit logs
      const { data: auditData, error: auditError } = await supabase.rpc('get_admin_audit_logs', {
        p_limit: 30,
        p_offset: 0
      });

      if (auditError) {
        console.error('Failed to load audit data:', auditError);
      } else {
        // Filter for suspicious activities
        const suspicious = (auditData || []).filter((log: any) => 
          !log.success || 
          log.action_type === 'system_error' ||
          log.error_message?.includes('Rate limit') ||
          log.error_message?.includes('Unauthorized')
        );
        setSuspiciousActivity(suspicious);
      }

      toast.success("Security data loaded");
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error("Error loading security data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSecurityData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadSecurityData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'chip_grant_self':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'system_error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'admin_check':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRateLimitStatus = (rateLimit: RateLimitInfo) => {
    const isBlocked = rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date();
    const isHighUsage = rateLimit.request_count >= 8; // 80% of typical limit
    
    if (isBlocked) return { color: 'destructive', label: 'BLOCKED' };
    if (isHighUsage) return { color: 'orange', label: 'HIGH USAGE' };
    return { color: 'default', label: 'NORMAL' };
  };

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">You need admin privileges to view security monitoring.</p>
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
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-primary">Security Monitor</h3>
              <p className="text-muted-foreground">Real-time security and rate limiting status</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={loadSecurityData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Real-time Security Alerts */}
      <SecurityAlertPanel isAdmin={isAdmin} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limits */}
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <h4 className="text-lg font-bold">Rate Limits</h4>
              <p className="text-sm text-muted-foreground">Current rate limiting status</p>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {rateLimits.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No rate limit data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rateLimits.map((limit, index) => {
                  const status = getRateLimitStatus(limit);
                  return (
                    <Card key={index} className="p-3 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={getActionTypeColor(limit.action_type)}>
                              {limit.action_type}
                            </Badge>
                            <Badge variant={status.color as any}>
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                              Admin: {limit.admin_wallet_address.slice(0, 6)}...{limit.admin_wallet_address.slice(-4)}
                            </div>
                            <div>
                              Requests: {limit.request_count}/10
                            </div>
                            <div>
                              Last: {new Date(limit.last_request).toLocaleString()}
                            </div>
                            {limit.blocked_until && (
                              <div className="text-destructive">
                                Blocked until: {new Date(limit.blocked_until).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-2">
                          <TrendingUp className={`h-4 w-4 ${
                            limit.request_count >= 8 ? 'text-destructive' : 
                            limit.request_count >= 5 ? 'text-orange-500' : 
                            'text-green-500'
                          }`} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Suspicious Activity */}
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <div>
              <h4 className="text-lg font-bold">Suspicious Activity</h4>
              <p className="text-sm text-muted-foreground">Failed operations and security events</p>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {suspiciousActivity.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No suspicious activity detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suspiciousActivity.map((activity, index) => (
                  <Card key={index} className="p-3 bg-destructive/5 border-destructive/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getActionTypeColor(activity.action_type)}>
                            {activity.action_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div>
                            Admin: {activity.admin_wallet_address.slice(0, 6)}...{activity.admin_wallet_address.slice(-4)}
                          </div>
                          {activity.error_message && (
                            <div className="text-destructive">
                              Error: {activity.error_message}
                            </div>
                          )}
                          {activity.action_details && (
                            <div className="bg-muted/50 p-1 rounded text-xs font-mono">
                              {JSON.stringify(activity.action_details, null, 2).slice(0, 100)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};