-- NirmalGhat: map positions for the ghats, set by an officer on the map.
-- The MPPCB data has no coordinates, so none are invented: a ghat has no position until an officer sets one.
-- Run once in the Supabase SQL editor, after 0001_nirmalghat.sql.

create table if not exists public.ghat_locations (
  site text primary key check (char_length(site) between 1 and 120),
  -- Rough sanity box around Bhopal, to catch a mis-click far away.
  lat double precision not null check (lat between 22.5 and 24.0),
  lng double precision not null check (lng between 76.5 and 78.0),
  set_by uuid default auth.uid() references auth.users (id) on delete set null,
  set_at timestamptz not null default now()
);

alter table public.ghat_locations enable row level security;

create policy ghat_locations_officer_select on public.ghat_locations for select to authenticated using (public.is_officer());
create policy ghat_locations_officer_insert on public.ghat_locations for insert to authenticated with check (public.is_officer());
create policy ghat_locations_officer_update on public.ghat_locations for update to authenticated using (public.is_officer()) with check (public.is_officer());
create policy ghat_locations_officer_delete on public.ghat_locations for delete to authenticated using (public.is_officer());
