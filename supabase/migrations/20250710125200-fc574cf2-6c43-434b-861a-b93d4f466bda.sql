-- Sync existing data between profiles and player_balances tables
-- This ensures consistency between the two tables that track different aspects of user balances

-- First, create player_balances records for users who don't have them
INSERT INTO public.player_balances (wallet_address, game_chips, over_balance, total_earnings)
SELECT 
  p.verified_wallet_address,
  COALESCE(p.total_chips, 3) as game_chips,
  COALESCE(p.over_balance, 0) as over_balance,
  0 as total_earnings
FROM public.profiles p
WHERE p.verified_wallet_address IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.player_balances pb 
    WHERE pb.wallet_address = p.verified_wallet_address
  );

-- Update existing player_balances to match profiles where they differ
UPDATE public.player_balances 
SET 
  game_chips = COALESCE(p.total_chips, 3),
  over_balance = COALESCE(p.over_balance, 0),
  last_updated = now()
FROM public.profiles p
WHERE public.player_balances.wallet_address = p.verified_wallet_address
  AND (
    public.player_balances.game_chips != COALESCE(p.total_chips, 3) 
    OR public.player_balances.over_balance != COALESCE(p.over_balance, 0)
  );

-- Update profiles to match player_balances where profiles have null values
UPDATE public.profiles 
SET 
  total_chips = COALESCE(pb.game_chips, 3),
  over_balance = COALESCE(pb.over_balance, 0),
  updated_at = now()
FROM public.player_balances pb
WHERE public.profiles.verified_wallet_address = pb.wallet_address
  AND (
    public.profiles.total_chips IS NULL 
    OR public.profiles.over_balance IS NULL
  );