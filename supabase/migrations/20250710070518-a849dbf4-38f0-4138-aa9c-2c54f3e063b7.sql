
-- Create game sessions table for tracking active games and preventing manipulation
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  chip_consumed BOOLEAN NOT NULL DEFAULT false,
  lives_remaining INTEGER NOT NULL DEFAULT 2,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for game sessions
CREATE POLICY "Users can view their own game sessions" 
ON public.game_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions" 
ON public.game_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions" 
ON public.game_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create updated trigger for game sessions
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle chip consumption and life management
CREATE OR REPLACE FUNCTION public.start_game_session(
  p_game_type TEXT,
  p_session_token TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_chips INTEGER;
  active_session_id UUID;
  result JSON;
BEGIN
  -- Get current user's chip balance
  SELECT game_chips INTO current_chips
  FROM public.player_balances pb
  JOIN public.profiles p ON p.verified_wallet_address = pb.wallet_address
  WHERE p.user_id = auth.uid();
  
  -- If no balance record, create one with default chips
  IF current_chips IS NULL THEN
    INSERT INTO public.player_balances (wallet_address, game_chips)
    SELECT verified_wallet_address, 5
    FROM public.profiles
    WHERE user_id = auth.uid()
    ON CONFLICT (wallet_address) DO UPDATE SET game_chips = 5;
    current_chips := 5;
  END IF;
  
  -- Check for existing active session
  SELECT id INTO active_session_id
  FROM public.game_sessions
  WHERE user_id = auth.uid() 
    AND session_end IS NULL 
    AND lives_remaining > 0
    AND game_type = p_game_type
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If active session exists, resume it
  IF active_session_id IS NOT NULL THEN
    UPDATE public.game_sessions
    SET last_activity = now(),
        is_paused = false,
        session_token = p_session_token
    WHERE id = active_session_id;
    
    SELECT json_build_object(
      'session_id', active_session_id,
      'lives_remaining', lives_remaining,
      'chip_consumed', chip_consumed,
      'resumed', true
    ) INTO result
    FROM public.game_sessions
    WHERE id = active_session_id;
    
    RETURN result;
  END IF;
  
  -- Check if user has chips available
  IF current_chips <= 0 THEN
    RETURN json_build_object('error', 'Insufficient chips');
  END IF;
  
  -- Consume chip and create new session
  UPDATE public.player_balances
  SET game_chips = game_chips - 1,
      last_updated = now()
  FROM public.profiles
  WHERE public.player_balances.wallet_address = public.profiles.verified_wallet_address
    AND public.profiles.user_id = auth.uid();
  
  -- Create new game session
  INSERT INTO public.game_sessions (
    user_id, game_type, chip_consumed, lives_remaining, session_token
  ) VALUES (
    auth.uid(), p_game_type, true, 2, p_session_token
  ) RETURNING id INTO active_session_id;
  
  SELECT json_build_object(
    'session_id', active_session_id,
    'lives_remaining', 2,
    'chip_consumed', true,
    'resumed', false
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to lose a life
CREATE OR REPLACE FUNCTION public.lose_life(
  p_session_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_lives INTEGER;
  result JSON;
BEGIN
  -- Update session and get current lives
  UPDATE public.game_sessions
  SET lives_remaining = lives_remaining - 1,
      last_activity = now()
  WHERE id = p_session_id 
    AND user_id = auth.uid()
    AND session_end IS NULL
  RETURNING lives_remaining INTO current_lives;
  
  -- If no lives remaining, end session
  IF current_lives <= 0 THEN
    UPDATE public.game_sessions
    SET session_end = now()
    WHERE id = p_session_id;
    
    RETURN json_build_object(
      'lives_remaining', 0,
      'game_over', true
    );
  END IF;
  
  RETURN json_build_object(
    'lives_remaining', current_lives,
    'game_over', false
  );
END;
$$;

-- Function to end game session
CREATE OR REPLACE FUNCTION public.end_game_session(
  p_session_id UUID,
  p_final_score INTEGER DEFAULT 0
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.game_sessions
  SET session_end = now(),
      score = p_final_score,
      last_activity = now()
  WHERE id = p_session_id 
    AND user_id = auth.uid()
    AND session_end IS NULL;
  
  RETURN FOUND;
END;
$$;
