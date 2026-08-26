-- Pulvio — premium durumu tek kaynağa indirgeme
--
-- Sorun: 0006'daki get_user_status, plan'ı `coalesce(subscriptions.plan,
-- 'free')` ile HAM döndürüyordu — start_playback'in kullandığı
-- `status = 'active' and (expires_at is null or expires_at > now())`
-- kontrolünü uygulamıyordu. Sonuç: aboneliği iptal/expire olmuş ama
-- EXPIRATION webhook'u düşmüş bir kullanıcı UI'da "premium" görünüyor,
-- start_playback ise onu doğru şekilde free gibi ele alıyordu (UI ile
-- gerçek kısıtlama birbirini tutmuyordu).
--
-- Çözüm: premium testi tek bir is_user_premium(uuid) fonksiyonunda; hem
-- start_playback hem get_user_status onu çağırıyor, bir daha ayrışamaz.
-- playback_heartbeat'e DOKUNULMUYOR — o bilinçli olarak session'a kilitli
-- plan_at_start'ı okur (oturum ortasında abonelik değişimi seansı bozmasın).

-- ---------------------------------------------------------------------------
-- is_user_premium: canlı abonelik satırından "şu an premium mi" — start_playback
-- (0006) ile birebir aynı koşul. Satır yoksa false.
-- ---------------------------------------------------------------------------
create or replace function public.is_user_premium(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.plan = 'premium'
         and coalesce(s.status, 'active') = 'active'
         and (s.expires_at is null or s.expires_at > now())
      from public.subscriptions s
      where s.user_id = p_user_id
    ),
    false
  );
$$;

revoke all on function public.is_user_premium(uuid) from public;
grant execute on function public.is_user_premium(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- start_playback: 0006 ile aynı; tek fark, inline premium testi yerine
-- is_user_premium() çağrısı (davranış birebir korunuyor).
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

  v_is_premium := public.is_user_premium(v_user_id);

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
-- get_user_status: plan artık is_user_premium() ile hesaplanıyor (eskiden
-- ham `coalesce(v_sub.plan, 'free')` idi). status/expires_at ham alanlar
-- olarak payload'da kalıyor (tip sözleşmesi bozulmasın diye).
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
    'plan', case when public.is_user_premium(v_user_id) then 'premium' else 'free' end,
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
