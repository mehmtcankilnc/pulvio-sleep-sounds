// Pulvio — Faz 7: trial bitiş hatırlatması
// Supabase'in zamanlanmış (cron) Edge Function özelliğiyle SAATTE BİR
// çağrılır (günde bir değil — bkz. aşağıdaki timezone notu). Trial'ı önümüzdeki
// ~36 saat içinde bitecek, henüz hatırlatma gönderilmemiş kullanıcıları bulur;
// her kullanıcı için push_tokens.timezone'a göre YEREL saat TARGET_LOCAL_HOUR'a
// denk gelen tek çalıştırmada bildirim gönderir — böylece tek bir sabit UTC
// saati yerine her kullanıcı kendi yerel sabahında (ör. 09:00) bildirimi alır.
// Yalnızca CRON_SECRET header'ıyla gelen istekler kabul edilir —
// revenuecat-webhook'taki aynı desen (bkz. o dosyadaki not).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sendExpoPushNotifications } from "../_shared/expoPush.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("send-trial-reminders: eksik ortam değişkeni (secret/url/service-role-key)");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Şu an kullanıcı dilini sunucu tarafında bilmiyoruz (dil tercihi sadece
// cihazda, bkz. src/lib/i18n.ts) — MVP için bildirim metni İngilizce sabit.
// İleride push_tokens'a bir language kolonu eklenirse buradan okunabilir.
const NOTIFICATION_TITLE = "Your free trial ends tomorrow";
const NOTIFICATION_BODY = "Keep unlimited sleep sounds by staying on Pulvio Premium.";

const TARGET_LOCAL_HOUR = 9;
const CANDIDATE_WINDOW_MS = 36 * 60 * 60 * 1000;

function localHourFor(timezone: string | null): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone ?? "UTC",
      }).format(new Date())
    );
  } catch {
    // Geçersiz/bilinmeyen IANA timezone string'i — UTC'ye düş.
    return new Date().getUTCHours();
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: candidates, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("plan", "premium")
    .eq("status", "active")
    .eq("period_type", "trial")
    .eq("trial_reminder_sent", false)
    .not("expires_at", "is", null)
    .gt("expires_at", new Date().toISOString())
    .lte("expires_at", new Date(Date.now() + CANDIDATE_WINDOW_MS).toISOString());

  if (error) {
    console.error("send-trial-reminders: query failed", error);
    return new Response("Query failed", { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return new Response("No candidates", { status: 200 });
  }

  // subscriptions ve push_tokens arasında FK yok (ikisi de ayrı ayrı
  // auth.users'a referans veriyor), bu yüzden PostgREST embed yerine ayrı
  // bir sorguyla token'ları çekip JS tarafında eşliyoruz.
  const userIds = candidates.map((row) => row.user_id);
  const { data: tokenRows, error: tokenError } = await supabaseAdmin
    .from("push_tokens")
    .select("user_id, expo_push_token, timezone")
    .in("user_id", userIds);

  if (tokenError) {
    console.error("send-trial-reminders: token query failed", tokenError);
    return new Response("Token query failed", { status: 500 });
  }

  // Yalnızca şu anki saat, kullanıcının kendi saat diliminde
  // TARGET_LOCAL_HOUR'a denk gelenler bu çalıştırmada gönderilir — diğerleri
  // trial_reminder_sent=false kalır, kendi yerel saatlerine denk gelen bir
  // sonraki saatlik çalıştırmada (hâlâ 36 saatlik pencerede oldukları sürece)
  // yakalanırlar.
  const dueNow = (tokenRows ?? []).filter((row) => localHourFor(row.timezone) === TARGET_LOCAL_HOUR);

  const messages = dueNow.map((row) => ({
    to: row.expo_push_token,
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
  }));

  if (messages.length > 0) {
    await sendExpoPushNotifications(messages);
  }

  if (dueNow.length > 0) {
    const dueUserIds = dueNow.map((row) => row.user_id);
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ trial_reminder_sent: true })
      .in("user_id", dueUserIds);

    if (updateError) {
      console.error("send-trial-reminders: flag update failed", updateError);
      return new Response("Flag update failed", { status: 500 });
    }
  }

  return new Response(
    `Sent ${messages.length} of ${candidates.length} candidates (${tokenRows?.length ?? 0} had tokens)`,
    { status: 200 }
  );
});
