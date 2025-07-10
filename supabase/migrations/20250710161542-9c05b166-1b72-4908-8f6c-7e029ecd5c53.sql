-- Reset all player chips to 3 (standard starting amount)
UPDATE public.player_balances 
SET game_chips = 3, 
    last_updated = now()
WHERE game_chips IS NOT NULL;