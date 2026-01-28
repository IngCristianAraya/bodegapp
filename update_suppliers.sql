-- Actualización de Tabla Proveedores
-- Ejecuta este script el SQL Editor de Supabase

-- 1. Agregar nuevas columnas
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS ruc text,
ADD COLUMN IF NOT EXISTS delivery_days text[], -- Array de días: ['Lunes', 'Jueves']
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0, -- Calificación 1-5
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS category text; -- Ej: 'Lácteos', 'Bebidas'

-- 2. Crear índice para búsquedas rápidas (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers(tenant_id);

-- 3. Comentario de confirmación
COMMENT ON TABLE public.suppliers IS 'Tabla de proveedores con información extendida (RUC, Rating, Logística)';
