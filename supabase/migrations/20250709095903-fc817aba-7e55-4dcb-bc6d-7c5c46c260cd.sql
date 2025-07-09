-- Create wallet verification table
CREATE TABLE public.wallet_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address text NOT NULL,
    signature text NOT NULL,
    message text NOT NULL,
    verified_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(wallet_address)
);

-- Enable RLS
ALTER TABLE public.wallet_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallet verifications"
ON public.wallet_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet verifications"
ON public.wallet_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update profiles table to include verified wallet
ALTER TABLE public.profiles 
ADD COLUMN verified_wallet_address text,
ADD COLUMN wallet_verified_at timestamp with time zone;

-- Create function to verify wallet ownership
CREATE OR REPLACE FUNCTION public.verify_wallet_signature(
    p_wallet_address text,
    p_message text,
    p_signature text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In production, this would verify the signature cryptographically
    -- For now, we'll implement basic validation
    IF length(p_wallet_address) = 42 AND 
       starts_with(p_wallet_address, '0x') AND
       length(p_signature) >= 130 THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$;