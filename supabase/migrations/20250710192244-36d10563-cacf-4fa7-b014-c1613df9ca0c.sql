-- Fix wallet_verifications table for proper wallet connection

-- Add UNIQUE constraint on wallet_address (required for upsert)
ALTER TABLE public.wallet_verifications 
ADD CONSTRAINT wallet_verifications_wallet_address_unique UNIQUE (wallet_address);

-- Drop and recreate RLS policies with better logic
DROP POLICY IF EXISTS "Users can insert wallet verifications" ON public.wallet_verifications;
DROP POLICY IF EXISTS "Allow wallet verification insertion" ON public.wallet_verifications;

-- Create improved RLS policy for INSERT that handles the wallet connection flow properly
CREATE POLICY "Allow wallet verification with user context" 
ON public.wallet_verifications 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and user_id matches auth.uid()
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  -- Allow initial wallet verification without user_id (will be updated later)
  (user_id IS NULL AND auth.uid() IS NOT NULL)
);

-- Create policy for UPDATE to allow setting user_id
CREATE POLICY "Users can update their wallet verifications" 
ON public.wallet_verifications 
FOR UPDATE 
USING (
  -- Allow updating if wallet belongs to current user or if setting user_id for first time
  (user_id = auth.uid()) OR 
  (user_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  -- Ensure user_id is set to current user
  user_id = auth.uid()
);

-- Improve SELECT policy to handle user context better
DROP POLICY IF EXISTS "Users can view wallet verifications by address" ON public.wallet_verifications;
DROP POLICY IF EXISTS "Users can view their own wallet verifications" ON public.wallet_verifications;

CREATE POLICY "Users can view relevant wallet verifications" 
ON public.wallet_verifications 
FOR SELECT 
USING (
  -- Users can see their own wallet verifications
  (user_id = auth.uid()) OR
  -- Allow viewing during verification process
  (user_id IS NULL AND auth.uid() IS NOT NULL) OR
  -- Admins can see all
  (EXISTS (
    SELECT 1 FROM public.admin_config ac
    JOIN public.profiles p ON p.verified_wallet_address = ac.admin_wallet_address
    WHERE p.user_id = auth.uid() AND ac.is_active = true
  ))
);