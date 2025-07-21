-- Remove OVER token operations from atomic_balance_operation function
CREATE OR REPLACE FUNCTION public.atomic_balance_operation(
  p_operation_type text, 
  p_amount integer, 
  p_wover_amount numeric DEFAULT NULL::numeric, 
  p_game_type text DEFAULT NULL::text, 
  p_transaction_ref text DEFAULT NULL::text, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_wallet text;
  lock_key text;
  lock_id uuid;
  current_chips integer;
  current_wover numeric;
  new_chips integer;
  new_wover numeric;
  operation_result jsonb;
  target_user_id uuid;
BEGIN
  -- Use provided user_id or fallback to auth.uid()
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'error_code', 'AUTH_REQUIRED'
    );
  END IF;

  -- Get user's wallet with error handling
  SELECT verified_wallet_address INTO user_wallet
  FROM public.profiles
  WHERE user_id = target_user_id;
  
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
      lock_key, target_user_id, p_operation_type, 
      jsonb_build_object('amount', p_amount, 'wover_amount', p_wover_amount),
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
    SELECT game_chips, COALESCE(wover_balance, 0) INTO current_chips, current_wover
    FROM public.player_balances
    WHERE wallet_address = user_wallet
    FOR UPDATE;
    
    -- If no balance record exists, create one with defaults
    IF NOT FOUND THEN
      INSERT INTO public.player_balances (
        wallet_address, game_chips, wover_balance, total_earnings
      ) VALUES (
        user_wallet, 3, 0, 0
      );
      current_chips := 3;
      current_wover := 0;
    END IF;
    
    -- Initialize new values with current values
    new_chips := current_chips;
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
        
      WHEN 'spend_wover' THEN
        IF p_wover_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'WOVER amount required',
            'error_code', 'WOVER_AMOUNT_REQUIRED'
          );
        END IF;
        IF current_wover < p_wover_amount THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient WOVER',
            'error_code', 'INSUFFICIENT_WOVER',
            'current_wover', current_wover,
            'required_wover', p_wover_amount
          );
        END IF;
        new_wover := current_wover - p_wover_amount;
        
      WHEN 'add_wover' THEN
        IF p_wover_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'WOVER amount required',
            'error_code', 'WOVER_AMOUNT_REQUIRED'
          );
        END IF;
        new_wover := current_wover + p_wover_amount;

      WHEN 'buy_chips_with_wover' THEN
        IF p_wover_amount IS NULL THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'WOVER amount required for chip purchase',
            'error_code', 'WOVER_AMOUNT_REQUIRED'
          );
        END IF;
        IF current_wover < p_wover_amount THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient WOVER for chip purchase',
            'error_code', 'INSUFFICIENT_WOVER',
            'current_wover', current_wover,
            'required_wover', p_wover_amount
          );
        END IF;
        new_wover := current_wover - p_wover_amount;
        new_chips := current_chips + p_amount;
        
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
      wover_balance = new_wover,
      last_updated = now()
    WHERE wallet_address = user_wallet;
    
    -- Log the operation in appropriate transaction table
    IF p_operation_type LIKE '%wover%' THEN
      INSERT INTO public.wover_transactions (
        user_id, wover_amount, transaction_type, feature_type, transaction_hash
      ) VALUES (
        target_user_id, p_wover_amount, p_operation_type, 'balance_operation',
        COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text)
      );
    ELSE
      INSERT INTO public.chip_transactions (
        user_id,
        chip_amount,
        transaction_type,
        game_type,
        transaction_hash,
        status
      ) VALUES (
        target_user_id,
        p_amount,
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

-- Update get_secure_wallet_balance function to remove OVER balance
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
      wallet_address, game_chips, wover_balance, total_earnings
    ) VALUES (
      user_wallet, 3, 0, 0
    ) RETURNING * INTO balance_record;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'has_wallet', true,
    'wallet_address', user_wallet,
    'game_chips', COALESCE(balance_record.game_chips, 3),
    'wover_balance', COALESCE(balance_record.wover_balance, 0),
    'total_earnings', COALESCE(balance_record.total_earnings, 0),
    'last_updated', balance_record.last_updated
  );
END;
$function$;

-- Create WOVER chip purchase function
CREATE OR REPLACE FUNCTION public.buy_chips_with_wover(
  p_chip_amount integer, 
  p_wover_cost numeric,
  p_is_vip boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_wallet text;
  vip_discount numeric := 0.8; -- VIP users pay 80% of regular price
  final_cost numeric;
BEGIN
  -- Calculate final cost with VIP discount
  final_cost := CASE 
    WHEN p_is_vip THEN p_wover_cost * vip_discount
    ELSE p_wover_cost
  END;
  
  -- Use the updated atomic balance operation
  RETURN public.atomic_balance_operation(
    'buy_chips_with_wover',
    p_chip_amount,
    final_cost,
    'chip_purchase',
    'wover_purchase_' || extract(epoch from now())::text
  );
END;
$function$;