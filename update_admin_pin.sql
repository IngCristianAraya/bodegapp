-- Add admin_pin to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS admin_pin text;

-- Comment on column
COMMENT ON COLUMN public.store_settings.admin_pin IS 'PIN de 4 dígitos para autorización administrativa (Cierres, Cambios, etc)';

-- Update RLS if necessary (usually store_settings is widely accessible, but good to check)
-- (Existing policies likely cover update if user is tenant owner)
