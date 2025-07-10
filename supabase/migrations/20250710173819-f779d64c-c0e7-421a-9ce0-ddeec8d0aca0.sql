-- Create failed login attempts tracking table
CREATE TABLE public.auth_failed_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  failure_reason TEXT,
  device_fingerprint TEXT
);

-- Create index for efficient querying
CREATE INDEX idx_auth_failed_attempts_email ON public.auth_failed_attempts(email);
CREATE INDEX idx_auth_failed_attempts_ip ON public.auth_failed_attempts(ip_address);
CREATE INDEX idx_auth_failed_attempts_time ON public.auth_failed_attempts(attempt_time);

-- Enable RLS
ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy - only admins can view failed attempts
CREATE POLICY "Only admins can view failed attempts" 
ON public.auth_failed_attempts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

-- Enhance admin_sessions table with device tracking
ALTER TABLE public.admin_sessions 
ADD COLUMN device_fingerprint TEXT,
ADD COLUMN last_seen_ip TEXT,
ADD COLUMN login_location TEXT;

-- Create account lockout table
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_ip TEXT,
  created_by_system BOOLEAN DEFAULT true
);

-- Enable RLS on lockouts
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Create policy for account lockouts
CREATE POLICY "Only admins can view lockouts" 
ON public.account_lockouts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.admin_config 
  WHERE admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND is_active = true
));

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.account_lockouts
    WHERE email = LOWER(p_email)
    AND locked_until > now()
  );
END;
$$;

-- Create function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  failure_count INTEGER;
  lockout_threshold INTEGER := 5; -- Lock after 5 failed attempts
  lockout_duration INTERVAL := '15 minutes';
BEGIN
  -- Record the failed attempt
  INSERT INTO public.auth_failed_attempts (
    email, ip_address, user_agent, failure_reason, device_fingerprint
  ) VALUES (
    LOWER(p_email), p_ip_address, p_user_agent, p_failure_reason, p_device_fingerprint
  );
  
  -- Count recent failures (last 15 minutes)
  SELECT COUNT(*) INTO failure_count
  FROM public.auth_failed_attempts
  WHERE email = LOWER(p_email)
  AND attempt_time > now() - lockout_duration;
  
  -- Lock account if threshold exceeded
  IF failure_count >= lockout_threshold THEN
    INSERT INTO public.account_lockouts (
      email, locked_until, failure_count, last_attempt_ip
    ) VALUES (
      LOWER(p_email), 
      now() + lockout_duration,
      failure_count,
      p_ip_address
    )
    ON CONFLICT (email) DO UPDATE SET
      locked_until = now() + lockout_duration,
      failure_count = failure_count + 1,
      last_attempt_ip = p_ip_address,
      locked_at = now();
      
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', now() + lockout_duration,
      'failure_count', failure_count
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'failure_count', failure_count,
    'threshold', lockout_threshold
  );
END;
$$;

-- Create function to unlock account (admin only)
CREATE OR REPLACE FUNCTION public.unlock_account(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  admin_wallet TEXT;
BEGIN
  -- Get admin wallet from current user
  SELECT verified_wallet_address INTO admin_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address = admin_wallet 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Remove lockout
  DELETE FROM public.account_lockouts
  WHERE email = LOWER(p_email);
  
  -- Log admin action
  INSERT INTO public.admin_audit_log (
    admin_wallet_address,
    admin_user_id,
    action_type,
    action_details,
    success
  ) VALUES (
    admin_wallet,
    auth.uid(),
    'unlock_account',
    jsonb_build_object('email', p_email),
    true
  );
  
  RETURN true;
END;
$$;