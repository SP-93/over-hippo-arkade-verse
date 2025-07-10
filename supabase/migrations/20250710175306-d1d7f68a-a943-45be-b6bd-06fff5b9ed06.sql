-- Phase 3C: Compliance & Audit Features

-- Enhanced audit tables for comprehensive compliance tracking
CREATE TABLE public.compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  report_data JSONB NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'generated',
  file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User behavior analytics table
CREATE TABLE public.user_behavior_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  geo_location JSONB,
  risk_score INTEGER DEFAULT 0,
  anomaly_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security incidents table
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  affected_user_id UUID REFERENCES auth.users(id),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  incident_data JSONB NOT NULL,
  resolution_notes TEXT,
  created_by TEXT DEFAULT 'system'
);

-- Performance metrics table
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  tags JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_reports
CREATE POLICY "Only admins can view compliance reports" 
ON public.compliance_reports 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

-- RLS Policies for user_behavior_analytics
CREATE POLICY "Admins can view all user behavior analytics" 
ON public.user_behavior_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

CREATE POLICY "Users can view their own behavior analytics" 
ON public.user_behavior_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for security_incidents
CREATE POLICY "Only admins can manage security incidents" 
ON public.security_incidents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

-- RLS Policies for performance_metrics
CREATE POLICY "Only admins can view performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

-- Database functions for audit logging
CREATE OR REPLACE FUNCTION public.log_user_behavior(
  p_action_type TEXT,
  p_action_details JSONB,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  risk_score INTEGER := 0;
  anomaly_detected BOOLEAN := false;
BEGIN
  -- Calculate basic risk score based on action type
  CASE p_action_type
    WHEN 'login_failed' THEN risk_score := 30;
    WHEN 'account_locked' THEN risk_score := 50;
    WHEN 'suspicious_activity' THEN risk_score := 70;
    WHEN 'security_violation' THEN risk_score := 90;
    ELSE risk_score := 10;
  END CASE;
  
  -- Check for anomalies (simplified logic)
  IF risk_score > 50 THEN
    anomaly_detected := true;
  END IF;
  
  -- Insert behavior record
  INSERT INTO public.user_behavior_analytics (
    user_id, session_id, action_type, action_details,
    ip_address, user_agent, risk_score, anomaly_detected
  ) VALUES (
    auth.uid(), p_session_id, p_action_type, p_action_details,
    p_ip_address, p_user_agent, risk_score, anomaly_detected
  );
  
  -- Create security incident if high risk
  IF risk_score > 70 THEN
    INSERT INTO public.security_incidents (
      incident_type, severity, title, description,
      affected_user_id, incident_data
    ) VALUES (
      'high_risk_behavior',
      CASE WHEN risk_score > 80 THEN 'high' ELSE 'medium' END,
      'High Risk User Behavior Detected',
      'Automated detection of potentially suspicious user behavior',
      auth.uid(),
      jsonb_build_object(
        'action_type', p_action_type,
        'risk_score', risk_score,
        'details', p_action_details
      )
    );
  END IF;
END;
$$;

-- Function to generate compliance reports
CREATE OR REPLACE FUNCTION public.generate_compliance_report(
  p_report_type TEXT,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_wallet TEXT;
  report_data JSONB := '{}'::jsonb;
  report_id UUID;
BEGIN
  -- Verify admin access
  SELECT verified_wallet_address INTO admin_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address = admin_wallet 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Generate report based on type
  CASE p_report_type
    WHEN 'user_activity' THEN
      SELECT jsonb_build_object(
        'total_users', COUNT(DISTINCT user_id),
        'total_sessions', COUNT(*),
        'unique_ips', COUNT(DISTINCT ip_address),
        'high_risk_actions', COUNT(*) FILTER (WHERE risk_score > 70)
      ) INTO report_data
      FROM public.user_behavior_analytics
      WHERE created_at BETWEEN p_period_start AND p_period_end;
      
    WHEN 'security_incidents' THEN
      SELECT jsonb_build_object(
        'total_incidents', COUNT(*),
        'open_incidents', COUNT(*) FILTER (WHERE status = 'open'),
        'resolved_incidents', COUNT(*) FILTER (WHERE status = 'resolved'),
        'high_severity', COUNT(*) FILTER (WHERE severity = 'high'),
        'incident_types', jsonb_agg(DISTINCT incident_type)
      ) INTO report_data
      FROM public.security_incidents
      WHERE detected_at BETWEEN p_period_start AND p_period_end;
      
    WHEN 'admin_activity' THEN
      SELECT jsonb_build_object(
        'total_actions', COUNT(*),
        'unique_admins', COUNT(DISTINCT admin_wallet_address),
        'successful_actions', COUNT(*) FILTER (WHERE success = true),
        'failed_actions', COUNT(*) FILTER (WHERE success = false),
        'action_types', jsonb_agg(DISTINCT action_type)
      ) INTO report_data
      FROM public.admin_audit_log
      WHERE created_at BETWEEN p_period_start AND p_period_end;
      
    ELSE
      RAISE EXCEPTION 'Unknown report type: %', p_report_type;
  END CASE;
  
  -- Store report
  INSERT INTO public.compliance_reports (
    report_type, report_name, report_data, generated_by,
    period_start, period_end
  ) VALUES (
    p_report_type,
    p_report_type || '_' || to_char(p_period_start, 'YYYY_MM_DD') || '_to_' || to_char(p_period_end, 'YYYY_MM_DD'),
    report_data,
    auth.uid(),
    p_period_start,
    p_period_end
  ) RETURNING id INTO report_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'report_id', report_id,
    'report_data', report_data
  );
END;
$$;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION public.record_performance_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT NULL,
  p_tags JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    metric_type, metric_name, metric_value, metric_unit, tags
  ) VALUES (
    p_metric_type, p_metric_name, p_metric_value, p_metric_unit, p_tags
  );
END;
$$;

-- Indexes for better performance
CREATE INDEX idx_user_behavior_analytics_user_id ON public.user_behavior_analytics(user_id);
CREATE INDEX idx_user_behavior_analytics_created_at ON public.user_behavior_analytics(created_at);
CREATE INDEX idx_user_behavior_analytics_risk_score ON public.user_behavior_analytics(risk_score);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX idx_compliance_reports_type ON public.compliance_reports(report_type);