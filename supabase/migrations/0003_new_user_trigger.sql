-- Pulvio — Faz 2: yeni kullanıcı için otomatik subscriptions + cooldowns satırı
-- Client'a bu tablolara hiç INSERT hakkı verilmiyor (bkz. 0002_rls.sql); tek
-- yazma yolu bu trigger'dır, security definer ile RLS'i bypass eder.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  insert into public.cooldowns (user_id, last_free_play_at, next_available_at)
  values (new.id, null, null);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
