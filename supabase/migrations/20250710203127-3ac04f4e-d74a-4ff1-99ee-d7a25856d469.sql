-- Fix get_secure_wallet_balance function to work with edge functions
-- The issue is that auth.uid() doesn't work with service role key authentication

CREATE OR REPLACE FUNCTION public.get_secure_wallet_balance(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet text;
  balance_record record;
  target_user_id uuid;
BEGIN
  -- Use provided user_id or fallback to auth.uid()
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No user ID provided and no auth context',
      'has_wallet', false,
      'game_chips', 0,
      'over_balance', 0,
      'total_earnings', 0
    );
  END IF;
  
  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  IF user_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No verified wallet found',
      'has_wallet', false,
      'game_chips', 0,
      'over_balance', 0,
      'total_earnings', 0
    );
  END IF;
  
  -- Get balance with proper defaults
  SELECT * INTO balance_record
  FROM public.player_balances
  WHERE wallet_address = user_wallet;
  
  IF NOT FOUND THEN
    -- Create default balance if doesn't exist
    INSERT INTO public.player_balances (
      wallet_address, game_chips, over_balance, total_earnings
    ) VALUES (
      user_wallet, 3, 0, 0
    ) RETURNING * INTO balance_record;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'has_wallet', true,
    'wallet_address', user_wallet,
    'game_chips', COALESCE(balance_record.game_chips, 3),
    'over_balance', COALESCE(balance_record.over_balance, 0),
    'total_earnings', COALESCE(balance_record.total_earnings, 0),
    'last_updated', balance_record.last_updated
  );
END;
$$;