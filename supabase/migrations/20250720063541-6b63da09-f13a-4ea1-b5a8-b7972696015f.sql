-- Create function to increment WOVER balance
CREATE OR REPLACE FUNCTION public.increment_wover_balance(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_wallet text;
  new_balance numeric;
BEGIN
  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF user_wallet IS NULL THEN
    RAISE EXCEPTION 'No verified wallet found for user';
  END IF;
  
  -- Update WOVER balance atomically
  UPDATE public.player_balances
  SET wover_balance = COALESCE(wover_balance, 0) + p_amount,
      last_updated = now()
  WHERE wallet_address = user_wallet
  RETURNING wover_balance INTO new_balance;
  
  -- If no balance record exists, create one
  IF new_balance IS NULL THEN
    INSERT INTO public.player_balances (
      wallet_address, game_chips, over_balance, wover_balance, total_earnings
    ) VALUES (
      user_wallet, 3, 0, p_amount, 0
    ) RETURNING wover_balance INTO new_balance;
  END IF;
  
  RETURN new_balance;
END;
$function$;