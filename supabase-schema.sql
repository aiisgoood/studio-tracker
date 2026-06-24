-- Studio task tracker — schema + seed.
-- Safe to re-run: it drops and rebuilds the tables (there's no real data yet).
-- Paste this whole file into Supabase → SQL Editor → Run.

-- ---------- Clean slate ----------
drop table if exists tasks cascade;
drop table if exists ideas cascade;
drop table if exists projects cascade;
drop table if exists members cascade;

-- ---------- Tables ----------
create table members (
  id text primary key,
  name text not null,
  initial text not null,
  color text not null,
  ink text not null,
  sort int not null default 0
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  assignee_ids text[] not null default '{}',
  due_date date,
  position int not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pitch text,
  suggested_by text,
  status text not null default 'new',
  votes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index tasks_project_idx on tasks(project_id);

-- ---------- Row Level Security ----------
-- No login yet: allow the public (anon) key full access. Tighten later when
-- real auth / a team passcode is added.
alter table members enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table ideas enable row level security;

create policy "public members" on members for all using (true) with check (true);
create policy "public projects" on projects for all using (true) with check (true);
create policy "public tasks" on tasks for all using (true) with check (true);
create policy "public ideas" on ideas for all using (true) with check (true);

-- ---------- Seed the 5 teammates ----------
insert into members (id, name, initial, color, ink, sort) values
  ('m_gelika', 'gelika', 'G', '#e08a63', '#3a1c0e', 1),
  ('m_cotne',  'cotne',  'C', '#6f9bc4', '#0f2740', 2),
  ('m_nitch',  'nitch',  'N', '#7ba86a', '#1b3311', 3),
  ('m_abdu',   'abdu',   'A', '#9d8fd6', '#241a52', 4),
  ('m_leqso',  'leqso',  'L', '#d58ba6', '#451527', 5);

-- ---------- Seed starter projects ----------
insert into projects (name) values ('Project Alpha'), ('Side hustle');

-- ---------- Enable realtime (used in Stage 3) ----------
do $$ begin alter publication supabase_realtime add table tasks; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table ideas; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table projects; exception when others then null; end $$;
