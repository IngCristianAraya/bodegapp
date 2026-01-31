-- Add Payment Configuration columns to store_settings table

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS yape_qr_url TEXT,
ADD COLUMN IF NOT EXISTS plin_qr_url TEXT,
ADD COLUMN IF NOT EXISTS yape_number TEXT,
ADD COLUMN IF NOT EXISTS plin_number TEXT;

-- Create policy to allow public access to QRs for POS needs if not already open
-- (Assuming existing RLS policies cover store_settings based on tenant_id)
