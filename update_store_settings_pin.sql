-- Add admin_pin column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS admin_pin text;

-- Comment on column
COMMENT ON COLUMN public.store_settings.admin_pin IS 'PIN de seguridad para autorizar cierres de caja y operaciones sensibles';
