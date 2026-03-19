-- Run this in your Supabase SQL Editor

create table if not exists tutorial_response_cache (
  question_hash text primary key,
  response      text not null,
  created_at    timestamp with time zone default now()
);

-- Anyone can read (needed for server-side lookups using anon key)
alter table tutorial_response_cache enable row level security;

create policy "Anyone can read tutorial cache"
  on tutorial_response_cache for select
  using (true);

create policy "Anyone can insert tutorial cache"
  on tutorial_response_cache for insert
  with check (true);

create policy "Anyone can upsert tutorial cache"
  on tutorial_response_cache for update
  using (true);
