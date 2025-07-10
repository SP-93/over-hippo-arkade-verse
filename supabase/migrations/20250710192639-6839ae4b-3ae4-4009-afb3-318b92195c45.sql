-- Clean up conflicting policies and constraints

-- Remove duplicate UNIQUE constraint (keep the newer one)
ALTER TABLE public.wallet_verifications 
DROP CONSTRAINT IF EXISTS wallet_verifications_wallet_address_key;

-- Clean up conflicting UPDATE policies
DROP POLICY IF EXISTS "Users can update their own wallet verifications" ON public.wallet_verifications;

-- Keep only the policies that work together
-- The INSERT policy is good
-- The admin ban policy is fine for admin operations
-- The new UPDATE policy handles user updates
-- The SELECT policy is good

-- Let's also make sure the foreign key constraint allows NULL values properly
-- by checking the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;