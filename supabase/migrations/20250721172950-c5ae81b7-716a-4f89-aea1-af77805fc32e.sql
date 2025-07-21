-- Drop and recreate the atomic_balance_operation function to remove OVER token support
DROP FUNCTION IF EXISTS public.atomic_balance_operation(text, integer, numeric, text, text, uuid);

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
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'error_code', 'AUTH_REQUIRED'
    );
  END IF;

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
  
  lock_key := user_wallet || '_' || p_operation_type;
  
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
  
  BEGIN
    SELECT game_chips, COALESCE(wover_balance, 0) INTO current_chips, current_wover
    FROM public.player_balances
    WHERE wallet_address = user_wallet
    FOR UPDATE;
    
    IF NOT FOUND THEN
      INSERT INTO public.player_balances (
        wallet_address, game_chips, wover_balance, total_earnings
      ) VALUES (
        user_wallet, 3, 0, 0
      );
      current_chips := 3;
      current_wover := 0;
    END IF;
    
    new_chips := current_chips;
    new_wover := current_wover;
    
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
    
    UPDATE public.player_balances
    SET 
      game_chips = new_chips,
      wover_balance = new_wover,
      last_updated = now()
    WHERE wallet_address = user_wallet;
    
    IF p_operation_type LIKE '%wover%' THEN
      INSERT INTO public.wover_transactions (
        user_id, wover_amount, transaction_type, feature_type, transaction_hash
      ) VALUES (
        target_user_id, p_wover_amount, p_operation_type, 'balance_operation',
        COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text)
      );
    ELSE
      INSERT INTO public.chip_transactions (
        user_id, chip_amount, transaction_type, game_type, transaction_hash, status
      ) VALUES (
        target_user_id, p_amount, p_operation_type, p_game_type,
        COALESCE(p_transaction_ref, 'atomic_' || extract(epoch from now())::text), 'completed'
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
    DELETE FROM public.operation_locks WHERE id = lock_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', 'TRANSACTION_ERROR'
    );
  END;
  
  DELETE FROM public.operation_locks WHERE id = lock_id;
  RETURN operation_result;
END;
$function$;