create table if not exists public.emergency_numbers (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  service_name text not null,
  phone text not null,
  description text default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_emergency_numbers_region_phone on public.emergency_numbers(region, phone);

drop trigger if exists trg_emergency_numbers_updated_at on public.emergency_numbers;
create trigger trg_emergency_numbers_updated_at before update on public.emergency_numbers
  for each row execute function public.handle_updated_at();

alter table public.emergency_numbers enable row level security;

drop policy if exists "Emergency numbers publicly readable" on public.emergency_numbers;
create policy "Emergency numbers publicly readable"
  on public.emergency_numbers for select using (true);

drop policy if exists "Emergency numbers manageable by admins" on public.emergency_numbers;
create policy "Emergency numbers manageable by admins"
  on public.emergency_numbers for all using (public.is_admin());

insert into public.emergency_numbers (region, service_name, phone, description, sort_order) values
  ('punjab', 'Rescue 1122', '1122', 'Punjab Emergency Service - Ambulance, Fire, Rescue', 1),
  ('islamabad', 'Rescue 1122', '1122', 'Islamabad Emergency Service - Ambulance, Fire, Rescue', 1),
  ('kpk', 'Rescue 1122', '1122', 'KPK Emergency Service - Ambulance, Fire, Rescue', 1),
  ('sindh', 'Edhi Foundation', '115', 'Edhi Ambulance Service - Nationwide coverage', 1),
  ('sindh', 'Chhipa Welfare', '1020', 'Chhipa Ambulance - Karachi & Sindh', 2),
  ('karachi', 'Edhi Foundation', '115', 'Edhi Ambulance Service - Karachi', 1),
  ('karachi', 'Chhipa Welfare', '1020', 'Chhipa Ambulance - Karachi', 2),
  ('balochistan', 'Edhi Foundation', '115', 'Edhi Ambulance Service - Balochistan', 1),
  ('default', 'Rescue 1122', '1122', 'Default emergency number', 1),
  ('default', 'Edhi Foundation', '115', 'Nationwide ambulance service', 2)
on conflict (region, phone) do nothing;