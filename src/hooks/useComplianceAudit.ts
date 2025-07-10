import { useState, useEffect, useCallback } from "react";
import { complianceAuditService, UserBehaviorLog, SecurityIncident, PerformanceMetric } from "@/services/compliance-audit";
import { toast } from "sonner";

export const useComplianceAudit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Log user behavior with automatic IP and user agent detection
  const logUserBehavior = useCallback(async (
    actionType: string,
    actionDetails: Record<string, any>,
    sessionId?: string
  ) => {
    try {
      const behaviorLog: UserBehaviorLog = {
        action_type: actionType,
        action_details: actionDetails,
        session_id: sessionId,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      };

      const result = await complianceAuditService.logUserBehavior(behaviorLog);
      
      if (!result.success) {
        console.error('Failed to log user behavior:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error logging user behavior:', error);
      return { success: false, error: 'Failed to log behavior' };
    }
  }, []);

  // Record performance metrics
  const recordMetric = useCallback(async (metric: PerformanceMetric) => {
    const result = await complianceAuditService.recordPerformanceMetric(metric);
    
    if (!result.success) {
      console.error('Failed to record metric:', result.error);
    }
    
    return result;
  }, []);

  // Auto-log common user actions
  const trackPageView = useCallback((path: string) => {
    logUserBehavior('page_view', { path, timestamp: new Date().toISOString() });
  }, [logUserBehavior]);

  const trackGameAction = useCallback((gameType: string, action: string, details: Record<string, any> = {}) => {
    logUserBehavior('game_action', { 
      game_type: gameType, 
      action, 
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [logUserBehavior]);

  const trackSecurityEvent = useCallback((eventType: string, details: Record<string, any> = {}) => {
    logUserBehavior('security_event', { 
      event_type: eventType, 
      ...details,
      timestamp: new Date().toISOString()
    });
  }, [logUserBehavior]);

  // Load dashboard data
  const loadDashboardData = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    setIsLoading(true);
    try {
      const result = await complianceAuditService.getDashboardMetrics(period);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    // State
    isLoading,
    dashboardData,
    
    // Actions
    logUserBehavior,
    recordMetric,
    loadDashboardData,
    
    // Convenience methods
    trackPageView,
    trackGameAction,
    trackSecurityEvent,
    
    // Services (for admin use)
    complianceService: complianceAuditService
  };
};

// Helper function to get client IP (simplified)
async function getClientIP(): Promise<string> {
  try {
    // In a real implementation, you might use a service like ipapi.co
    // For now, we'll return a placeholder
    return 'unknown';
  } catch {
    return 'unknown';
  }
}