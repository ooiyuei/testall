-- User data persistence tables
-- All tables use user_id (uuid) referencing auth.users with RLS

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table user_profiles enable row level security;
create policy "users_manage_own_profile"
  on user_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists user_planning (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table user_planning enable row level security;
create policy "users_manage_own_planning"
  on user_planning for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists user_tests (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_tests enable row level security;
create policy "users_manage_own_tests"
  on user_tests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_tests_user_id_idx on user_tests (user_id);

create table if not exists user_block_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id text not null,
  block_idx integer not null,
  data jsonb not null,
  completed_at timestamptz default now(),
  unique (user_id, test_id, block_idx)
);
alter table user_block_logs enable row level security;
create policy "users_manage_own_block_logs"
  on user_block_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_block_logs_user_id_idx on user_block_logs (user_id);

create table if not exists user_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  status text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_tasks enable row level security;
create policy "users_manage_own_tasks"
  on user_tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_tasks_user_id_idx on user_tasks (user_id);

create table if not exists user_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  event_date date,
  created_at timestamptz default now()
);
alter table user_events enable row level security;
create policy "users_manage_own_events"
  on user_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_events_user_id_idx on user_events (user_id);

create table if not exists user_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_iso text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  unique (user_id, date_iso)
);
alter table user_daily_logs enable row level security;
create policy "users_manage_own_daily_logs"
  on user_daily_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_daily_logs_user_id_idx on user_daily_logs (user_id);

create table if not exists user_weekly_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_iso text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, week_start_iso)
);
alter table user_weekly_goals enable row level security;
create policy "users_manage_own_weekly_goals"
  on user_weekly_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists user_weekly_executions (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_iso text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, week_start_iso)
);
alter table user_weekly_executions enable row level security;
create policy "users_manage_own_weekly_executions"
  on user_weekly_executions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
