-- Pulvio — Faz 4: freemium/cooldown backend mantığı
-- Kural: 3 dk (180 sn) kümülatif dinleme sınırı bir cooldown döngüsü boyunca
-- geçerlidir (tek track değil) — track değiştirerek bypass edilemez, çünkü
-- sayaç cooldowns.free_seconds_used'da tutulur, listening_sessions sadece
-- denetim/log amaçlıdır. cooldownEndsAt/next_available_at HER ZAMAN bu
-- fonksiyonlar içinde DB'nin now()'ı ile hesaplanır, client asla üretmez.

alter table public.cooldowns
  add column if not exists free_seconds_used integer not null default 0
    check (free_seconds_used >= 0 and free_seconds_used <= 180),
  add column if not exists cycle_started_at timestamptz;

alter table public.listening_sessions
  add column if not exists last_heartbeat_at timestamptz not null default now(),
  add column if not exists ended_at timestamptz,
  add column if not exists plan_at_start text not null default 'free'
    check (plan_at_start in ('free', 'premium'));

-- ---------------------------------------------------------------------------
-- start_playback: track'i çalmaya başlamadan ÖNCE çağrılır.
-- ---------------------------------------------------------------------------
create or replace function public.start_playback(p_track_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_premium_only boolean;
  v_sub record;
  v_is_premium boolean;
  v_cooldown record;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select is_premium_only into v_is_premium_only
  from public.tracks
  where id = p_track_id;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'track_not_found');
  end if;

  select * into v_sub from public.subscriptions where user_id = v_user_id;

  -- Faz 5'te RevenueCat webhook'u status/expires_at yazacak; burada şimdiden
  -- doğru şekilde ele alınıyor ki Faz 5 bu fonksiyona dokunmasın.
  v_is_premium := v_sub.plan = 'premium'
    and v_sub.status = 'active'
    and (v_sub.expires_at is null or v_sub.expires_at > now());

  if v_is_premium then
    insert into public.listening_sessions
      (user_id, track_id, started_at, seconds_played, plan_at_start, last_heartbeat_at)
    values (v_user_id, p_track_id, now(), 0, 'premium', now())
    returning id into v_session_id;

    return jsonb_build_object(
      'allowed', true,
      'session_id', v_session_id,
      'plan', 'premium',
      'cooldown_ends_at', null,
      'free_seconds_remaining', null
    );
  end if;

  -- Ücretsiz kullanıcı: premium-only track hiç çalınamaz.
  if v_is_premium_only then
    return jsonb_build_object('allowed', false, 'reason', 'premium_only', 'cooldown_ends_at', null);
  end if;

  select * into v_cooldown
  from public.cooldowns
  where user_id = v_user_id
  for update;

  if not found then
    -- Savunma amaçlı: trigger (0003) normalde bu satırı zaten oluşturur.
    insert into public.cooldowns (user_id) values (v_user_id)
    returning * into v_cooldown;
  end if;

  if v_cooldown.next_available_at is not null and v_cooldown.next_available_at > now() then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'cooldown',
      'cooldown_ends_at', v_cooldown.next_available_at
    );
  end if;

  -- Önceki döngü bittiyse (next_available_at geçmişte kaldıysa) yeni döngü başlat.
  if v_cooldown.next_available_at is not null then
    update public.cooldowns
    set free_seconds_used = 0, next_available_at = null, cycle_started_at = now()
    where user_id = v_user_id
    returning * into v_cooldown;
  elsif v_cooldown.cycle_started_at is null then
    update public.cooldowns
    set cycle_started_at = now()
    where user_id = v_user_id
    returning * into v_cooldown;
  end if;

  insert into public.listening_sessions
    (user_id, track_id, started_at, seconds_played, plan_at_start, last_heartbeat_at)
  values (v_user_id, p_track_id, now(), 0, 'free', now())
  returning id into v_session_id;

  update public.cooldowns set last_free_play_at = now() where user_id = v_user_id;

  return jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id,
    'plan', 'free',
    'cooldown_ends_at', null,
    'free_seconds_remaining', greatest(180 - v_cooldown.free_seconds_used, 0)
  );
