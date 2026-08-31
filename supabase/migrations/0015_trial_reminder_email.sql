-- Pulvio — trial bitiş e-postası
-- send-trial-reminders push bildirimiyle AYNI çalıştırmada bir de e-posta
-- gönderiyor (Resend). Push'un `trial_reminder_sent` bayrağından ayrı bir
-- bayrak: e-posta gönderimi push'tan bağımsız başarısız olabilsin ve bir
-- sonraki cron çalıştırmasında tekrar denenebilsin, push'u yeniden
-- tetiklemeden.
alter table public.subscriptions
  add column if not exists trial_reminder_email_sent boolean not null default false;
