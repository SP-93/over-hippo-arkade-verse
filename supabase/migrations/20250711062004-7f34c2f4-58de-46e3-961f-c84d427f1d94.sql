-- Fix atomic_balance_operation function to work with edge functions
-- The issue is that auth.uid() doesn't work with service role key authentication in edge functions

CREATE OR REPLACE FUNCTION public.atomic_balance_operation(
  p_operation_type text, 
  p_amount integer, 
  p_over_amount numeric DEFAULT NULL::numeric, 
  p_game_type text DEFAULT NULL::text, 
  p_transaction_ref text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid
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
  target_user_id uuid;
BEGIN
  -- Use provided user_id or fallback to auth.uid()
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user ID provided and no auth context';
  END IF;

  -- Get user's wallet
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = target_user_id;
  
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
      lock_key, target_user_id, p_operation_type, 
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
      target_user_id,
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