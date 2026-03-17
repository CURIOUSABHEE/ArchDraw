-- Run this in your Supabase SQL Editor

create table if not exists shared_canvases (
  id uuid default gen_random_uuid() primary key,
  canvas_name text not null,
  nodes jsonb not null,
  edges jsonb not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days')
);

alter table shared_canvases enable row level security;

create policy "Anyone can read shared canvases"
  on shared_canvases for select
  using (true);

create policy "Anyone can insert shared canvases"
  on shared_canvases for insert
  with check (true);
