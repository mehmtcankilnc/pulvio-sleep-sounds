-- Pulvio — Faz 2: Row Level Security
-- Prensip: cooldown/abonelik verisi client'tan asla yazılamaz — sadece backend
-- (service_role) veya sonraki fazlarda tanımlanacak RPC/Edge Function'lar yazabilir.

alter table public.tracks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.listening_sessions enable row level security;
alter table public.cooldowns enable row level security;

-- tracks: herkese açık okuma, yazma policy'si yok (sadece dashboard/service_role)
create policy "tracks_select_all"
  on public.tracks for select
  using (true);

-- subscriptions: kullanıcı sadece kendi satırını okuyabilir, yazma policy'si yok
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- listening_sessions: kullanıcı sadece kendi satırlarını okuyabilir, yazma policy'si yok
create policy "listening_sessions_select_own"
  on public.listening_sessions for select
  using (auth.uid() = user_id);

-- cooldowns: kullanıcı sadece kendi satırını okuyabilir, yazma policy'si yok
create policy "cooldowns_select_own"
  on public.cooldowns for select
  using (auth.uid() = user_id);
