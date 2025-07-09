-- Add wallet exclusivity and ban system
-- Add banned status to wallet_verifications table
ALTER TABLE public.wallet_verifications 
ADD COLUMN is_banned boolean DEFAULT false,
ADD COLUMN banned_at timestamp with time zone,
ADD COLUMN banned_by_admin_id uuid,
ADD COLUMN ban_reason text;

-- Create unique constraint to prevent same wallet for multiple users
-- First, we need to handle existing duplicate wallets
UPDATE public.wallet_verifications 
SET is_banned = true, 
    banned_at = now(),
    ban_reason = 'Multiple user assignment detected'
WHERE wallet_address IN (
    SELECT wallet_address 
    FROM public.wallet_verifications 
    WHERE user_id IS NOT NULL 
    GROUP BY wallet_address 
    HAVING COUNT(DISTINCT user_id) > 1
);

-- Add constraint to prevent wallet reuse across users
-- This will prevent future violations
CREATE UNIQUE INDEX idx_wallet_user_exclusive 
ON public.wallet_verifications (wallet_address) 
WHERE user_id IS NOT NULL AND is_banned = false;

-- Create function to check wallet exclusivity before assignment
CREATE OR REPLACE FUNCTION public.check_wallet_exclusivity(
    p_wallet_address text,
    p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id uuid;
    is_wallet_banned boolean;
BEGIN
    -- Check if wallet is banned
    SELECT is_banned INTO is_wallet_banned
    FROM public.wallet_verifications
    WHERE wallet_address = p_wallet_address
    LIMIT 1;
    
    IF is_wallet_banned = true THEN
        RETURN false;
    END IF;
    
    -- Check if wallet is already assigned to another user
    SELECT user_id INTO existing_user_id
    FROM public.wallet_verifications
    WHERE wallet_address = p_wallet_address 
    AND user_id IS NOT NULL
    AND is_banned = false
    LIMIT 1;
    
    -- If wallet is not assigned to anyone, it's available
    IF existing_user_id IS NULL THEN
        RETURN true;
    END IF;
    
    -- If wallet is assigned to the same user, it's OK
    IF existing_user_id = p_user_id THEN
        RETURN true;
    END IF;
    
    -- If wallet is assigned to different user, ban both users
    -- Ban the wallet for all users
    UPDATE public.wallet_verifications
    SET is_banned = true,
        banned_at = now(),
        ban_reason = 'Wallet conflict detected - same wallet used by multiple users'
    WHERE wallet_address = p_wallet_address;
    
    -- Ban the users in profiles table
    UPDATE public.profiles
    SET verified_wallet_address = null,
        wallet_verified_at = null
    WHERE user_id = existing_user_id OR user_id = p_user_id;
    
    RETURN false;
END;
$$;

-- Create function to unban wallet (admin only)
CREATE OR REPLACE FUNCTION public.unban_wallet(
    p_wallet_address text,
    p_admin_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the admin user is actually an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_config ac
        JOIN public.profiles p ON p.verified_wallet_address = ac.admin_wallet_address
        WHERE p.user_id = p_admin_user_id AND ac.is_active = true
    ) THEN
        RAISE EXCEPTION 'Only admin can unban wallets';
    END IF;
    
    -- Unban the wallet
    UPDATE public.wallet_verifications
    SET is_banned = false,
        banned_at = null,
        banned_by_admin_id = p_admin_user_id,
        ban_reason = 'Unbanned by admin'
    WHERE wallet_address = p_wallet_address;
    
    RETURN true;
END;
$$;