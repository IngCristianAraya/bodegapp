-- 1. Tabla de Anuncios del Sistema
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'maintenance'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Permitir que todos lean anuncios (público o autenticado)
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active announcements" ON public.system_announcements
    FOR SELECT USING (is_active = true);

-- 2. Función para obtener métricas de todos los tenants (SECURITY DEFINER para saltar RLS)
CREATE OR REPLACE FUNCTION admin_get_analytics(p_admin_secret TEXT)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    product_count BIGINT,
    monthly_sales_count BIGINT,
    monthly_sales_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar admin
    IF p_admin_secret != current_setting('app.settings.super_admin_secret_key', true) AND p_admin_secret != 'BODEGAPP_SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        (SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id),
        (SELECT COUNT(*) FROM sales s WHERE s.tenant_id = t.id AND s.created_at >= date_trunc('month', now())),
        (SELECT COALESCE(SUM(s.total), 0) FROM sales s WHERE s.tenant_id = t.id AND s.created_at >= date_trunc('month', now()))
    FROM tenants t;
END;
$$;

-- 3. Función para enviar anuncio (Crear)
CREATE OR REPLACE FUNCTION admin_create_announcement(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_days_active INTEGER,
    p_admin_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_admin_secret != current_setting('app.settings.super_admin_secret_key', true) AND p_admin_secret != 'BODEGAPP_SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO system_announcements (title, message, type, expires_at)
    VALUES (p_title, p_message, p_type, NOW() + (p_days_active || ' days')::INTERVAL);

    RETURN jsonb_build_object('success', true);
END;
$$;
