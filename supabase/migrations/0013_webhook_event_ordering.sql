-- Pulvio — RevenueCat webhook: sıralama + idempotency guard
--
-- Sorun: webhook handler (0005) son TESLİM edilen event'i körlemesine
-- subscriptions'a yazıyordu. RevenueCat event'leri sırasız ve birden çok kez
-- teslim edilebilir. Gerçek vaka: CANCELLATION (event_timestamp_ms
-- ...656006) ve EXPIRATION (...656026) 20 ms arayla üretildi; EXPIRATION
-- önce, CANCELLATION sonra işlendi → CANCELLATION çıktısı
-- (plan=premium/status=active) doğru EXPIRATION sonucunun
-- (plan=free/status=expired) üzerine yazdı, kullanıcı UI'da premium'da kaldı.
--
-- Çözüm: her satırda en son UYGULANAN event'in zaman damgası + id'si tutulur.
-- Handler yalnızca daha yeni (event_timestamp_ms > last_event_ms) event'leri
-- uygular; eski/sırasız/tekrar event'ler 0 satır etkiler ve yok sayılır.

alter table public.subscriptions
  add column if not exists last_event_ms bigint,
  add column if not exists last_event_id text;

comment on column public.subscriptions.last_event_ms is
  'RevenueCat event_timestamp_ms of the most recently APPLIED webhook event. Handler ignores events with a smaller-or-equal value (out-of-order / duplicate delivery).';
