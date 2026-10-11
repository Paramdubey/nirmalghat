-- NirmalGhat: field agents, brief assignments and field reports.
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Roles:
--   officer = a Supabase Auth user whose app_metadata has {"role": "officer"} (set in the dashboard, see README).
--   agent   = a Supabase Auth user that has a row in public.agents (created by an officer in the app).
-- Row Level Security is the ONLY thing protecting this data, because the browser talks to Supabase directly.

create extension if not exists pgcrypto;

create table if not exists public.agents (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  name_key text not null unique,
  ghats text[] not null check (cardinality(ghats) between 1 and 50),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id),
  site text not null check (char_length(site) between 1 and 120),
  brief jsonb not null check (
    jsonb_typeof(brief) = 'object'
    and brief #>> '{risk,site}' = site
    and jsonb_typeof(brief -> 'actions') = 'array'
    and jsonb_array_length(brief -> 'actions') between 1 and 20
    and pg_column_size(brief) < 200000
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments (id),
  agent_id uuid not null references public.agents (id),
  site text not null,
  report jsonb not null check (
    jsonb_typeof(report) = 'object'
    and jsonb_typeof(report -> 'readings') = 'array'
    and jsonb_array_length(report -> 'readings') = 13
    and report ->> 'stage' in ('pre', 'during', 'after')
    and report ->> 'sampledOn' ~ '^\d{4}-\d{2}-\d{2}$'
    and pg_column_size(report) < 20000
  ),
  submitted_at timestamptz not null default now()
);

create index if not exists assignments_agent_idx on public.assignments (agent_id);

-- Who is an officer? Only app_metadata counts: users cannot edit it themselves.
create or replace function public.is_officer() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'officer'
$$;

alter table public.agents enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- agents: officers manage; an agent can read only their own row.
create policy agents_officer_select on public.agents for select to authenticated using (public.is_officer());
create policy agents_officer_insert on public.agents for insert to authenticated with check (public.is_officer());
create policy agents_self_select on public.agents for select to authenticated using (id = auth.uid());

-- assignments: officers create and read; an agent reads only their own. Nobody updates or deletes.
create policy assignments_officer_select on public.assignments for select to authenticated using (public.is_officer());
create policy assignments_officer_insert on public.assignments for insert to authenticated
  with check (
    public.is_officer()
    and exists (select 1 from public.agents a where a.id = agent_id and site = any (a.ghats))
  );
create policy assignments_agent_select on public.assignments for select to authenticated using (agent_id = auth.uid());

-- submissions: an agent inserts exactly one report for a brief assigned to them; officers read all.
create policy submissions_officer_select on public.submissions for select to authenticated using (public.is_officer());
create policy submissions_agent_select on public.submissions for select to authenticated using (agent_id = auth.uid());
create policy submissions_agent_insert on public.submissions for insert to authenticated
  with check (
    agent_id = auth.uid()
    and exists (select 1 from public.assignments s where s.id = assignment_id and s.agent_id = auth.uid() and s.site = submissions.site)
  );

-- Removing an agent also removes their login. Refused if they have briefs. Officers only.
create or replace function public.officer_delete_agent(agent uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_officer() then raise exception 'Officer access only' using errcode = '42501'; end if;
  if exists (select 1 from public.assignments where agent_id = agent) then
    raise exception 'This agent has assigned briefs and cannot be removed' using errcode = 'P0001';
  end if;
  delete from public.agents where id = agent;
  delete from auth.users where id = agent;
end $$;
revoke all on function public.officer_delete_agent(uuid) from public, anon;
grant execute on function public.officer_delete_agent(uuid) to authenticated;
