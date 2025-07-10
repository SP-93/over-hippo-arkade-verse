-- FAZA 2A: Enhanced RLS Validation & Atomic Operations

-- 1. Create operation locks table to prevent race conditions
CREATE TABLE public.operation_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_key text NOT NULL UNIQUE,
  locked_by uuid NOT NULL, -- user_id
  operation_type text NOT NULL,
  locked_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 seconds'),
  metadata jsonb
);

-- Enable RLS on operation locks
ALTER TABLE public.operation_locks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own locks
CREATE POLICY "Users can view their own locks"
ON public.operation_locks
FOR SELECT
USING (locked_by = auth.uid());

-- System manages locks (will use security definer functions)
CREATE POLICY "System manages locks"
ON public.operation_locks
FOR ALL
USING (false) 
WITH CHECK (false);

-- 2. Enhanced wallet_verifications RLS policies
DROP POLICY IF EXISTS "Allow wallet verification upsert" ON public.wallet_verifications;
DROP POLICY IF EXISTS "Users can view wallet verifications by address" ON public.wallet_verifications;

-- More restrictive wallet verification policies
CREATE POLICY "Users can view their own wallet verifications"
ON public.wallet_verifications
FOR SELECT
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND auth.uid() IS NULL) -- Allow anonymous for verification process
);

CREATE POLICY "Users can insert wallet verifications"
ON public.wallet_verifications
FOR INSERT
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  NOT is_banned AND
  signature IS NOT NULL AND
  message IS NOT NULL
);

CREATE POLICY "Users can update their own wallet verifications"
ON public.wallet_verifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only admins can ban/unban wallets
CREATE POLICY "Only admins can ban wallets"
ON public.wallet_verifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_config ac
    JOIN public.profiles p ON p.verified_wallet_address = ac.admin_wallet_address
    WHERE p.user_id = auth.uid() AND ac.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_config ac
    JOIN public.profiles p ON p.verified_wallet_address = ac.admin_wallet_address
    WHERE p.user_id = auth.uid() AND ac.is_active = true
  )
);

-- 3. Create atomic balance operation function
CREATE OR REPLACE FUNCTION public.atomic_balance_operation(
  p_operation_type text, -- 'spend_chip', 'add_chips', 'add_over', 'spend_over'
  p_amount integer,
  p_over_amount numeric DEFAULT NULL,
  p_game_type text DEFAULT NULL,
  p_transaction_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet text;
  lock_key text;
  lock_id uuid;
  current_chips integer;
  current_over numeric;
  new_chips integer;
  new_over numeric;
  operation_result jsonb;
BEGIN
  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RAISE EXCEPTION 'No verified wallet found';
  END IF;
  
  -- Create operation lock to prevent race conditions
  lock_key := user_wallet || '_' || p_operation_type;
  
  -- Try to acquire lock
  BEGIN
    INSERT INTO public.operation_locks (
      lock_key, locked_by, operation_type, metadata
    ) VALUES (
      lock_key, auth.uid(), p_operation_type, 
      jsonb_build_object('amount', p_amount, 'over_amount', p_over_amount)
    ) RETURNING id INTO lock_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Operation already in progress for this wallet';
  END;
  
  -- Perform atomic balance operation within transaction
  BEGIN
    -- Get current balances with row lock
    SELECT game_chips, over_balance INTO current_chips, current_over
    FROM public.player_balances
    WHERE wallet_address = user_wallet
    FOR UPDATE;
    
    -- If no balance record exists, create one with defaults
    IF NOT FOUND THEN
      INSERT INTO public.player_balances (
        wallet_address, game_chips, over_balance, total_earnings
      ) VALUES (
        user_wallet, 3, 0, 0
      );
      current_chips := 3;
      current_over := 0;
    END IF;
    
    -- Validate and calculate new balances based on operation type
    CASE p_operation_type
      WHEN 'spend_chip' THEN
        IF current_chips < p_amount THEN
          RAISE EXCEPTION 'Insufficient chips: have %, need %', current_chips, p_amount;
        END IF;
        new_chips := current_chips - p_amount;
        new_over := current_over;
        
      WHEN 'add_chips' THEN
        new_chips := current_chips + p_amount;
        new_over := current_over;
        
      WHEN 'spend_over' THEN
        IF p_over_amount IS NULL THEN
          RAISE EXCEPTION 'Over amount required for spend_over operation';
        END IF;
        IF current_over < p_over_amount THEN
          RAISE EXCEPTION 'Insufficient OVER: have %, need %', current_over, p_over_amount;
        END IF;
        new_chips := current_chips;
        new_over := current_over - p_over_amount;
        
      WHEN 'add_over' THEN
        IF p_over_amount IS NULL THEN
          RAISE EXCEPTION 'Over amount required for add_over operation';
        END IF;
        new_chips := current_chips;
        new_over := current_over + p_over_amount;
        
      ELSE
        RAISE EXCEPTION 'Invalid operation type: %', p_operation_type;
    END CASE;
    
    -- Update balances atomically
    UPDATE public.player_balances
    SET 
      game_chips = new_chips,
      over_balance = new_over,
      last_updated = now()
    WHERE wallet_address = user_wallet;
    
    -- Log the operation in chip_transactions
    INSERT INTO public.chip_transactions (
      user_id,
      chip_amount,
      over_amount,
      transaction_type,
      game_type,
      transaction_hash,
      status
    ) VALUES (
      auth.uid(),
      CASE WHEN p_operation_type LIKE '%chip%' THEN p_amount ELSE NULL END,
      p_over_amount,
      p_operation_type,
      p_game_type,
      COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text),
      'completed'
    );
    
    operation_result := jsonb_build_object(
      'success', true,
      'previous_chips', current_chips,
      'new_chips', new_chips,
      'previous_over', current_over,
      'new_over', new_over,
      'operation_type', p_operation_type,
      'wallet_address', user_wallet
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Clean up lock on error
    DELETE FROM public.operation_locks WHERE id = lock_id;
    RAISE;
  END;
  
  -- Clean up lock on success
  DELETE FROM public.operation_locks WHERE id = lock_id;
  
  RETURN operation_result;
END;
$$;

-- 4. Create function to check wallet balance securely
CREATE OR REPLACE FUNCTION public.get_secure_wallet_balance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet text;
  balance_record record;
BEGIN
  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF user_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'No verified wallet found',
      'has_wallet', false
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