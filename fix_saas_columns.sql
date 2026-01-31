-- Agregar columnas necesarias para el control de suscripciones
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Opcional: Establecer fechas por defecto para tenants existentes (ej: +30 dias desde hoy)
UPDATE public.tenants 
SET subscription_end_date = NOW() + INTERVAL '30 days' 
WHERE subscription_end_date IS NULL;
