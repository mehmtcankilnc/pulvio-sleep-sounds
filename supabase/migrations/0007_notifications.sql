-- Pulvio — Faz 7: bildirimler
-- period_type: RevenueCat webhook'undan gelen "trial" | "normal" ayrımı,
-- trial bitiş hatırlatmasını (send-trial-reminders) sadece gerçek trial
-- kullanıcılarına göndermek için gerekli — normal yenilemeyle karışmasın diye.
alter table public.subscriptions
  add column if not exists period_type text,
  add column if not exists trial_reminder_sent boolean not null default false;

-- push_tokens: subscriptions'ın aksine güvenlik-kritik değil, kullanıcı
-- kendi push token'ını kendi yazabilir (bkz. RLS policy altta).
create table if not exists public.push_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_upsert_own"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_update_own"
  on public.push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
