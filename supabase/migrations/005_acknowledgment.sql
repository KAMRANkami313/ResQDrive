alter table public.incidents
  add column if not exists acknowledged_by uuid,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by_name text,
  add column if not exists escalation_status jsonb not null default '{}'::jsonb;

drop policy if exists "Incidents are updatable by anyone for ack" on public.incidents;
create policy "Incidents ack updateable by anyone with link"
  on public.incidents for update
  using (true)
  with check (true);