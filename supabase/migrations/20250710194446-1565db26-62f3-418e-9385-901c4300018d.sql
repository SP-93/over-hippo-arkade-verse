-- Enable realtime for player_balances table
ALTER TABLE public.player_balances REPLICA IDENTITY FULL;

-- Add table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_balances;