-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- Limpiar tablas existentes para una migración limpia (CUIDADO: Borra datos de prueba)
drop table if exists public.inventory_movements cascade;
drop table if exists public.sale_items cascade;
drop table if exists public.sales cascade;
drop table if exists public.products cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.customers cascade;
drop table if exists public.store_settings cascade;
drop table if exists public.tenants cascade;

-- 0. Tabla de Tenants (Bodegas/Clientes del SaaS)
create table public.tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subdomain text unique not null, -- ej: 'bodegamanolito'
  owner_id text, -- ID del dueño en Auth (Supabase UID)
  plan_type text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Tabla de Productos (Inventario)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  code text, 
  category text,
  subcategory text,
  unit text default 'unidad',
  stock numeric default 0,
  min_stock numeric default 5,
  sale_price numeric default 0,
  average_cost numeric default 0,
  cost_price numeric default 0,
  supplier text,
  image_url text,
  barcode text,
  is_exempt_igv boolean default false,
  is_exonerated boolean default false,
  igv_included boolean default true,
  unit_type text default 'unidad',
  venta_por_peso boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, code) -- El código es único por tienda, no global
);

-- 2. Tabla de Proveedores
create table public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  contact text,
  phone text,
  email text,
  address text,
  products text[], 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Clientes
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  phone text,
  address text,
  email text,
  total_purchases numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Ventas
create table public.sales (
  id text primary key, 
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  receipt_number text, 
  cashier_id text,
  cashier_name text,
  customer_id uuid references public.customers(id),
  customer_name text,
  total numeric not null,
  subtotal numeric,
  discount numeric,
  tax numeric, 
  payment_method text,
  items jsonb, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, receipt_number) -- Número de boleta único por tienda
);

-- 5. Detalle de Venta (Items)
create table public.sale_items (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  sale_id text references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null
);

-- 6. Movimientos de Inventario (Kardex)
create table public.inventory_movements (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  product_id uuid references public.products(id),
  product_name text,
  type text check (type in ('ingreso', 'egreso', 'ajuste', 'salida')), 
  quantity numeric not null,
  cost_price numeric,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  motivo text,
  cashier_name text,
  initial_stock numeric,
  final_stock numeric
);

-- 7. Configuración de Tienda
create table public.store_settings (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id text, -- ID del usuario administrador local
  business_name text,
  ruc text,
  address text,
  phone text,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(tenant_id) -- Solo una configuración por tenant
);

-- RLS (Row Level Security)
alter table tenants enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table inventory_movements enable row level security;
alter table store_settings enable row level security;

-- Políticas de aislamiento
-- En producción usaremos auth.jwt() -> 'tenant_id'
-- Para pruebas rápidas podemos usar una variable de sesión o similar
create policy "Isolation by tenant_id" on products for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on suppliers for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on customers for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on sales for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on sale_items for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on inventory_movements for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));
create policy "Isolation by tenant_id" on store_settings for all using (tenant_id = ((current_setting('app.current_tenant'::text, true))::uuid));

