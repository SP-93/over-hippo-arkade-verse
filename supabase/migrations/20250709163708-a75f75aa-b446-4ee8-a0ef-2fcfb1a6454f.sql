
-- Create admin configuration table
CREATE TABLE public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_wallet_address text NOT NULL UNIQUE,
  admin_role text NOT NULL DEFAULT 'super_admin',
  permissions jsonb DEFAULT '{"full_access": true}',
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only allow reading admin config (no public insert/update/delete)
CREATE POLICY "Admin config is viewable by authenticated users"
ON public.admin_config
FOR SELECT
USING (auth.role() = 'authenticated');

-- Insert initial admin wallet (replace with actual admin wallet)
INSERT INTO public.admin_config (admin_wallet_address, admin_role) 
VALUES ('0x88d26e867b289AD2e63A0BE905f9BC803A64F37f', 'super_admin');

-- Create function to check if wallet is admin
CREATE OR REPLACE FUNCTION public.is_admin_wallet(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_config 
        WHERE admin_wallet_address = wallet_address 
        AND is_active = true
    );
END;
$$;

-- Create real balance tracking table
CREATE TABLE public.player_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  over_balance numeric(20,8) DEFAULT 0,
  game_chips integer DEFAULT 0,
  total_earnings numeric(20,8) DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for player balances
ALTER TABLE public.player_balances ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own balance
CREATE POLICY "Users can view their own balance"
ON public.player_balances
FOR SELECT
USING (wallet_address IN (
  SELECT verified_wallet_address FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own balance"
ON public.player_balances
FOR INSERT
WITH CHECK (wallet_address IN (
  SELECT verified_wallet_address FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own balance"
ON public.player_balances
FOR UPDATE
USING (wallet_address IN (
  SELECT verified_wallet_address FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Create real transaction log table
CREATE TABLE public.blockchain_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  transaction_type text NOT NULL, -- 'chip_purchase', 'token_withdrawal', 'score_reward'
  amount_over numeric(20,8),
  amount_chips integer,
  game_type text,
  block_number bigint,
  gas_used bigint,
  gas_price bigint,
  status text DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone
);

-- Enable RLS for blockchain transactions
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.blockchain_transactions
FOR SELECT
USING (wallet_address IN (
  SELECT verified_wallet_address FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.blockchain_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE admin_wallet_address IN (
      SELECT verified_wallet_address FROM public.profiles 
      WHERE user_id = auth.uid()
    ) AND is_active = true
  )
);
