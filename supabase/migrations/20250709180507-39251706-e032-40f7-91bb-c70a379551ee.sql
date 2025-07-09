-- Normalize all wallet addresses to lowercase
UPDATE public.admin_config 
SET admin_wallet_address = LOWER(admin_wallet_address)
WHERE admin_wallet_address IS NOT NULL;

UPDATE public.profiles 
SET verified_wallet_address = LOWER(verified_wallet_address)
WHERE verified_wallet_address IS NOT NULL;

UPDATE public.wallet_verifications 
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL;

UPDATE public.blockchain_transactions 
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL;

UPDATE public.player_balances 
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL;