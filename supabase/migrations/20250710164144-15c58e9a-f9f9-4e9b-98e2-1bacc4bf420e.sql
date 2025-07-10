-- FAZA 1C: Database Security Hardening

-- 1. Create audit logging table for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_wallet_address text NOT NULL,
  admin_user_id uuid,
  action_type text NOT NULL, -- 'chip_grant', 'balance_update', 'user_ban', 'withdrawal', etc.
  target_user_id uuid,
  target_wallet_address text,
  action_details jsonb,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address IN (
      SELECT verified_wallet_address FROM public.profiles 
      WHERE user_id = auth.uid()
    ) AND is_active = true
  )
);

-- Only system can insert audit logs (no direct user access)
CREATE POLICY "System only can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (false); -- Block all direct inserts

-- 2. Enhanced admin_config RLS policies
DROP POLICY IF EXISTS "Admin config is viewable by authenticated users" ON public.admin_config;

-- Create more restrictive policy - only active admins can view admin config
CREATE POLICY "Only active admins can view admin config"
ON public.admin_config
FOR SELECT
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM public.admin_config ac2
    WHERE ac2.admin_wallet_address IN (
      SELECT verified_wallet_address FROM public.profiles 
      WHERE user_id = auth.uid()
    ) AND ac2.is_active = true
  )
);

-- 3. Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_wallet_address text DEFAULT NULL,
  p_action_details jsonb DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_wallet text;
  audit_id uuid;
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
  
  -- Insert audit log (bypassing RLS with SECURITY DEFINER)
  INSERT INTO public.admin_audit_log (
    admin_wallet_address,
    admin_user_id,
    action_type,
    target_user_id,
    target_wallet_address,
    action_details,
    success,
    error_message
  ) VALUES (
    admin_wallet,
    auth.uid(),
    p_action_type,
    p_target_user_id,
    p_target_wallet_address,
    p_action_details,
    p_success,
    p_error_message
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- 4. Create function to get admin audit logs
CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  admin_wallet_address text,
  action_type text,
  target_wallet_address text,
  action_details jsonb,
  success boolean,
  error_message text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_wallet text;
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
  
  -- Return audit logs
  RETURN QUERY
  SELECT 
    aal.id,
    aal.admin_wallet_address,
    aal.action_type,
    aal.target_wallet_address,
    aal.action_details,
    aal.success,
    aal.error_message,
    aal.created_at
  FROM public.admin_audit_log aal
  ORDER BY aal.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. Enhanced is_admin_wallet function with logging
CREATE OR REPLACE FUNCTION public.is_admin_wallet_with_logging(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_result boolean;
BEGIN
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE LOWER(admin_wallet_address) = LOWER(wallet_address)
    AND is_active = true
  ) INTO is_admin_result;
  
  -- Log admin check (if auth context available)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_wallet_address,
      admin_user_id,
      action_type,
      action_details,
      success
    ) VALUES (
      wallet_address,
      auth.uid(),
      'admin_check',
      jsonb_build_object('result', is_admin_result),
      true
    );
  END IF;
  
  RETURN is_admin_result;
EXCEPTION WHEN OTHERS THEN
  -- Log failed check
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_wallet_address,
      admin_user_id,
      action_type,
      action_details,
      success,
      error_message
    ) VALUES (
      wallet_address,
      auth.uid(),
      'admin_check',
      jsonb_build_object('result', false),
      false,
      SQLERRM
    );
  END IF;
  
  RETURN false;
END;
$$;