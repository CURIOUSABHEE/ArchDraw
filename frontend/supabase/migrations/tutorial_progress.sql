create table if not exists tutorial_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  tutorial_id text not null,
  current_level integer not null default 1,
  current_step integer not null default 1,
  current_phase text not null default 'context',
  completed_levels integer[] not null default '{}',
  canvas_nodes jsonb not null default '[]',
  canvas_edges jsonb not null default '[]',
  explain_count integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, tutorial_id)
);

-- Update timestamp automatically
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tutorial_progress_updated_at
  before update on tutorial_progress
  for each row execute function update_updated_at();

-- Row level security
alter table tutorial_progress enable row level security;

create policy "Users can read own progress"
  on tutorial_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on tutorial_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on tutorial_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on tutorial_progress for delete
  using (auth.uid() = user_id);
