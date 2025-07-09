-- Revert admin wallet address to original admin wallet
UPDATE public.admin_config 
SET admin_wallet_address = '0x88d26e867b289AD2e63A0BE905f9BC803A64F37f'
WHERE admin_wallet_address = '0x4dea071d64f77f2f94ac1eb80d1b7b2681993477';