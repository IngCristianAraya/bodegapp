
-- Function to get all tenants (Secure RPC)
CREATE OR REPLACE FUNCTION admin_get_tenants(secret_key text)
RETURNS TABLE (
    id uuid,
    name text,
    subdomain text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple hardcoded check for MVP - Change this value in production!
    IF secret_key != 'BODEGAPP_SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized Access';
    END IF;

    RETURN QUERY 
    SELECT t.id, t.name, t.subdomain, t.status, t.created_at 
    FROM tenants t 
    ORDER BY t.created_at DESC;
END;
$$;

-- Function to toggle status (Secure RPC)
CREATE OR REPLACE FUNCTION admin_update_tenant_status(target_tenant_id uuid, secret_key text, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
     IF secret_key != 'BODEGAPP_SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized Access';
    END IF;

    UPDATE tenants SET status = new_status WHERE id = target_tenant_id;
END;
$$;
