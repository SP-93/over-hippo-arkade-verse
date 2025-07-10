-- Add second admin wallet to admin_config table
INSERT INTO public.admin_config (admin_wallet_address, admin_role, permissions, is_active) 
VALUES ('0xDC8f5D80253fE851093e330efF108a589b6e526A', 'super_admin', '{"full_access": true}', true);