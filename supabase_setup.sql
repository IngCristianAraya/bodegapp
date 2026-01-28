-- Habilitar extensión para UUIDs (Requerido para generación automática)
create extension if not exists "uuid-ossp";

-- PRECAUCIÓN: Las siguientes líneas borran toda la data. 
-- Descoméntalas SOLO si deseas resetear la base de datos completa.
-- drop table if exists public.inventory_movements cascade;
-- drop table if exists public.sale_items cascade;
-- drop table if exists public.sales cascade;
-- drop table if exists public.products cascade;
-- drop table if exists public.suppliers cascade;
-- drop table if exists public.customers cascade;
-- drop table if exists public.store_settings cascade;
-- drop table if exists public.tenants cascade;

-- 0. Tabla de Tenants (Bodegas/Clientes del SaaS)
create table if not exists public.tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subdomain text unique not null, -- ej: 'bodegamanolito'
  owner_id text, -- ID del dueño en Auth (Supabase UID)
  plan_type text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Tabla de Productos (Inventario)
create table if not exists public.products (
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
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, code) -- El código es único por tienda, no global
);

-- 2. Tabla de Proveedores
create table if not exists public.suppliers (
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
create table if not exists public.customers (
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
-- Nota: Usamos UUID como PK para evitar colisiones entre tiendas.
-- [ACTUALIZACIÓN CRÍTICA]: Forzamos recreación para aplicar el generador UUID
drop table if exists public.sale_items cascade;
drop table if exists public.sales cascade;

create table public.sales (
  id uuid default extensions.uuid_generate_v4() primary key, 
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
  id uuid default extensions.uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null
);

-- 6. Movimientos de Inventario (Kardex)
create table if not exists public.inventory_movements (
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
-- [RESETEO SEGURO]: Borramos y recreamos para asegurar los nuevos campos (logo, ticket)
drop table if exists public.store_settings cascade;

create table public.store_settings (
  id uuid default extensions.uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id text, -- ID del usuario administrador local
  business_name text,
  ruc text,
  address text,
  phone text,
  email text,
  logo_url text,           -- [NUEVO] Para branding
  ticket_footer text,     -- [NUEVO] Mensaje al final del ticket
  admin_password text,    -- [NUEVO] Clave para acciones críticas (Ajuste stock, precios, etc)
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(tenant_id) -- Solo una configuración por tenant
);

-- 8. Seguridad Avanzada: Funciones de Ayudante para Multi-tenancy
create or replace function public.current_tenant_id()
returns uuid
language sql stable
as $$
  -- Buscamos el tenant_id en ambos formatos posibles por seguridad
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::json->'app_metadata'->>'tenant_id',
      current_setting('request.jwt.claims', true)::json->'app_meta_data'->>'tenant_id',
      ''
    ), 
    ''
  )::uuid;
$$;

-- Función de Trigger para asegurar que el tenant_id siempre se asigne en INSERTS
create or replace function public.set_tenant_id()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is null then
    new.tenant_id := public.current_tenant_id();
  end if;
  return new;
end;
$$;

-- RLS (Row Level Security) - ACTIVACIÓN
alter table tenants enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table inventory_movements enable row level security;
alter table store_settings enable row level security;

-- 9. POLÍTICAS ESTRICTAS (Hardened Multi-tenant)
-- Nota: Solo el Super Admin (o logic de onboarding) puede insertar en 'tenants' directamente sin tenant_id en JWT

-- Tabla de Inquilinos (Lectura pública para resolución de subdominios)
drop policy if exists "Allow public read for tenants" on tenants;
create policy "Allow public read for tenants" on tenants
for select using (true);

-- Productos (Aislamiento Total)
drop policy if exists "Tenant isolation for products" on products;
create policy "Tenant isolation for products" on products
for all using (tenant_id = current_tenant_id());

-- Proveedores (Aislamiento Total)
drop policy if exists "Tenant isolation for suppliers" on suppliers;
create policy "Tenant isolation for suppliers" on suppliers
for all using (tenant_id = current_tenant_id());

-- Clientes (Aislamiento Total)
drop policy if exists "Tenant isolation for customers" on customers;
create policy "Tenant isolation for customers" on customers
for all using (tenant_id = current_tenant_id());

-- Ventas (Aislamiento Total)
drop policy if exists "Tenant isolation for sales" on sales;
create policy "Tenant isolation for sales" on sales
for all using (tenant_id = current_tenant_id());

-- Items de Venta (Aislamiento Total)
drop policy if exists "Tenant isolation for sale_items" on sale_items;
create policy "Tenant isolation for sale_items" on sale_items
for all using (tenant_id = current_tenant_id());

-- Movimientos de Inventario (Aislamiento Total)
drop policy if exists "Tenant isolation for inventory_movements" on inventory_movements;
create policy "Tenant isolation for inventory_movements" on inventory_movements
for all using (tenant_id = current_tenant_id());

-- Configuración de Tienda (Aislamiento Total)
drop policy if exists "Tenant isolation for store_settings" on store_settings;
create policy "Tenant isolation for store_settings" on store_settings
for all using (tenant_id = current_tenant_id());

-- 10. TRIGGERS (Automatización de tenant_id)
-- Esto evita que el programador olvide poner el tenant_id o que alguien intente inyectar uno falso.

drop trigger if exists t_set_tenant_id_products on public.products;
create trigger t_set_tenant_id_products before insert on public.products
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_suppliers on public.suppliers;
create trigger t_set_tenant_id_suppliers before insert on public.suppliers
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_customers on public.customers;
create trigger t_set_tenant_id_customers before insert on public.customers
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_sales on public.sales;
create trigger t_set_tenant_id_sales before insert on public.sales
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_sale_items on public.sale_items;
create trigger t_set_tenant_id_sale_items before insert on public.sale_items
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_inventory on public.inventory_movements;
create trigger t_set_tenant_id_inventory before insert on public.inventory_movements
for each row execute function public.set_tenant_id();

drop trigger if exists t_set_tenant_id_settings on public.store_settings;
create trigger t_set_tenant_id_settings before insert on public.store_settings
for each row execute function public.set_tenant_id();

-- 11. AUTOMATIZACIÓN DE ONBOARDING (Provisionamiento)
-- Esta función corre cada vez que un nuevo usuario se registra.

-- 11. AUTOMATIZACIÓN DE ONBOARDING (Provisionamiento Seguro)
-- Esta función corre cada vez que un nuevo usuario se registra.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  _tenant_id uuid;
begin
  -- 1. Generar ID único usando la extensión de Supabase
  _tenant_id := extensions.uuid_generate_v4();

  -- 2. Crear el Tenant (Provisionamiento)
  -- NOTA: Usamos raw_user_meta_data según la estructura de tu DB
  insert into public.tenants (id, name, subdomain, owner_id)
  values (
    _tenant_id, 
    coalesce(new.raw_user_meta_data->>'store_name', 'Mi Bodega'), 
    coalesce(new.raw_user_meta_data->>'subdomain', 'bodega-' || floor(random()*1000000)::text),
    new.id::text
  );

  -- 3. Crear configuración inicial
  insert into public.store_settings (tenant_id, business_name, email)
  values (_tenant_id, coalesce(new.raw_user_meta_data->>'store_name', 'Mi Bodega'), new.email);

  -- 4. Inyectar el tenant_id en los metadatos de la APP
  -- USAMOS: raw_app_meta_data (Confirmado por el error de Postgres)
  new.raw_app_meta_data := jsonb_build_object('tenant_id', _tenant_id);

  return new;
exception when others then
  raise exception 'Error en Onboarding BodegApp: %. Verifica los nombres de columnas en auth.users.', sqlerrm;
end;
$$;

-- Trigger para ejecutar la función antes de crear el usuario
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. PROVISIÓN MANUAL (Corre esto para arreglar un usuario que ya existe pero no tiene bodega)
-- Reemplaza 'ID_DEL_USUARIO' con el ID que ves en Auth > Users
-- 
-- DO $$
-- DECLARE
--   uid uuid := 'TU-UUID-AQUI'; 
--   tid uuid := extensions.uuid_generate_v4();
-- BEGIN
--   INSERT INTO public.tenants (id, name, subdomain, owner_id) VALUES (tid, 'Bodega Manual', 'demo', uid::text);
--   UPDATE auth.users SET raw_app_metadata = jsonb_build_object('tenant_id', tid) WHERE id = uid;
-- END $$;

-- 12. CASO DE EMERGENCIA: Creación Manual
-- Si el registro automático falla, puedes crear un tenant manualmente para un usuario existente:
-- 
-- DO $$
-- DECLARE
--   target_user_id uuid := 'ID-DEL-USUARIO-AQUÍ';
--   new_tid uuid := extensions.gen_random_uuid();
-- BEGIN
--   INSERT INTO public.tenants (id, name, subdomain, owner_id) VALUES (new_tid, 'Bodega Manual', 'manual', target_user_id::text);
--   UPDATE auth.users SET raw_app_metadata = raw_app_metadata || jsonb_build_object('tenant_id', new_tid) WHERE id = target_user_id;
-- END $$;

-- Cambiar el trigger a BEFORE INSERT para inyectar metadatos eficientemente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. DIAGNÓSTICO (Ejecuta esto para verificar si hay data oculta)
-- Si estas consultas devuelven filas pero tu App no las muestra, el problema es el RLS.
-- 
-- SELECT count(*) FROM public.tenants;
-- SELECT count(*) FROM public.products;
-- SELECT * FROM public.tenants LIMIT 5;

-- NOTA FINAL: Si experimentas problemas de visibilidad, puedes desactivar RLS temporalmente
-- para confirmar que la data existe ejecutando:
-- ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
