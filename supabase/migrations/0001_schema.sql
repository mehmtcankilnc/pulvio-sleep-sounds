-- Pulvio — Faz 2: temel şema
-- Not: `users` tablosu Supabase Auth tarafından otomatik yönetilir (auth.users),
-- burada ayrıca bir kullanıcı tablosu tanımlanmıyor.

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  subcategory text not null,
  duration integer not null,
  storage_url text not null,
  cover_url text,
  is_premium_only boolean not null default false,
  license_type text,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists tracks_category_subcategory_idx
  on public.tracks (category, subcategory);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'active',
  expires_at timestamptz,
  revenuecat_id text
);

create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  started_at timestamptz not null default now(),
  seconds_played integer not null default 0
);

create index if not exists listening_sessions_user_id_idx
  on public.listening_sessions (user_id);

create table if not exists public.cooldowns (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_free_play_at timestamptz,
  next_available_at timestamptz
);
