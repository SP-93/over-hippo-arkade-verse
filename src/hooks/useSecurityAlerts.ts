import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecurityAlert {
  id: string;
  type: 'rate_limit_warning' | 'rate_limit_block' | 'suspicious_activity' | 'admin_alert' | 'critical_security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  details?: any;
  read?: boolean;
  source?: {
    walletAddress?: string;
    userId?: string;
    actionType?: string;
  };
}

interface UseSecurityAlertsOptions {
  isAdmin: boolean;
  autoConnect?: boolean;
  toastAlerts?: boolean;
}

export const useSecurityAlerts = ({
  isAdmin,
  autoConnect = true,
  toastAlerts = true
}: UseSecurityAlertsOptions) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<any>(null);
  const lastAlertId = useRef<string>('');

  // Generate security alert from database changes
  const generateSecurityAlert = useCallback((payload: any): SecurityAlert | null => {
    const { new: newRecord, old: oldRecord, eventType } = payload;
    
    if (payload.table === 'admin_rate_limit') {
      if (newRecord.blocked_until && !oldRecord?.blocked_until) {
        return {
          id: `rate_limit_${newRecord.id}_${Date.now()}`,
          type: 'rate_limit_block',
          severity: 'high',
          title: 'Rate Limit Triggered',
          message: `Admin ${newRecord.admin_wallet_address.slice(0, 6)}...${newRecord.admin_wallet_address.slice(-4)} has been rate limited for ${newRecord.action_type}`,
          timestamp: new Date().toISOString(),
          details: {
            actionType: newRecord.action_type,
            requestCount: newRecord.request_count,
            blockedUntil: newRecord.blocked_until
          },
          source: {
            walletAddress: newRecord.admin_wallet_address,
            actionType: newRecord.action_type
          }
        };
      } else if (newRecord.request_count >= 8) {
        return {
          id: `rate_warning_${newRecord.id}_${Date.now()}`,
          type: 'rate_limit_warning',
          severity: 'medium',
          title: 'Rate Limit Warning',
          message: `Admin ${newRecord.admin_wallet_address.slice(0, 6)}...${newRecord.admin_wallet_address.slice(-4)} approaching rate limit (${newRecord.request_count}/10)`,
          timestamp: new Date().toISOString(),
          details: {
            actionType: newRecord.action_type,
            requestCount: newRecord.request_count
          },
          source: {
            walletAddress: newRecord.admin_wallet_address,
            actionType: newRecord.action_type
          }
        };
      }
    }

    if (payload.table === 'admin_audit_log' && !newRecord.success) {
      return {
        id: `audit_fail_${newRecord.id}`,
        type: 'suspicious_activity',
        severity: newRecord.error_message?.includes('Rate limit') ? 'medium' : 'high',
        title: 'Failed Admin Operation',
        message: `Failed ${newRecord.action_type} from ${newRecord.admin_wallet_address.slice(0, 6)}...${newRecord.admin_wallet_address.slice(-4)}`,
        timestamp: newRecord.created_at,
        details: {
          actionType: newRecord.action_type,
          errorMessage: newRecord.error_message,
          actionDetails: newRecord.action_details
        },
        source: {
          walletAddress: newRecord.admin_wallet_address,
          actionType: newRecord.action_type
        }
      };
    }

    // Detection for multiple failed login attempts
    if (payload.table === 'admin_audit_log' && 
        newRecord.action_type === 'admin_check' && 
        !newRecord.success) {
      return {
        id: `login_fail_${newRecord.id}`,
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Failed Admin Access Attempt',
        message: `Unauthorized admin access attempt from ${newRecord.admin_wallet_address.slice(0, 6)}...${newRecord.admin_wallet_address.slice(-4)}`,
        timestamp: newRecord.created_at,
        details: {
          errorMessage: newRecord.error_message,
          actionDetails: newRecord.action_details
        },
        source: {
          walletAddress: newRecord.admin_wallet_address,
          actionType: newRecord.action_type
        }
      };
    }

    return null;
  }, []);

  // Show toast notification for alerts
  const showAlertToast = useCallback((alert: SecurityAlert) => {
    if (!toastAlerts) return;

    const toastOptions = {
      duration: alert.severity === 'critical' ? 10000 : alert.severity === 'high' ? 7000 : 5000,
    };

    switch (alert.severity) {
      case 'critical':
        toast.error(`🚨 ${alert.title}: ${alert.message}`, toastOptions);
        break;
      case 'high':
        toast.error(`⚠️ ${alert.title}: ${alert.message}`, toastOptions);
        break;
      case 'medium':
        toast.warning(`⚡ ${alert.title}: ${alert.message}`, toastOptions);
        break;
      case 'low':
        toast.info(`ℹ️ ${alert.title}: ${alert.message}`, toastOptions);
        break;
    }
  }, [toastAlerts]);

  // Add new alert
  const addAlert = useCallback((alert: SecurityAlert) => {
    if (alert.id === lastAlertId.current) return; // Prevent duplicates
    
    lastAlertId.current = alert.id;
    
    setAlerts(prev => {
      const newAlerts = [alert, ...prev].slice(0, 50); // Keep last 50 alerts
      return newAlerts;
    });
    
    setUnreadCount(prev => prev + 1);
    showAlertToast(alert);
    
    console.log('🚨 Security Alert:', alert);
  }, [showAlertToast]);

  // Mark alert as read
  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
  }, []);

  // Connect to real-time monitoring
  const connect = useCallback(async () => {
    if (!isAdmin || !autoConnect || channelRef.current) return;

    try {
      setIsLoading(true);
      console.log('🔌 Connecting to security monitoring...');

      // Create realtime channel for security monitoring
      const channel = supabase
        .channel('security-monitoring')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_rate_limit'
          },
          (payload) => {
            console.log('📊 Rate limit change:', payload);
            const alert = generateSecurityAlert({ ...payload, table: 'admin_rate_limit' });
            if (alert) addAlert(alert);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_audit_log'
          },
          (payload) => {
            console.log('📝 Audit log entry:', payload);
            const alert = generateSecurityAlert({ ...payload, table: 'admin_audit_log' });
            if (alert) addAlert(alert);
          }
        )
        .subscribe((status) => {
          console.log('🔌 Security monitoring status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'SUBSCRIBED') {
            console.log('✅ Security monitoring connected');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Failed to connect security monitoring:', error);
      toast.error('Failed to connect to security monitoring');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, autoConnect, generateSecurityAlert, addAlert]);

  // Disconnect from real-time monitoring
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Disconnecting security monitoring...');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Load recent alerts from database
  const loadRecentAlerts = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      
      // Load recent rate limits and audit logs
      const [rateLimitResponse, auditResponse] = await Promise.all([
        supabase
          .from('admin_rate_limit')
          .select('*')
          .order('last_request', { ascending: false })
          .limit(20),
        supabase.rpc('get_admin_audit_logs', { p_limit: 20, p_offset: 0 })
      ]);

      const recentAlerts: SecurityAlert[] = [];

      // Process rate limits
      if (rateLimitResponse.data) {
        rateLimitResponse.data.forEach(rateLimit => {
          if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
            recentAlerts.push({
              id: `rate_limit_${rateLimit.id}`,
              type: 'rate_limit_block',
              severity: 'high',
              title: 'Active Rate Limit',
              message: `${rateLimit.admin_wallet_address.slice(0, 6)}...${rateLimit.admin_wallet_address.slice(-4)} is rate limited`,
              timestamp: rateLimit.last_request,
              details: rateLimit,
              source: {
                walletAddress: rateLimit.admin_wallet_address,
                actionType: rateLimit.action_type
              }
            });
          } else if (rateLimit.request_count >= 8) {
            recentAlerts.push({
              id: `rate_warning_${rateLimit.id}`,
              type: 'rate_limit_warning',
              severity: 'medium',
              title: 'High Rate Usage',
              message: `${rateLimit.admin_wallet_address.slice(0, 6)}...${rateLimit.admin_wallet_address.slice(-4)} high usage (${rateLimit.request_count}/10)`,
              timestamp: rateLimit.last_request,
              details: rateLimit,
              source: {
                walletAddress: rateLimit.admin_wallet_address,
                actionType: rateLimit.action_type
              }
            });
          }
        });
      }

      // Process failed audit logs
      if (auditResponse.data) {
        auditResponse.data
          .filter((log: any) => !log.success)
          .forEach((log: any) => {
            recentAlerts.push({
              id: `audit_fail_${log.id}`,
              type: 'suspicious_activity',
              severity: log.error_message?.includes('Rate limit') ? 'medium' : 'high',
              title: 'Failed Operation',
              message: `Failed ${log.action_type} from ${log.admin_wallet_address.slice(0, 6)}...${log.admin_wallet_address.slice(-4)}`,
              timestamp: log.created_at,
              details: log,
              source: {
                walletAddress: log.admin_wallet_address,
                actionType: log.action_type
              }
            });
          });
      }

      // Sort by timestamp and add to state
      recentAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(recentAlerts);
      setUnreadCount(recentAlerts.length);
      
    } catch (error) {
      console.error('❌ Failed to load recent alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Auto-connect when admin status changes
  useEffect(() => {
    if (isAdmin && autoConnect) {
      connect();
      loadRecentAlerts();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAdmin, autoConnect, connect, disconnect, loadRecentAlerts]);

  return {
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
  };
};