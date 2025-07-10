-- Reduce default chips from 5 to 3
ALTER TABLE player_balances ALTER COLUMN game_chips SET DEFAULT 3;

-- Update existing users with more than 5 chips to prevent exploitation
UPDATE player_balances SET game_chips = 3 WHERE game_chips = 5;

-- Add premium chip types and features
CREATE TABLE IF NOT EXISTS public.premium_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL,
  feature_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on premium features
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;

-- Create policies for premium features
CREATE POLICY "Users can view their own premium features" 
ON public.premium_features 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own premium features" 
ON public.premium_features 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium features" 
ON public.premium_features 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add tournament entry fee system
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS entry_fee_over NUMERIC DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS premium_tournament BOOLEAN DEFAULT false;

-- Add chip transaction types for premium features
ALTER TABLE chip_transactions ADD COLUMN IF NOT EXISTS feature_type TEXT;
ALTER TABLE chip_transactions ADD COLUMN IF NOT EXISTS premium_type TEXT;

-- Add VIP status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE;

-- Create function for premium chip purchase
CREATE OR REPLACE FUNCTION public.purchase_premium_chips(
  p_chip_amount INTEGER,
  p_over_cost NUMERIC,
  p_premium_type TEXT DEFAULT 'standard'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet TEXT;
  current_over NUMERIC;
  lives_per_chip INTEGER;
  result JSON;
BEGIN
  -- Get user's wallet address
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RETURN json_build_object('error', 'No verified wallet found');
  END IF;
  
  -- Get current OVER balance
  SELECT over_balance INTO current_over
  FROM public.player_balances
  WHERE wallet_address = user_wallet;
  
  IF current_over < p_over_cost THEN
    RETURN json_build_object('error', 'Insufficient OVER balance');
  END IF;
  
  -- Determine lives per chip based on premium type
  lives_per_chip := CASE 
    WHEN p_premium_type = 'premium' THEN 3
    ELSE 2
  END;
  
  -- Deduct OVER and add chips
  UPDATE public.player_balances
  SET over_balance = over_balance - p_over_cost,
      game_chips = game_chips + p_chip_amount,
      last_updated = now()
  WHERE wallet_address = user_wallet;
  
  -- Record transaction
  INSERT INTO public.chip_transactions (
    user_id, chip_amount, over_amount, transaction_type, premium_type
  ) VALUES (
    auth.uid(), p_chip_amount, p_over_cost, 'purchase', p_premium_type
  );
  
  RETURN json_build_object(
    'success', true,
    'chips_added', p_chip_amount,
    'lives_per_chip', lives_per_chip,
    'over_spent', p_over_cost
  );
END;
$$;

-- Create function for VIP status purchase
CREATE OR REPLACE FUNCTION public.purchase_vip_status(
  p_duration_days INTEGER DEFAULT 30
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet TEXT;
  current_over NUMERIC;
  vip_cost NUMERIC;
  result JSON;
BEGIN
  vip_cost := 10; -- 10 OVER for VIP
  
  -- Get user's wallet address
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RETURN json_build_object('error', 'No verified wallet found');
  END IF;
  
  -- Get current OVER balance
  SELECT over_balance INTO current_over
  FROM public.player_balances
  WHERE wallet_address = user_wallet;
  
  IF current_over < vip_cost THEN
    RETURN json_build_object('error', 'Insufficient OVER balance');
  END IF;
  
  -- Deduct OVER and grant VIP
  UPDATE public.player_balances
  SET over_balance = over_balance - vip_cost,
      last_updated = now()
  WHERE wallet_address = user_wallet;
  
  UPDATE public.profiles
  SET vip_status = true,
      vip_expires_at = COALESCE(vip_expires_at, now()) + INTERVAL '1 day' * p_duration_days,
      updated_at = now()
  WHERE user_id = auth.uid();
  
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
    'over_spent', vip_cost
  );
END;
$$;