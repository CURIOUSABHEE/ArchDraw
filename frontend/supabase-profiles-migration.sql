-- Run this in your Supabase SQL Editor

-- Users profile table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  created_at timestamp with time zone default now(),
  last_seen_at timestamp with time zone default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- User canvases table
create table if not exists public.user_canvases (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Canvas 1',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_canvases_updated_at on user_canvases;
create trigger update_user_canvases_updated_at
  before update on user_canvases
  for each row execute procedure update_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_canvases enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can read own canvases"
  on user_canvases for select using (auth.uid() = user_id);
create policy "Users can insert own canvases"
  on user_canvases for insert with check (auth.uid() = user_id);
create policy "Users can update own canvases"
  on user_canvases for update using (auth.uid() = user_id);
create policy "Users can delete own canvases"
  on user_canvases for delete using (auth.uid() = user_id);
