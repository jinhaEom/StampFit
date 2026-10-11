create table if not exists public.body_parts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.workout_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  duration_min integer not null,
  intensity integer not null check (intensity between 1 and 5),
  condition integer not null check (condition between 1 and 5),
  memo text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, log_date)
);

create table if not exists public.workout_log_parts (
  log_id uuid not null references public.workout_logs (id) on delete cascade,
  body_part_id uuid not null references public.body_parts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  duration_min integer not null default 0,
  primary key (log_id, body_part_id)
);

-- 이미 생성된 프로젝트에도 안전하게 적용되는 컬럼 추가 (부위별 시간 기록 지원)
alter table public.workout_log_parts add column if not exists duration_min integer not null default 0;
-- 부위 소프트 삭제 — 앱(sync.ts)이 이 컬럼을 읽고 쓴다. 없으면 동기화 전체가 실패한다.
alter table public.body_parts add column if not exists deleted_at timestamptz;
alter table public.body_parts enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_log_parts enable row level security;

create policy "own body_parts" on public.body_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_log_parts" on public.workout_log_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 회원 탈퇴 
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;

-- 주간 목표·목표 이력·운동 싸이클 (2026-10 추가)
create table if not exists public.goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  target_count integer not null,
  recurring boolean not null default false,
  week_start date not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  target_count integer not null,
  recurring boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create table if not exists public.workout_cycle (
  user_id uuid primary key references auth.users (id) on delete cascade,
  steps jsonb not null,
  current_index integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.goal_history enable row level security;
alter table public.workout_cycle enable row level security;

drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own goal_history" on public.goal_history;
create policy "own goal_history" on public.goal_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own workout_cycle" on public.workout_cycle;
create policy "own workout_cycle" on public.workout_cycle
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