end;
$$;

revoke all on function public.start_playback(uuid) from public;
grant execute on function public.start_playback(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- playback_heartbeat: oynatma sırasında periyodik çağrılır.
-- p_seconds_elapsed: son heartbeat'ten bu yana geçen GERÇEK duvar-saati saniyesi
-- (track pozisyonu DEĞİL — seek ile oynanamasın diye). Server 0-30 arasına clamp'ler.
-- ---------------------------------------------------------------------------
create or replace function public.playback_heartbeat(p_session_id uuid, p_seconds_elapsed integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session record;
  v_cooldown record;
  v_delta integer;
  v_new_total integer;
  v_cooldown_ends_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_delta := greatest(least(coalesce(p_seconds_elapsed, 0), 30), 0);

  select * into v_session
  from public.listening_sessions
  where id = p_session_id and user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_session');
  end if;

  if v_session.plan_at_start = 'premium' then
    update public.listening_sessions
    set seconds_played = seconds_played + v_delta, last_heartbeat_at = now()
    where id = p_session_id;

    return jsonb_build_object('allowed', true, 'plan', 'premium', 'cooldown_ends_at', null);
  end if;

  select * into v_cooldown
  from public.cooldowns
  where user_id = v_user_id
  for update;

  if v_cooldown.next_available_at is not null and v_cooldown.next_available_at > now() then
    update public.listening_sessions
    set ended_at = coalesce(ended_at, now())
    where id = p_session_id;

    return jsonb_build_object(
      'allowed', false, 'reason', 'cooldown', 'cooldown_ends_at', v_cooldown.next_available_at
    );
  end if;

  v_new_total := coalesce(v_cooldown.free_seconds_used, 0) + v_delta;

  update public.listening_sessions
  set seconds_played = seconds_played + v_delta, last_heartbeat_at = now()
  where id = p_session_id;

  if v_new_total >= 180 then
    v_cooldown_ends_at := now() + interval '3 hours';

    update public.cooldowns
    set free_seconds_used = 180, next_available_at = v_cooldown_ends_at, last_free_play_at = now()
    where user_id = v_user_id;

    update public.listening_sessions set ended_at = now() where id = p_session_id;

    return jsonb_build_object(
      'allowed', false, 'reason', 'limit_reached',
      'cooldown_ends_at', v_cooldown_ends_at, 'free_seconds_remaining', 0
    );
  end if;

  update public.cooldowns set free_seconds_used = v_new_total where user_id = v_user_id;

  return jsonb_build_object(
    'allowed', true, 'plan', 'free', 'cooldown_ends_at', null,
    'free_seconds_remaining', 180 - v_new_total
  );
end;
$$;

revoke all on function public.playback_heartbeat(uuid, integer) from public;
grant execute on function public.playback_heartbeat(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- get_user_status: uygulama açılışında / Ayarlar'da tek round-trip'te
-- plan+cooldown durumu.
-- ---------------------------------------------------------------------------
create or replace function public.get_user_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sub record;
  v_cooldown record;
  v_cooldown_active boolean;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_sub from public.subscriptions where user_id = v_user_id;
  select * into v_cooldown from public.cooldowns where user_id = v_user_id;

  v_cooldown_active := v_cooldown.next_available_at is not null
    and v_cooldown.next_available_at > now();

  return jsonb_build_object(
    'plan', coalesce(v_sub.plan, 'free'),
    'status', coalesce(v_sub.status, 'active'),
    'expires_at', v_sub.expires_at,
    'cooldown_ends_at', case when v_cooldown_active then v_cooldown.next_available_at end,
    'free_seconds_remaining',
      case when v_cooldown_active then 0
           else greatest(180 - coalesce(v_cooldown.free_seconds_used, 0), 0) end
  );
end;
$$;

revoke all on function public.get_user_status() from public;
grant execute on function public.get_user_status() to authenticated;
