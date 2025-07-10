-- PRIORITET 1: Fix Admin Chip Addition
-- Create player_balances record for admin wallet if it doesn't exist
INSERT INTO public.player_balances (wallet_address, game_chips, over_balance, total_earnings)
SELECT '0x8d26e367b289ad639e63a5be905f9bc803a54f37f', 3, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.player_balances 
  WHERE wallet_address = '0x8d26e367b289ad639e63a5be905f9bc803a54f37f'
);

-- Create game_scores table for PRIORITET 3: Score Tracking System
-- Add real-time scoring support
ALTER TABLE public.game_scores 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.game_sessions(id),
ADD COLUMN IF NOT EXISTS real_time_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS combo_multiplier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

-- Enable real-time updates for game_scores
ALTER TABLE public.game_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;

-- Enable real-time updates for player_balances  
ALTER TABLE public.player_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_balances;

-- Create performance monitoring table for PRIORITET 4
CREATE TABLE IF NOT EXISTS public.game_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  game_type TEXT NOT NULL,
  session_id UUID REFERENCES public.game_sessions(id),
  fps_average NUMERIC,
  render_time_ms NUMERIC,
  memory_usage_mb NUMERIC,
  webgl_version TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for performance monitoring
ALTER TABLE public.game_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for performance monitoring
CREATE POLICY "Users can insert their own performance data" 
ON public.game_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance data" 
ON public.game_performance 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update start_game_session function to support real-time scoring
CREATE OR REPLACE FUNCTION public.update_realtime_score(
  p_session_id UUID,
  p_score INTEGER,
  p_combo_multiplier INTEGER DEFAULT 1,
  p_bonus_points INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the session score
  UPDATE public.game_sessions
  SET score = p_score,
      last_activity = now()
  WHERE id = p_session_id 
    AND user_id = auth.uid()
    AND session_end IS NULL;
  
  -- Insert or update game_scores for real-time tracking
  INSERT INTO public.game_scores (
    user_id, game_type, session_id, score, real_time_score, 
    combo_multiplier, bonus_points
  )
  SELECT 
    auth.uid(), gs.game_type, p_session_id, p_score, p_score,
    p_combo_multiplier, p_bonus_points
  FROM public.game_sessions gs
  WHERE gs.id = p_session_id
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    score = p_score,
    real_time_score = p_score,
    combo_multiplier = p_combo_multiplier,
    bonus_points = p_bonus_points;
  
  RETURN json_build_object(
    'success', true,
    'score', p_score,
    'combo_multiplier', p_combo_multiplier,
    'bonus_points', p_bonus_points
  );
END;
$$;