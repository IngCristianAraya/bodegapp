-- Agregar columnas de suscripción a la tabla tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMP WITH TIME ZONE;

-- Comentario para documentar los valores posibles
COMMENT ON COLUMN tenants.plan_type IS 'Tipo de plan: FREE, PRO';
COMMENT ON COLUMN tenants.subscription_status IS 'Estado: ACTIVE, PAST_DUE, CANCELED';

-- Actualizar tenants existentes a FREE (ya lo hace el default, pero por seguridad)
UPDATE tenants SET plan_type = 'FREE', subscription_status = 'ACTIVE' WHERE plan_type IS NULL;
