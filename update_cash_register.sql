-- Create table for Cash Registers (Sesiones de Caja)
create table if not exists cash_registers (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) not null,
  user_id uuid references auth.users(id), -- User who opened the register (optional linkage to auth)
  opening_amount decimal(10,2) not null default 0,
  closing_amount decimal(10,2), -- Null while open
  expected_amount decimal(10,2), -- Calculated by system upon closing
  status text default 'open', -- 'open', 'closed'
  opened_at timestamptz default now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS for cash_registers
alter table cash_registers enable row level security;

-- Policy: Users can view registers for their tenant
create policy "Users can view cash registers for their tenant"
  on cash_registers for select
  using (tenant_id = public.current_tenant_id());

-- Policy: Users can insert registers for their tenant
create policy "Users can insert cash registers for their tenant"
  on cash_registers for insert
  with check (tenant_id = public.current_tenant_id());

-- Policy: Users can update registers for their tenant
create policy "Users can update cash registers for their tenant"
  on cash_registers for update
  using (tenant_id = public.current_tenant_id());


-- Create table for Cash Movements (Movimientos Manuales)
create table if not exists cash_movements (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) not null,
  cash_register_id uuid references cash_registers(id) not null,
  type text not null, -- 'ingreso' (deposit) or 'egreso' (withdrawal)
  amount decimal(10,2) not null,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS for cash_movements
alter table cash_movements enable row level security;

-- Policy: Users can view movements for their tenant
create policy "Users can view cash movements for their tenant"
  on cash_movements for select
  using (tenant_id = public.current_tenant_id());

-- Policy: Users can insert movements for their tenant
create policy "Users can insert cash movements for their tenant"
  on cash_movements for insert
  with check (tenant_id = public.current_tenant_id());

-- Indexes for performance
create index if not exists idx_cash_registers_tenant on cash_registers(tenant_id);
create index if not exists idx_cash_registers_status on cash_registers(status);
create index if not exists idx_cash_movements_register on cash_movements(cash_register_id);
