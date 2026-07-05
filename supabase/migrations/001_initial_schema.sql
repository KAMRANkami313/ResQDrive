-- ResQDrive — Initial Schema Migration
-- Run date: 2026-07-04
-- Tables: profiles, vehicles, emergency_contacts
-- Includes: triggers, RLS policies, indexes

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text default '',
  cnic text default '',
  blood_group text default '',
  allergies text default '',
  avatar_url text default '',
  role text not null default 'driver' check (role in ('driver', 'admin', 'emergency_staff', 'mechanic')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  color text not null default '',
  license_plate text not null,
  vin text default '',
  insurance_provider text default '',
  insurance_policy_number text default '',
  insurance_expiry date,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_user_id on public.vehicles(user_id);
create unique index if not exists idx_vehicles_license_plate on public.vehicles(license_plate);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  email text default '',
  relationship text not null default '',
  priority integer not null default 1 check (priority >= 1 and priority <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_emergency_contacts_user_id on public.emergency_contacts(user_id);
create index if not exists idx_emergency_contacts_priority on public.emergency_contacts(user_id, priority);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$ begin
  new.updated_at = now();
  return new;
end;
 $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at before update on public.vehicles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_emergency_contacts_updated_at on public.emergency_contacts;
create trigger trg_emergency_contacts_updated_at before update on public.emergency_contacts
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
 $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.emergency_contacts enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Profiles are viewable by admins" on public.profiles;
create policy "Profiles are viewable by admins"
  on public.profiles for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "Vehicles are viewable by owner" on public.vehicles;
create policy "Vehicles are viewable by owner"
  on public.vehicles for select using (auth.uid() = user_id);

drop policy if exists "Vehicles are insertable by owner" on public.vehicles;
create policy "Vehicles are insertable by owner"
  on public.vehicles for insert with check (auth.uid() = user_id);

drop policy if exists "Vehicles are updatable by owner" on public.vehicles;
create policy "Vehicles are updatable by owner"
  on public.vehicles for update using (auth.uid() = user_id);

drop policy if exists "Vehicles are deletable by owner" on public.vehicles;
create policy "Vehicles are deletable by owner"
  on public.vehicles for delete using (auth.uid() = user_id);

drop policy if exists "Contacts are viewable by owner" on public.emergency_contacts;
create policy "Contacts are viewable by owner"
  on public.emergency_contacts for select using (auth.uid() = user_id);

drop policy if exists "Contacts are insertable by owner" on public.emergency_contacts;
create policy "Contacts are insertable by owner"
  on public.emergency_contacts for insert with check (auth.uid() = user_id);

drop policy if exists "Contacts are updatable by owner" on public.emergency_contacts;
create policy "Contacts are updatable by owner"
  on public.emergency_contacts for update using (auth.uid() = user_id);

drop policy if exists "Contacts are deletable by owner" on public.emergency_contacts;
create policy "Contacts are deletable by owner"
  on public.emergency_contacts for delete using (auth.uid() = user_id);

drop policy if exists "Vehicles are viewable by admins" on public.vehicles;
create policy "Vehicles are viewable by admins"
  on public.vehicles for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "Contacts are viewable by admins" on public.emergency_contacts;
create policy "Contacts are viewable by admins"
  on public.emergency_contacts for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));