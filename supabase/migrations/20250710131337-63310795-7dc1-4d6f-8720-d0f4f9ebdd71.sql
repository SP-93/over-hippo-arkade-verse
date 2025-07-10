-- Reset all chip balances to 3 and clean up old system
BEGIN;

-- Reset all existing player balances to 3 chips
UPDATE public.player_balances 
SET game_chips = 3, 
    last_updated = now()
WHERE game_chips IS NOT NULL;

-- Insert default balance for any user without a player_balance record
INSERT INTO public.player_balances (wallet_address, game_chips, over_balance, total_earnings, last_updated)
SELECT 
    p.verified_wallet_address,
    3,
    0,
    0,
    now()
FROM public.profiles p
WHERE p.verified_wallet_address IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.player_balances pb 
    WHERE pb.wallet_address = p.verified_wallet_address
  );

-- Remove the deprecated total_chips column from profiles (it's no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_chips;

-- Add constraint to ensure game_chips can't be negative
ALTER TABLE public.player_balances 
ADD CONSTRAINT check_game_chips_non_negative 
CHECK (game_chips >= 0);

-- Update the default value for game_chips to 3 (was 5 before)
ALTER TABLE public.player_balances 
ALTER COLUMN game_chips SET DEFAULT 3;

COMMIT;