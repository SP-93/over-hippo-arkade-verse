import { supabase } from "@/integrations/supabase/client";

export interface UserBehaviorLog {
  action_type: string;
  action_details: Record<string, any>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface SecurityIncident {
  id?: string;
  incident_type: string;
  severity: string;
  title: string;
  description?: string;
  affected_user_id?: string;
  status: string;
  incident_data: any;
  detected_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ComplianceReport {
  id?: string;
  report_type: string;
  report_name: string;
  report_data: Record<string, any>;
  generated_at?: string;
  period_start: string;
  period_end: string;
  status: string;
}

export interface PerformanceMetric {
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  tags?: Record<string, any>;
}

class ComplianceAuditService {
  // User Behavior Analytics
  async logUserBehavior(behaviorLog: UserBehaviorLog): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('log_user_behavior', {
        p_action_type: behaviorLog.action_type,
        p_action_details: behaviorLog.action_details,
        p_session_id: behaviorLog.session_id,
        p_ip_address: behaviorLog.ip_address,
        p_user_agent: behaviorLog.user_agent
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Failed to log user behavior:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserBehaviorAnalytics(
    userId?: string,
    startDate?: string,
    endDate?: string,
    riskThreshold?: number
  ) {
    try {
      let query = supabase
        .from('user_behavior_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (riskThreshold !== undefined) {
        query = query.gte('risk_score', riskThreshold);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Failed to fetch user behavior analytics:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Security Incidents
  async createSecurityIncident(incident: Omit<SecurityIncident, 'id'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .insert({
          incident_type: incident.incident_type,
          severity: incident.severity,
          title: incident.title,
          description: incident.description,
          affected_user_id: incident.affected_user_id,
          status: incident.status,
          incident_data: incident.incident_data
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Failed to create security incident:', error);
      return { success: false, error: error.message };
    }
  }

  async getSecurityIncidents(
    status?: string,
    severity?: string,
    limit: number = 50
  ) {
    try {
      let query = supabase
        .from('security_incidents')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Failed to fetch security incidents:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async updateSecurityIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update(updates)
        .eq('id', incidentId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Failed to update security incident:', error);
      return { success: false, error: error.message };
    }
  }

  // Compliance Reports
  async generateComplianceReport(
    reportType: string,
    periodStart: string,
    periodEnd: string
  ) {
    try {
      const { data, error } = await supabase.rpc('generate_compliance_report', {
        p_report_type: reportType,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Failed to generate compliance report:', error);
      return { success: false, error: error.message };
    }
  }

  async getComplianceReports(reportType?: string, limit: number = 20) {
    try {
      let query = supabase
        .from('compliance_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Failed to fetch compliance reports:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Performance Metrics
  async recordPerformanceMetric(metric: PerformanceMetric): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('record_performance_metric', {
        p_metric_type: metric.metric_type,
        p_metric_name: metric.metric_name,
        p_metric_value: metric.metric_value,
        p_metric_unit: metric.metric_unit,
        p_tags: metric.tags || {}
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Failed to record performance metric:', error);
      return { success: false, error: error.message };
    }
  }

  async getPerformanceMetrics(
    metricType?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ) {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      if (startDate) {
        query = query.gte('recorded_at', startDate);
      }

      if (endDate) {
        query = query.lte('recorded_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Failed to fetch performance metrics:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Analytics Dashboard Data
  async getDashboardMetrics(period: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const [
        behaviorAnalytics,
        securityIncidents,
        performanceMetrics
      ] = await Promise.all([
        this.getUserBehaviorAnalytics(undefined, startDate.toISOString(), now.toISOString()),
        this.getSecurityIncidents(),
        this.getPerformanceMetrics(undefined, startDate.toISOString(), now.toISOString())
      ]);

      // Calculate summary statistics
      const totalActions = behaviorAnalytics.data?.length || 0;
      const highRiskActions = behaviorAnalytics.data?.filter(item => item.risk_score > 70).length || 0;
      const anomalies = behaviorAnalytics.data?.filter(item => item.anomaly_detected).length || 0;
      
      const openIncidents = securityIncidents.data?.filter(item => item.status === 'open').length || 0;
      const criticalIncidents = securityIncidents.data?.filter(item => item.severity === 'critical').length || 0;

      return {
        success: true,
        data: {
          period,
          summary: {
            totalActions,
            highRiskActions,
            anomalies,
            openIncidents,
            criticalIncidents,
            riskScore: totalActions > 0 ? Math.round((highRiskActions / totalActions) * 100) : 0
          },
          behaviorAnalytics: behaviorAnalytics.data,
          securityIncidents: securityIncidents.data,
          performanceMetrics: performanceMetrics.data
        }
      };
    } catch (error: any) {
      console.error('Failed to fetch dashboard metrics:', error);
      return { success: false, error: error.message };
    }
  }
}

export const complianceAuditService = new ComplianceAuditService();