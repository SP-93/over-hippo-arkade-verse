-- Fix wallet address case sensitivity in admin checks
-- Update the is_admin_wallet function to be case insensitive
CREATE OR REPLACE FUNCTION public.is_admin_wallet(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_config 
        WHERE LOWER(admin_wallet_address) = LOWER(wallet_address)
        AND is_active = true
    );
END;
$function$;