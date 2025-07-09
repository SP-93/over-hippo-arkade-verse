-- Add helper functions for blockchain operations
CREATE OR REPLACE FUNCTION public.increment_chips(wallet_addr text, amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_chips integer;
BEGIN
    SELECT game_chips INTO current_chips 
    FROM public.player_balances 
    WHERE wallet_address = wallet_addr;
    
    IF current_chips IS NULL THEN
        current_chips := 5; -- Default starting chips
    END IF;
    
    RETURN current_chips + amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_over(wallet_addr text, amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.increment_earnings(wallet_addr text, amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.decrement_over(wallet_addr text, amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;