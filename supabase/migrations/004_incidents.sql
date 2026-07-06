-- =====================================================
-- ResQDrive — Migration 004: Incidents Table
-- =====================================================

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  address text default '',
  severity text not null default 'minor' check (severity in ('minor', 'moderate', 'severe')),
  status text not null default 'suspected' check (status in (
    'suspected', 'confirmed', 'cancelled', 'dispatched', 'acknowledged', 'resolved'
  )),
  sensor_snapshot jsonb not null default '{}'::jsonb,
  alert_dispatch_status jsonb not null default '{}'::jsonb,
  damage_assessment jsonb,
  repair_cost_estimate jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incidents_user_id on public.incidents(user_id);
create index if not exists idx_incidents_severity on public.incidents(severity);
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_occurred_at on public.incidents(occurred_at desc);

drop trigger if exists trg_incidents_updated_at on public.incidents;
create trigger trg_incidents_updated_at before update on public.incidents
  for each row execute function public.handle_updated_at();

alter table public.incidents enable row level security;

drop policy if exists "Incidents are viewable by owner" on public.incidents;
create policy "Incidents are viewable by owner"
  on public.incidents for select using (auth.uid() = user_id);

drop policy if exists "Incidents are insertable by owner" on public.incidents;
create policy "Incidents are insertable by owner"
  on public.incidents for insert with check (auth.uid() = user_id);

drop policy if exists "Incidents are updatable by owner" on public.incidents;
create policy "Incidents are updatable by owner"
  on public.incidents for update using (auth.uid() = user_id);

drop policy if exists "Incidents are deletable by owner" on public.incidents;
create policy "Incidents are deletable by owner"
  on public.incidents for delete using (auth.uid() = user_id);

drop policy if exists "Incidents are viewable by admins" on public.incidents;
create policy "Incidents are viewable by admins"
  on public.incidents for select using (public.is_admin());