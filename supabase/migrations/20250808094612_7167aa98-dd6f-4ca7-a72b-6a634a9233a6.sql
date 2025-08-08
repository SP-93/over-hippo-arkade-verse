
-- Fix: set a deterministic, safe search_path on the function
ALTER FUNCTION public.generate_compliance_report(
  p_report_type text,
  p_period_start timestamp with time zone,
  p_period_end timestamp with time zone
)
SET search_path TO '';
