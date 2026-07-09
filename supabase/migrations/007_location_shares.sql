create table if not exists public.location_shares (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  share_token uuid not null default gen_random_uuid(),
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  speed_kmh double precision,
  heading double precision,
  battery_level integer,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  last_update_at timestamptz not null default now(),
  ended_at timestamptz,
  location_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_location_shares_incident on public.location_shares(incident_id);
create index if not exists idx_location_shares_token on public.location_shares(share_token);
create index if not exists idx_location_shares_active on public.location_shares(is_active) where is_active = true;

drop trigger if exists trg_location_shares_updated_at on public.location_shares;
create trigger trg_location_shares_updated_at before update on public.location_shares
  for each row execute function public.handle_updated_at();

alter table public.location_shares enable row level security;

drop policy if exists "Location shares insertable by owner" on public.location_shares;
create policy "Location shares insertable by owner"
  on public.location_shares for insert with check (auth.uid() = user_id);

drop policy if exists "Location shares updatable by owner" on public.location_shares;
create policy "Location shares updatable by owner"
  on public.location_shares for update using (auth.uid() = user_id);

drop policy if exists "Location shares viewable by owner" on public.location_shares;
create policy "Location shares viewable by owner"
  on public.location_shares for select using (auth.uid() = user_id);

drop policy if exists "Location shares deletable by owner" on public.location_shares;
create policy "Location shares deletable by owner"
  on public.location_shares for delete using (auth.uid() = user_id);

drop policy if exists "Location shares publicly viewable by token" on public.location_shares;
create policy "Location shares publicly viewable by token"
  on public.location_shares for select using (true);

alter publication supabase_realtime add table public.location_shares;