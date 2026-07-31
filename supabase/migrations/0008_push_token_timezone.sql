-- Pulvio — Faz 7 düzeltme: push_tokens'a IANA timezone kolonu.
-- send-trial-reminders artık tek bir UTC saatine göre değil, her kullanıcının
-- kendi yerel sabahına göre gönderim yapıyor (bkz. o fonksiyondaki not).
alter table public.push_tokens
  add column if not exists timezone text;
