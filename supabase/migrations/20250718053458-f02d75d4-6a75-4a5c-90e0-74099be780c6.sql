-- Update atomic_balance_operation to support WOVER operations
CREATE OR REPLACE FUNCTION public.atomic_balance_operation(p_operation_type text, p_amount integer, p_over_amount numeric DEFAULT NULL::numeric, p_game_type text DEFAULT NULL::text, p_transaction_ref text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_wallet text;
  lock_key text;
  lock_id uuid;
  current_chips integer;
  current_over numeric;
  current_wover numeric;
  new_chips integer;
  new_over numeric;
  new_wover numeric;
  operation_result jsonb;
  current_user_id uuid;
BEGIN
  -- Get current user ID with better error handling
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'error_code', 'AUTH_REQUIRED'
    );
  END IF;

  -- Get user's wallet with error handling
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = current_user_id;
  
  IF user_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No verified wallet found',
      'error_code', 'NO_WALLET'
    );
  END IF;
  
  -- Create operation lock to prevent race conditions
  lock_key := user_wallet || '_' || p_operation_type;
  
  -- Try to acquire lock with timeout
  BEGIN
    INSERT INTO public.operation_locks (
      lock_key, locked_by, operation_type, metadata, expires_at
    ) VALUES (
      lock_key, current_user_id, p_operation_type, 
      jsonb_build_object('amount', p_amount, 'over_amount', p_over_amount),
      now() + interval '10 seconds'
    ) RETURNING id INTO lock_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Operation already in progress',
      'error_code', 'OPERATION_LOCKED'
    );
  END;
  
  -- Perform atomic balance operation within transaction
  BEGIN
    -- Get current balances with row lock
    SELECT game_chips, over_balance, COALESCE(wover_balance, 0) INTO current_chips, current_over, current_wover
    FROM public.player_balances
    WHERE wallet_address = user_wallet
    FOR UPDATE;
    
    -- If no balance record exists, create one with defaults
    IF NOT FOUND THEN
      INSERT INTO public.player_balances (
        wallet_address, game_chips, over_balance, wover_balance, total_earnings
      ) VALUES (
        user_wallet, 3, 0, 0, 0
      );
      current_chips := 3;
      current_over := 0;
      current_wover := 0;
    END IF;
    
    -- Initialize new values with current values
    new_chips := current_chips;
    new_over := current_over;
    new_wover := current_wover;
    
    -- Validate and calculate new balances based on operation type
    CASE p_operation_type
      WHEN 'spend_chip' THEN
        IF current_chips < p_amount THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient chips',
            'error_code', 'INSUFFICIENT_CHIPS',
            'current_chips', current_chips,
            'required_chips', p_amount
          );
        END IF;
        new_chips := current_chips - p_amount;
        
      WHEN 'add_chips' THEN
        new_chips := current_chips + p_amount;
        
      WHEN 'spend_over' THEN
        IF p_over_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Over amount required',
            'error_code', 'OVER_AMOUNT_REQUIRED'
          );
        END IF;
        IF current_over < p_over_amount THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient OVER',
            'error_code', 'INSUFFICIENT_OVER',
            'current_over', current_over,
            'required_over', p_over_amount
          );
        END IF;
        new_over := current_over - p_over_amount;
        
      WHEN 'add_over' THEN
        IF p_over_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Over amount required',
            'error_code', 'OVER_AMOUNT_REQUIRED'
          );
        END IF;
        new_over := current_over + p_over_amount;
        
      WHEN 'spend_wover' THEN
        IF p_over_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'WOVER amount required',
            'error_code', 'WOVER_AMOUNT_REQUIRED'
          );
        END IF;
        IF current_wover < p_over_amount THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient WOVER',
            'error_code', 'INSUFFICIENT_WOVER',
            'current_wover', current_wover,
            'required_wover', p_over_amount
          );
        END IF;
        new_wover := current_wover - p_over_amount;
        
      WHEN 'add_wover' THEN
        IF p_over_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'WOVER amount required',
            'error_code', 'WOVER_AMOUNT_REQUIRED'
          );
        END IF;
        new_wover := current_wover + p_over_amount;
        
      ELSE
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Invalid operation type',
          'error_code', 'INVALID_OPERATION'
        );
    END CASE;
    
    -- Update balances atomically
    UPDATE public.player_balances
    SET 
      game_chips = new_chips,
      over_balance = new_over,
      wover_balance = new_wover,
      last_updated = now()
    WHERE wallet_address = user_wallet;
    
    -- Log the operation in appropriate transaction table
    IF p_operation_type LIKE '%wover%' THEN
      INSERT INTO public.wover_transactions (
        user_id, wover_amount, transaction_type, feature_type, transaction_hash
      ) VALUES (
        current_user_id, p_over_amount, p_operation_type, 'balance_operation',
        COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text)
      );
    ELSE
      INSERT INTO public.chip_transactions (
        user_id,
        chip_amount,
        over_amount,
        transaction_type,
        game_type,
        transaction_hash,
        status
      ) VALUES (
        current_user_id,
        CASE WHEN p_operation_type LIKE '%chip%' THEN p_amount ELSE NULL END,
        CASE WHEN p_operation_type LIKE '%over%' AND NOT p_operation_type LIKE '%wover%' THEN p_over_amount ELSE NULL END,
        p_operation_type,
        p_game_type,
        COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text),
        'completed'
      );
    END IF;
    
    operation_result := jsonb_build_object(
      'success', true,
      'previous_chips', current_chips,
      'new_chips', new_chips,
      'previous_over', current_over,
      'new_over', new_over,
      'previous_wover', current_wover,
      'new_wover', new_wover,
      'operation_type', p_operation_type,
      'wallet_address', user_wallet
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Clean up lock on error
    DELETE FROM public.operation_locks WHERE id = lock_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', 'TRANSACTION_ERROR'
    );
  END;
  
  -- Clean up lock on success
  DELETE FROM public.operation_locks WHERE id = lock_id;
  
  RETURN operation_result;
END;
$function$;