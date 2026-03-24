-- Yomitomo Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ================================================
-- 1. User profiles (extends Supabase Auth)
-- ================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  is_visually_impaired boolean default false,
  preferred_speech_rate float default 0.9,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- 2. Tactile paving reports (盲道データ)
-- ================================================
create table if not exists public.tactile_paving_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  paving_type text check (paving_type in ('warning', 'guide', 'unknown')) default 'unknown',
  condition text check (condition in ('good', 'damaged', 'blocked', 'unknown')) default 'unknown',
  photo_url text,
  note text,
  verified boolean default false,
  verified_count int default 0,
  created_at timestamptz default now()
);

alter table public.tactile_paving_reports enable row level security;

-- Anyone can read reports
create policy "Anyone can view reports"
  on public.tactile_paving_reports for select
  to authenticated, anon
  using (true);

-- Authenticated users can create reports
create policy "Authenticated users can create reports"
  on public.tactile_paving_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update own reports
create policy "Users can update own reports"
  on public.tactile_paving_reports for update
  to authenticated
  using (auth.uid() = user_id);

-- Spatial index for location queries
create index if not exists idx_tactile_paving_location
  on public.tactile_paving_reports (latitude, longitude);

-- ================================================
-- 3. Document reading history
-- ================================================
create table if not exists public.document_readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  document_type text not null,
  sender text,
  summary text not null,
  key_info jsonb default '[]'::jsonb,
  action_needed text,
  full_text text,
  created_at timestamptz default now()
);

alter table public.document_readings enable row level security;

-- Users can only see own documents
create policy "Users can view own documents"
  on public.document_readings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own documents"
  on public.document_readings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.document_readings for delete
  to authenticated
  using (auth.uid() = user_id);

-- Index for user queries
create index if not exists idx_document_readings_user
  on public.document_readings (user_id, created_at desc);

-- ================================================
-- 4. Paving verification votes
-- ================================================
create table if not exists public.paving_verifications (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.tactile_paving_reports on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  is_accurate boolean not null,
  created_at timestamptz default now(),
  unique (report_id, user_id)
);

alter table public.paving_verifications enable row level security;

create policy "Authenticated users can verify"
  on public.paving_verifications for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Anyone can view verifications"
  on public.paving_verifications for select
  to authenticated, anon
  using (true);

-- Auto-update verified count on the report
create or replace function public.update_verification_count()
returns trigger as $$
begin
  update public.tactile_paving_reports
  set
    verified_count = (
      select count(*) from public.paving_verifications
      where report_id = new.report_id and is_accurate = true
    ),
    verified = (
      select count(*) >= 3 from public.paving_verifications
      where report_id = new.report_id and is_accurate = true
    )
  where id = new.report_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_verification_created
  after insert on public.paving_verifications
  for each row execute procedure public.update_verification_count();
