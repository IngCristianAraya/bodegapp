-- Agregar columna is_active a la tabla de productos para soporte de Soft Delete
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Actualizar productos existentes para que estén activos por defecto
UPDATE public.products 
SET is_active = true 
WHERE is_active IS NULL;

-- Indexar la columna para búsquedas rápidas (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
