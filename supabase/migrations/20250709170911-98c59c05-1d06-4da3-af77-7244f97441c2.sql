-- Update RLS policy for wallet_verifications to allow wallet connection without user_id requirement initially
-- This will allow wallet verification process to work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own wallet verifications" ON public.wallet_verifications;
DROP POLICY IF EXISTS "Users can view their own wallet verifications" ON public.wallet_verifications;

-- Create new policies that work with the wallet connection flow
CREATE POLICY "Allow wallet verification insertion" 
ON public.wallet_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view wallet verifications by address" 
ON public.wallet_verifications 
FOR SELECT 
USING (
  wallet_address IN (
    SELECT verified_wallet_address 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  ) OR auth.uid() IS NULL
);