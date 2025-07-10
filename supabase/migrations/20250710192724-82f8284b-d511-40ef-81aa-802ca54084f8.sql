-- The issue might be the foreign key constraint to auth.users
-- Let's temporarily drop it and recreate it as a deferred constraint
-- This will allow the upsert operation to work properly

-- First, let's see what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.wallet_verifications'::regclass 
AND contype = 'f';

-- Drop the foreign key constraint temporarily
ALTER TABLE public.wallet_verifications 
DROP CONSTRAINT IF EXISTS wallet_verifications_user_id_fkey;

-- Recreate it as a deferred constraint that allows NULL values
ALTER TABLE public.wallet_verifications 
ADD CONSTRAINT wallet_verifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;