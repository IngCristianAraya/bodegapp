-- Tabla para registrar el historial de pagos de las bodegas al Super Admin
CREATE TABLE IF NOT EXISTS public.tenant_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'PEN',
    days_added INTEGER NOT NULL,
    payment_method TEXT, -- 'Yape', 'Plin', 'Transferencia'
    reference_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Super Admin ID or Email
);

-- Funcion RPC para registrar pago y extender suscripcion atomicamente
CREATE OR REPLACE FUNCTION admin_record_payment(
    p_tenant_id UUID,
    p_amount NUMERIC,
    p_days_to_add INTEGER,
    p_payment_method TEXT,
    p_reference TEXT,
    p_notes TEXT,
    p_admin_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_expiry TIMESTAMPTZ;
    v_new_expiry TIMESTAMPTZ;
    v_tenant_name TEXT;
BEGIN
    -- 1. Validar Clave de Super Admin (Simple security layer)
    IF p_admin_secret != current_setting('app.settings.super_admin_secret_key', true) AND p_admin_secret != 'BODEGAPP_SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Invalid Admin Key';
    END IF;

    -- 2. Obtener datos actuales del tenant
    SELECT subscription_end_date, name INTO v_current_expiry, v_tenant_name
    FROM tenants
    WHERE id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;

    -- 3. Calcular nueva fecha
    -- Si ya venció o es null, se suma desde HOY. Si aun vigetne, se suma desde la fecha futura.
    IF v_current_expiry IS NULL OR v_current_expiry < NOW() THEN
        v_new_expiry := NOW() + (p_days_to_add || ' days')::INTERVAL;
    ELSE
        v_new_expiry := v_current_expiry + (p_days_to_add || ' days')::INTERVAL;
    END IF;

    -- 4. Registrar Pago
    INSERT INTO tenant_payments (tenant_id, amount, days_added, payment_method, reference_code, notes)
    VALUES (p_tenant_id, p_amount, p_days_to_add, p_payment_method, p_reference, p_notes);

    -- 5. Actualizar Tenant
    UPDATE tenants
    SET 
        subscription_end_date = v_new_expiry,
        status = 'active', -- Reactivar automaticamente si paga
        updated_at = NOW()
    WHERE id = p_tenant_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_expiry', v_new_expiry,
        'tenant_name', v_tenant_name
    );
END;
$$;
