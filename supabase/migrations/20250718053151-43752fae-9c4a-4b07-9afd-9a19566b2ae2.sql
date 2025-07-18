-- Add WOVER balance support to player_balances table
ALTER TABLE public.player_balances 
ADD COLUMN wover_balance NUMERIC DEFAULT 0;

-- Create wover_transactions table for tracking
CREATE TABLE public.wover_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wover_amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  feature_type TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on wover_transactions
ALTER TABLE public.wover_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wover_transactions
CREATE POLICY "Users can view their own wover transactions" 
ON public.wover_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wover transactions" 
ON public.wover_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update purchase_vip_status function to use WOVER instead of OVER
CREATE OR REPLACE FUNCTION public.purchase_vip_status(p_duration_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_wallet TEXT;
  current_wover NUMERIC;
  vip_cost NUMERIC;
  result JSON;
BEGIN
  vip_cost := 10; -- 10 WOVER for VIP (changed from OVER)
  
  -- Get user's wallet address
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RETURN json_build_object('error', 'No verified wallet found');
  END IF;
  
  -- Get current WOVER balance
  SELECT wover_balance INTO current_wover
  FROM public.player_balances
  WHERE wallet_address = user_wallet;
  
  IF current_wover < vip_cost THEN
    RETURN json_build_object('error', 'Insufficient WOVER balance');
  END IF;
  
  -- Deduct WOVER and grant VIP
  UPDATE public.player_balances
  SET wover_balance = wover_balance - vip_cost,
      last_updated = now()
  WHERE wallet_address = user_wallet;
  
  UPDATE public.profiles
  SET vip_status = true,
      vip_expires_at = COALESCE(vip_expires_at, now()) + INTERVAL '1 day' * p_duration_days,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Record WOVER transaction
  INSERT INTO public.wover_transactions (
    user_id, wover_amount, transaction_type, feature_type
  ) VALUES (
    auth.uid(), vip_cost, 'vip_purchase', 'vip_status'
  );
  
  -- Record premium feature
  INSERT INTO public.premium_features (
    user_id, feature_type, feature_data, expires_at
  ) VALUES (
    auth.uid(), 'vip_status', 
    json_build_object('duration_days', p_duration_days),
    COALESCE((SELECT vip_expires_at FROM profiles WHERE user_id = auth.uid()), now()) + INTERVAL '1 day' * p_duration_days
  );
  
  RETURN json_build_object(
    'success', true,
    'vip_duration', p_duration_days,
    'wover_spent', vip_cost
  );
END;
$function$;

-- Update get_secure_wallet_balance to include WOVER
CREATE OR REPLACE FUNCTION public.get_secure_wallet_balance(p_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
      'wover_balance', 0,
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
      'wover_balance', 0,
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
      wallet_address, game_chips, over_balance, wover_balance, total_earnings
    ) VALUES (
      user_wallet, 3, 0, 0, 0
    ) RETURNING * INTO balance_record;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'has_wallet', true,
    'wallet_address', user_wallet,
    'game_chips', COALESCE(balance_record.game_chips, 3),
    'over_balance', COALESCE(balance_record.over_balance, 0),
    'wover_balance', COALESCE(balance_record.wover_balance, 0),
    'total_earnings', COALESCE(balance_record.total_earnings, 0),
    'last_updated', balance_record.last_updated
  );
END;
$function$;