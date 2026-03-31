-- Bocal a Bidouilles — Initial Schema
-- Run this in the Supabase SQL Editor to create all tables.

-- Enums
create type goal_status as enum ('active', 'completed', 'archived');
create type entry_status as enum ('pending', 'success', 'miss', 'skip');
create type profile_role as enum ('child', 'parent');

-- Families
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles (family members)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  avatar text not null default 'cat',
  role profile_role not null default 'child',
  color text,
  created_at timestamptz not null default now()
);

create index idx_profiles_family on profiles(family_id);

-- Goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  description text,
  checklist_items jsonb not null default '[]'::jsonb,
  target_count integer not null,
  prize_text text not null,
  prize_emoji text,
  deadline_time time,
  active_days jsonb not null default '[1,2,3,4,5]'::jsonb,
  is_team boolean not null default true,
  status goal_status not null default 'active',
  start_date date not null,
  created_at timestamptz not null default now()
);

create index idx_goals_family on goals(family_id);
create index idx_goals_status on goals(status);

-- Goal participants (which kids are on which goal)
create table goal_participants (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(goal_id, profile_id)
);

create index idx_goal_participants_goal on goal_participants(goal_id);
create index idx_goal_participants_profile on goal_participants(profile_id);

-- Daily entries (one per goal per active day)
create table daily_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  date date not null,
  status entry_status not null default 'pending',
  success_number integer,
  decoration_seed integer,
  created_at timestamptz not null default now(),
  unique(goal_id, date)
);

create index idx_daily_entries_goal on daily_entries(goal_id);
create index idx_daily_entries_date on daily_entries(date);
create index idx_daily_entries_goal_date on daily_entries(goal_id, date);

-- Check-ins (individual check-in events)
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  date date not null,
  checked_in_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(profile_id, goal_id, date)
);

create index idx_check_ins_goal_date on check_ins(goal_id, date);
create index idx_check_ins_profile on check_ins(profile_id);

-- Row Level Security (permissive for v1 — no auth)
alter table families enable row level security;
alter table profiles enable row level security;
alter table goals enable row level security;
alter table goal_participants enable row level security;
alter table daily_entries enable row level security;
alter table check_ins enable row level security;

-- Allow all operations for now (single-family, no auth)
create policy "Allow all on families" on families for all using (true) with check (true);
create policy "Allow all on profiles" on profiles for all using (true) with check (true);
create policy "Allow all on goals" on goals for all using (true) with check (true);
create policy "Allow all on goal_participants" on goal_participants for all using (true) with check (true);
create policy "Allow all on daily_entries" on daily_entries for all using (true) with check (true);
create policy "Allow all on check_ins" on check_ins for all using (true) with check (true);
