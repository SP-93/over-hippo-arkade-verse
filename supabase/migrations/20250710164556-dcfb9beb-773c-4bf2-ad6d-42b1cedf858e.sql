-- FAZA 1D: Edge Function Security - Rate Limiting & Session Management

-- 1. Create rate limiting table
CREATE TABLE public.admin_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_wallet_address text NOT NULL,
  action_type text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  last_request timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limit table
ALTER TABLE public.admin_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own rate limit data
CREATE POLICY "Admins can view own rate limit data"
ON public.admin_rate_limit
FOR SELECT
USING (
  admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND 
  EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address = public.admin_rate_limit.admin_wallet_address 
    AND is_active = true
  )
);

-- System can manage rate limit data
CREATE POLICY "System can manage rate limit data"
ON public.admin_rate_limit
FOR ALL
USING (false) -- Block all access, will use security definer functions
WITH CHECK (false);

-- 2. Create admin session tracking table
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_wallet_address text NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone DEFAULT (now() + interval '2 hours'),
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own sessions
CREATE POLICY "Admins can view own sessions"
ON public.admin_sessions
FOR SELECT
USING (
  admin_wallet_address IN (
    SELECT verified_wallet_address FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND 
  EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address = public.admin_sessions.admin_wallet_address 
    AND is_active = true
  )
);

-- 3. Create rate limiting check function
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
  p_admin_wallet text,
  p_action_type text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_window_start timestamp with time zone;
  rate_record record;
  is_blocked boolean := false;
  requests_in_window integer := 0;
  remaining_requests integer;
BEGIN
  -- Calculate current window start
  current_window_start := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes) * interval '1 minute';
  
  -- Get existing rate limit record for this window
  SELECT * INTO rate_record
  FROM public.admin_rate_limit
  WHERE admin_wallet_address = p_admin_wallet
    AND action_type = p_action_type
    AND window_start = current_window_start;
  
  -- Check if currently blocked
  IF rate_record.blocked_until IS NOT NULL AND rate_record.blocked_until > now() THEN
    is_blocked := true;
    requests_in_window := rate_record.request_count;
  ELSE
    -- Update or create rate limit record
    IF rate_record.id IS NOT NULL THEN
      -- Update existing record
      UPDATE public.admin_rate_limit
      SET request_count = request_count + 1,
          last_request = now(),
          blocked_until = CASE 
            WHEN request_count + 1 > p_max_requests 
            THEN now() + interval '15 minutes'
            ELSE NULL
          END
      WHERE id = rate_record.id
      RETURNING request_count INTO requests_in_window;
    ELSE
      -- Create new record
      INSERT INTO public.admin_rate_limit (
        admin_wallet_address, action_type, window_start
      ) VALUES (
        p_admin_wallet, p_action_type, current_window_start
      ) RETURNING request_count INTO requests_in_window;
    END IF;
    
    -- Check if we just hit the limit
    IF requests_in_window > p_max_requests THEN
      is_blocked := true;
    END IF;
  END IF;
  
  remaining_requests := GREATEST(0, p_max_requests - requests_in_window);
  
  RETURN jsonb_build_object(
    'allowed', NOT is_blocked,
    'requests_made', requests_in_window,
    'requests_remaining', remaining_requests,
    'window_reset', current_window_start + (p_window_minutes * interval '1 minute'),
    'blocked_until', rate_record.blocked_until
  );
END;
$$;

-- 4. Create admin session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session(
  p_session_token text,
  p_admin_wallet text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record record;
  is_valid boolean := false;
BEGIN
  -- Get session record
  SELECT * INTO session_record
  FROM public.admin_sessions
  WHERE session_token = p_session_token
    AND admin_wallet_address = p_admin_wallet
    AND is_active = true
    AND expires_at > now();
  
  IF session_record.id IS NOT NULL THEN
    is_valid := true;
    
    -- Update last activity
    UPDATE public.admin_sessions
    SET last_activity = now()
    WHERE id = session_record.id;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', is_valid,
    'session_id', session_record.id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- 5. Create function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session(
  p_admin_wallet text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token text;
  session_id uuid;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address = p_admin_wallet 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not an admin wallet';
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Deactivate old sessions for this admin
  UPDATE public.admin_sessions
  SET is_active = false
  WHERE admin_wallet_address = p_admin_wallet
    AND is_active = true;
  
  -- Create new session
  INSERT INTO public.admin_sessions (
    admin_wallet_address,
    session_token,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_wallet,
    session_token,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', now() + interval '2 hours'
  );
END;
$$;