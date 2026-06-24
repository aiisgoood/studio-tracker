-- Comments + image uploads. Run in Supabase → SQL Editor → Run. Safe to re-run.

-- image attachments on tasks
alter table tasks add column if not exists image_urls text[] not null default '{}';

-- comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  author_id text,
  body text,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists comments_task_idx on comments(task_id);

alter table comments enable row level security;
drop policy if exists "public comments" on comments;
create policy "public comments" on comments for all using (true) with check (true);
do $$ begin alter publication supabase_realtime add table comments; exception when others then null; end $$;

-- public storage bucket for uploaded images
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "uploads read" on storage.objects;
drop policy if exists "uploads insert" on storage.objects;
drop policy if exists "uploads delete" on storage.objects;
create policy "uploads read" on storage.objects for select using (bucket_id = 'uploads');
create policy "uploads insert" on storage.objects for insert with check (bucket_id = 'uploads');
create policy "uploads delete" on storage.objects for delete using (bucket_id = 'uploads');
