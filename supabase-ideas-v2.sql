-- Ideas v2: richer ideas + idea discussion.
-- Adds description / competitors / tags / images / edited-time to ideas,
-- and lets a comment hang off an idea instead of a task.
-- Run in Supabase → SQL Editor → Run. Safe to re-run.

-- richer idea fields
alter table ideas add column if not exists description text;
alter table ideas add column if not exists competitors jsonb not null default '[]';
alter table ideas add column if not exists tags text[] not null default '{}';
alter table ideas add column if not exists image_urls text[] not null default '{}';
alter table ideas add column if not exists updated_at timestamptz not null default now();

-- a comment can now belong to an idea instead of a task
alter table comments add column if not exists idea_id uuid references ideas(id) on delete cascade;
alter table comments alter column task_id drop not null;
create index if not exists comments_idea_idx on comments(idea_id);

-- ...but it must hang off exactly one parent (a task XOR an idea)
do $$ begin
  alter table comments add constraint comments_one_parent
    check ((task_id is not null) <> (idea_id is not null));
exception when duplicate_object then null; end $$;
