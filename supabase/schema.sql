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
alter table public.body_parts enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_log_parts enable row level security;

create policy "own body_parts" on public.body_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_log_parts" on public.workout_log_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
