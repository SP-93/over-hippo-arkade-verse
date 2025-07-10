import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReportConfig {
  id: string;
  name: string;
  type: 'player_activity' | 'revenue' | 'game_performance' | 'security';
  schedule?: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generated_at: string;
  data: any;
  format: 'json' | 'csv' | 'pdf';
}

export const useReportingSystem = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (config: ReportConfig): Promise<GeneratedReport> => {
    setIsGenerating(true);
    
    try {
      let reportData;
      
      switch (config.type) {
        case 'player_activity':
          reportData = await generatePlayerActivityReport(config);
          break;
        case 'revenue':
          reportData = await generateRevenueReport(config);
          break;
        case 'game_performance':
          reportData = await generateGamePerformanceReport(config);
          break;
        case 'security':
          reportData = await generateSecurityReport(config);
          break;
        default:
          throw new Error(`Unknown report type: ${config.type}`);
      }

      const report: GeneratedReport = {
        id: crypto.randomUUID(),
        name: config.name,
        type: config.type,
        generated_at: new Date().toISOString(),
        data: reportData,
        format: 'json',
      };

      // Store report in compliance_reports table
      await supabase.rpc('generate_compliance_report', {
        p_report_type: config.type,
        p_period_start: config.dateRange.start.toISOString(),
        p_period_end: config.dateRange.end.toISOString(),
      });

      setReports(prev => [report, ...prev]);
      return report;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlayerActivityReport = async (config: ReportConfig) => {
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .gte('created_at', config.dateRange.start.toISOString())
      .lte('created_at', config.dateRange.end.toISOString());

    const { data: scores } = await supabase
      .from('game_scores')
      .select('*')
      .gte('created_at', config.dateRange.start.toISOString())
      .lte('created_at', config.dateRange.end.toISOString());

    const totalSessions = sessions?.length || 0;
    const uniquePlayers = new Set(sessions?.map(s => s.user_id)).size;
    const avgSessionDuration = sessions?.reduce((sum, s) => {
      if (s.session_end) {
        return sum + (new Date(s.session_end).getTime() - new Date(s.session_start).getTime());
      }
      return sum;
    }, 0) / (sessions?.filter(s => s.session_end).length || 1);

    return {
      summary: {
        totalSessions,
        uniquePlayers,
        avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // minutes
        totalGamesPlayed: scores?.length || 0,
      },
      sessions: sessions || [],
      scores: scores || [],
    };
  };

  const generateRevenueReport = async (config: ReportConfig) => {
    const { data: transactions } = await supabase
      .from('chip_transactions')
      .select('*')
      .gte('created_at', config.dateRange.start.toISOString())
      .lte('created_at', config.dateRange.end.toISOString());

    const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.over_amount || 0), 0) || 0;
    const totalTransactions = transactions?.length || 0;
    const avgTransactionValue = totalRevenue / totalTransactions || 0;

    const revenueByType = transactions?.reduce((acc: any, tx) => {
      const type = tx.transaction_type;
      if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
      acc[type].count++;
      acc[type].revenue += tx.over_amount || 0;
      return acc;
    }, {});

    return {
      summary: {
        totalRevenue,
        totalTransactions,
        avgTransactionValue,
        uniqueCustomers: new Set(transactions?.map(t => t.user_id)).size,
      },
      transactions: transactions || [],
      revenueByType: revenueByType || {},
    };
  };

  const generateGamePerformanceReport = async (config: ReportConfig) => {
    const { data: performance } = await supabase
      .from('game_performance')
      .select('*')
      .gte('created_at', config.dateRange.start.toISOString())
      .lte('created_at', config.dateRange.end.toISOString());

    const avgFps = performance?.reduce((sum, p) => sum + (p.fps_average || 0), 0) / (performance?.length || 1);
    const avgMemory = performance?.reduce((sum, p) => sum + (p.memory_usage_mb || 0), 0) / (performance?.length || 1);

    const performanceByGame = performance?.reduce((acc: any, p) => {
      const game = p.game_type;
      if (!acc[game]) acc[game] = { count: 0, totalFps: 0, totalMemory: 0 };
      acc[game].count++;
      acc[game].totalFps += p.fps_average || 0;
      acc[game].totalMemory += p.memory_usage_mb || 0;
      return acc;
    }, {});

    return {
      summary: {
        avgFps: Math.round(avgFps),
        avgMemory: Math.round(avgMemory),
        totalRecords: performance?.length || 0,
      },
      performance: performance || [],
      performanceByGame: performanceByGame || {},
    };
  };

  const generateSecurityReport = async (config: ReportConfig) => {
    const { data: incidents } = await supabase
      .from('security_incidents')
      .select('*')
      .gte('detected_at', config.dateRange.start.toISOString())
      .lte('detected_at', config.dateRange.end.toISOString());

    const { data: behaviors } = await supabase
      .from('user_behavior_analytics')
      .select('*')
      .gte('created_at', config.dateRange.start.toISOString())
      .lte('created_at', config.dateRange.end.toISOString())
      .gt('risk_score', 50);

    const incidentsBySeverity = incidents?.reduce((acc: any, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalIncidents: incidents?.length || 0,
        highRiskBehaviors: behaviors?.length || 0,
        avgRiskScore: behaviors?.reduce((sum, b) => sum + (b.risk_score || 0), 0) / (behaviors?.length || 1),
      },
      incidents: incidents || [],
      highRiskBehaviors: behaviors || [],
      incidentsBySeverity: incidentsBySeverity || {},
    };
  };

  const exportReport = (report: GeneratedReport, format: 'json' | 'csv') => {
    const filename = `${report.name}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, filename);
    } else if (format === 'csv') {
      const csv = convertToCSV(report.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, filename);
    }
  };

  const convertToCSV = (data: any): string => {
    if (!data.summary) return '';
    
    let csv = 'Metric,Value\n';
    Object.entries(data.summary).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    
    return csv;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    reports,
    isGenerating,
    generateReport,
    exportReport,
  };
};