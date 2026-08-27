-- Pulvio — pre-auth onboarding funnel answers, saved to the account right
-- after signup. One row per user (like sleep_schedule / push_tokens): the
-- whole set of answers is a single object, no history needed.
create table if not exists public.onboarding_answers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- "mostNights" | "fewNights" | "nowAndThen" | "comesAndGoes" | null
  frequency text,
  -- struggle keys, e.g. {racingThoughts,noiseAround}
  struggles text[] not null default '{}',
  -- sound keys, e.g. {rainThunder,pianoAmbient}
  sounds text[] not null default '{}',
  -- "withVoice" | "noVoice" | "either" | null
  voice text,
  bedtime_hour smallint not null default 23,
  bedtime_minute smallint not null default 0,
  reminder_on boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_answers enable row level security;

create policy "onboarding_answers_select_own"
  on public.onboarding_answers for select
  using (auth.uid() = user_id);

create policy "onboarding_answers_insert_own"
  on public.onboarding_answers for insert
  with check (auth.uid() = user_id);

create policy "onboarding_answers_update_own"
  on public.onboarding_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
