-- Fix wallet connection 500 error by resolving policy conflicts and infinite recursion

-- 1. Fix infinite recursion in admin_config by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_config ac
    JOIN public.profiles p ON p.verified_wallet_address = ac.admin_wallet_address
    WHERE p.user_id = auth.uid() AND ac.is_active = true
  );
END;
$$;

-- 2. Drop conflicting UPDATE policies on wallet_verifications
DROP POLICY IF EXISTS "Only admins can ban wallets" ON public.wallet_verifications;
DROP POLICY IF EXISTS "Users can update their wallet verifications" ON public.wallet_verifications;

-- 3. Create separate, non-conflicting policies for wallet_verifications
-- Policy for normal user updates (wallet verification process)
CREATE POLICY "Users can verify their wallets" 
ON public.wallet_verifications 
FOR UPDATE 
USING (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NOT NULL))
WITH CHECK (user_id = auth.uid());

-- Policy for admin banning operations only
CREATE POLICY "Admins can ban wallets" 
ON public.wallet_verifications 
FOR UPDATE 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 4. Fix admin_config policy to use security definer function
DROP POLICY IF EXISTS "Only active admins can view admin config" ON public.admin_config;

-- Create a separate function for admin config to avoid recursion
CREATE OR REPLACE FUNCTION public.check_admin_config_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER STABLE
AS $$
BEGIN
  -- Simple check without recursion - just check if user has verified wallet that matches any admin config
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.verified_wallet_address IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.admin_config ac 
      WHERE ac.admin_wallet_address = p.verified_wallet_address 
      AND ac.is_active = true
    )
  );
END;
$$;

CREATE POLICY "Only active admins can view admin config" 
ON public.admin_config 
FOR SELECT 
USING (is_active = true AND public.check_admin_config_access());

-- 5. Ensure wallet_verifications has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_user_id ON public.wallet_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_wallet_address ON public.wallet_verifications(wallet_address);