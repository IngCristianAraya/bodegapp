-- Add status and subscription_plan columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'trial';

-- Add check constraint for status to ensure validity
DO $$ BEGIN
    ALTER TABLE tenants ADD CONSTRAINT tenants_status_check CHECK (status IN ('active', 'suspended', 'cancelled'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy Update: Ensure Super Admin (or explicit ID) can update tenants
-- For this MVP, we assume RLS allows users to update their own tenant, 
-- but a Super Admin logic usually requires bypassing RLS or a special 'admin' role.
-- We will rely on SERVICE_ROL_KEY or specific user ID checks in the frontend for now, 
-- as full RBAC is out of scope for this quick fix.
