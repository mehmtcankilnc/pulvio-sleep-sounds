-- Pulvio — favorites: kullanıcının beğendiği ses parçaları
-- cooldown/subscriptions'ın aksine bu tamamen kullanıcı kontrolünde veri —
-- sahtecilik/limit aşımı riski yok, bu yüzden client kendi satırlarını
-- doğrudan insert/delete edebilir (RPC/service_role gerekmiyor).

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index if not exists favorites_user_id_idx
  on public.favorites (user_id);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);
