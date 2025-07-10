-- Enhanced admin operations edge function to support admin wallet protection
-- This migration adds admin wallet protection to prevent accidental chip deletion

-- Update admin_config table to include chip limits for admins
ALTER TABLE admin_config 
ADD COLUMN IF NOT EXISTS max_chips_allowed INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS unlimited_chips BOOLEAN DEFAULT true;

-- Create function to check if a wallet is admin wallet with chip protection
CREATE OR REPLACE FUNCTION public.is_admin_wallet_with_chip_protection(wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_config_row RECORD;
BEGIN
  -- Check if wallet is admin
  SELECT * INTO admin_config_row
  FROM public.admin_config 
  WHERE LOWER(admin_wallet_address) = LOWER(wallet_address)
  AND is_active = true;
  
  IF admin_config_row.admin_wallet_address IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_admin', true,
      'unlimited_chips', COALESCE(admin_config_row.unlimited_chips, true),
      'max_chips_allowed', COALESCE(admin_config_row.max_chips_allowed, 1000),
      'admin_role', admin_config_row.admin_role
    );
  ELSE
    RETURN jsonb_build_object(
      'is_admin', false,
      'unlimited_chips', false,
      'max_chips_allowed', 3
    );
  END IF;
END;
$$;

-- Enhanced function for safe admin chip operations
CREATE OR REPLACE FUNCTION public.safe_admin_add_chips(p_chip_amount integer, p_admin_protection boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet text;
  admin_info jsonb;
  current_chips integer;
  new_chips integer;
  operation_result jsonb;
BEGIN
  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No verified wallet found');
  END IF;
  
  -- Check admin status and protection settings
  SELECT public.is_admin_wallet_with_chip_protection(user_wallet) INTO admin_info;
  
  IF NOT (admin_info->>'is_admin')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin privileges required');
  END IF;
  
  -- Get current chip balance
  SELECT game_chips INTO current_chips
  FROM public.player_balances
  WHERE wallet_address = user_wallet;
  
  -- If no balance record exists, create one
  IF current_chips IS NULL THEN
    INSERT INTO public.player_balances (
      wallet_address, game_chips, over_balance, total_earnings
    ) VALUES (
      user_wallet, 3, 0, 0
    );
    current_chips := 3;
  END IF;
  
  -- Calculate new chip amount
  new_chips := current_chips + p_chip_amount;
  
  -- Apply limits only if admin protection is enabled and unlimited_chips is false
  IF p_admin_protection AND NOT (admin_info->>'unlimited_chips')::boolean THEN
    IF new_chips > (admin_info->>'max_chips_allowed')::integer THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Chip limit exceeded. Max allowed: ' || (admin_info->>'max_chips_allowed')::text
      );
    END IF;
  END IF;
  
  -- Update balance
  UPDATE public.player_balances
  SET 
    game_chips = new_chips,
    last_updated = now()
  WHERE wallet_address = user_wallet;
  
  -- Log the admin operation
  INSERT INTO public.chip_transactions (
    user_id,
    chip_amount,
    transaction_type,
    status
  ) VALUES (
    auth.uid(),
    p_chip_amount,
    'admin_add_chips',
    'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', current_chips,
    'new_balance', new_chips,
    'chip_amount_added', p_chip_amount,
    'admin_protection', p_admin_protection,
    'unlimited_chips', (admin_info->>'unlimited_chips')::boolean
  );
END;
$$;