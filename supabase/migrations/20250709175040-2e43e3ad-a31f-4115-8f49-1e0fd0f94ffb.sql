-- Update admin wallet address to user's connected wallet
UPDATE public.admin_config 
SET admin_wallet_address = '0x4dea071d64f77f2f94ac1eb80d1b7b2681993477'
WHERE admin_wallet_address = '0x88d26e867b289AD2e63A0BE905f9BC803A64F37f';

-- Also add debugging function for admin check
CREATE OR REPLACE FUNCTION public.log_admin_check(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result boolean;
BEGIN
    SELECT public.is_admin_wallet(wallet_address) INTO result;
    RAISE NOTICE 'Admin check for wallet %: %', wallet_address, result;
    RETURN result;
END;
$$;