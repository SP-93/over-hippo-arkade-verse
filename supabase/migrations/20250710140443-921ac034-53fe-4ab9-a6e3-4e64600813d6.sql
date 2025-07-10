-- Fix security issues: Add set search_path = '' to all functions
CREATE OR REPLACE FUNCTION public.increment_chips(wallet_addr text, amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    current_chips integer;
BEGIN
    SELECT game_chips INTO current_chips 
    FROM public.player_balances 
    WHERE wallet_address = wallet_addr;
    
    IF current_chips IS NULL THEN
        current_chips := 3; -- Default starting chips (updated from 5 to 3)
    END IF;
    
    RETURN current_chips + amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_over(wallet_addr text, amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    current_over numeric;
BEGIN
    SELECT over_balance INTO current_over 
    FROM public.player_balances 
    WHERE wallet_address = wallet_addr;
    
    IF current_over IS NULL THEN
        current_over := 0;
    END IF;
    
    RETURN current_over + amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_earnings(wallet_addr text, amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    current_earnings numeric;
BEGIN
    SELECT total_earnings INTO current_earnings 
    FROM public.player_balances 
    WHERE wallet_address = wallet_addr;
    
    IF current_earnings IS NULL THEN
        current_earnings := 0;
    END IF;
    
    RETURN current_earnings + amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_over(wallet_addr text, amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    current_over numeric;
BEGIN
    SELECT over_balance INTO current_over 
    FROM public.player_balances 
    WHERE wallet_address = wallet_addr;
    
    IF current_over IS NULL OR current_over < amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    RETURN current_over - amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_wallet(wallet_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_config 
        WHERE LOWER(admin_wallet_address) = LOWER(wallet_address)
        AND is_active = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_wallet_signature(p_wallet_address text, p_message text, p_signature text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- In production, this would verify the signature cryptographically
    -- For now, we'll implement basic validation
    IF length(p_wallet_address) = 42 AND 
       starts_with(p_wallet_address, '0x') AND
       length(p_signature) >= 130 THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_wallet_exclusivity(p_wallet_address text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_game_performance_session_id ON public.game_performance(session_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_session_id ON public.game_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);

-- Update RLS policies to use (SELECT auth.uid()) for better performance
DROP POLICY IF EXISTS "Users can view their own balance" ON public.player_balances;
CREATE POLICY "Users can view their own balance" 
ON public.player_balances 
FOR SELECT 
USING (wallet_address IN ( 
  SELECT profiles.verified_wallet_address
  FROM public.profiles
  WHERE profiles.user_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Users can update their own balance" ON public.player_balances;
CREATE POLICY "Users can update their own balance" 
ON public.player_balances 
FOR UPDATE 
USING (wallet_address IN ( 
  SELECT profiles.verified_wallet_address
  FROM public.profiles
  WHERE profiles.user_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Users can insert their own balance" ON public.player_balances;
CREATE POLICY "Users can insert their own balance" 
ON public.player_balances 
FOR INSERT 
WITH CHECK (wallet_address IN ( 
  SELECT profiles.verified_wallet_address
  FROM public.profiles
  WHERE profiles.user_id = (SELECT auth.uid())
));

-- Update other critical RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);