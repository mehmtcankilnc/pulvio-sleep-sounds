-- Pulvio — Sleep screen: bedtime/wake schedule + tonight's routine toggles.
-- One row per user (like push_tokens) — the whole schedule is a single
-- object, no history/versioning needed.
create table if not exists public.sleep_schedule (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bedtime_hour smallint not null default 23,
  bedtime_minute smallint not null default 30,
  wake_hour smallint not null default 7,
  wake_minute smallint not null default 0,
  play_at_bedtime_enabled boolean not null default false,
  play_at_bedtime_track_id uuid references public.tracks (id) on delete set null,
  fade_out_enabled boolean not null default true,
  quiet_wakeup_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.sleep_schedule enable row level security;

create policy "sleep_schedule_select_own"
  on public.sleep_schedule for select
  using (auth.uid() = user_id);

create policy "sleep_schedule_insert_own"
  on public.sleep_schedule for insert
  with check (auth.uid() = user_id);

create policy "sleep_schedule_update_own"
  on public.sleep_schedule for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
