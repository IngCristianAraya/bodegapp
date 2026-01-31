-- Script de Actualización: Funcionalidades de Negocio (Créditos y Gastos)
-- Ejecutar en Supabase SQL Editor

-- ==========================================
-- 1. SISTEMA DE CRÉDITOS ("FIADO")
-- ==========================================

-- 1.1 Modificar tabla clientes
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS current_debt decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_limit decimal(10,2); -- NULL = Sin límite

-- 1.2 Crear tabla de Pagos de Deuda
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    customer_id uuid REFERENCES public.customers(id) NOT NULL,
    amount decimal(10,2) NOT NULL, -- Monto pagado
    date timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) -- Quién registró el pago
);

-- 1.3 RLS para debt_payments
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view debt payments for their tenant"
ON public.debt_payments FOR SELECT
USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Users can insert debt payments for their tenant"
ON public.debt_payments FOR INSERT
WITH CHECK (tenant_id = public.current_tenant_id());

-- ==========================================
-- 2. GESTIÓN DE GASTOS
-- ==========================================

-- 2.1 Crear tabla de Gastos
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    description text NOT NULL,
    amount decimal(10,2) NOT NULL,
    category text, -- 'Alquiler', 'Servicios', 'Personal', 'Insumos', 'Otros'
    date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

-- 2.2 RLS para expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for their tenant"
ON public.expenses FOR SELECT
USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Users can insert expenses for their tenant"
ON public.expenses FOR INSERT
WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Users can delete expenses for their tenant"
ON public.expenses FOR DELETE
USING (tenant_id = public.current_tenant_id());

-- ==========================================
-- 3. CALIDAD DE INVENTARIO
-- ==========================================

-- 3.1 Agregar fecha de vencimiento a productos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS expiration_date date;

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON public.debt_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date);
