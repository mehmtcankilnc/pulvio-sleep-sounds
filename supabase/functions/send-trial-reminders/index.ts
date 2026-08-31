// Pulvio — Faz 7: trial bitiş hatırlatması
// Supabase'in zamanlanmış (cron) Edge Function özelliğiyle SAATTE BİR
// çağrılır (günde bir değil — bkz. aşağıdaki timezone notu). Trial'ı önümüzdeki
// ~36 saat içinde bitecek, henüz hatırlatma gönderilmemiş kullanıcıları bulur;
// her kullanıcı için push_tokens.timezone'a göre YEREL saat TARGET_LOCAL_HOUR'a
// denk gelen tek çalıştırmada bildirim gönderir — böylece tek bir sabit UTC
// saati yerine her kullanıcı kendi yerel sabahında (ör. 09:00) bildirimi alır.
// Yalnızca CRON_SECRET header'ıyla gelen istekler kabul edilir —
// revenuecat-webhook'taki aynı desen (bkz. o dosyadaki not).
//
// AYNI çalıştırmada hem Expo push (trial_reminder_sent) hem de bir e-posta
// (trial_reminder_email_sent, Resend) gönderilir — ikisi ayrı bayrak, biri
// diğerini beklemeden başarısız olup bir sonraki turda tekrar denenebilsin.
// Paywall zaman çizelgesindeki "hatırlatma" adımı bu ana denk gelecek şekilde
// ayarlı (reminderDay = trialDays - 1).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sendExpoPushNotifications } from "../_shared/expoPush.ts";
import { emailConfigured, sendEmails } from "../_shared/email.ts";
import type { EmailMessage } from "../_shared/email.ts";

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
// cihazda, bkz. src/lib/i18n.ts) — bildirim ve e-posta metni İngilizce sabit.
// İleride push_tokens'a bir language kolonu eklenirse buradan okunabilir.
const NOTIFICATION_TITLE = "Your free trial ends tomorrow";
const NOTIFICATION_BODY = "Keep unlimited sleep sounds by staying on Pulvio Premium.";

const EMAIL_SUBJECT = "Your Pulvio free trial ends tomorrow";
const EMAIL_TEXT = [
  "Your Pulvio free trial ends tomorrow.",
  "",
  "No action needed to keep going — your subscription continues automatically and you keep the full library, custom mixes, and bedtime reminders.",
  "",
  "Changed your mind? You can cancel anytime before the trial ends in Google Play (Subscriptions), and you won't be charged.",
  "",
  "— The Pulvio team",
].join("\n");
const EMAIL_HTML = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.55;color:#1a1118;">
    <p><strong>Your Pulvio free trial ends tomorrow.</strong></p>
    <p>No action needed to keep going — your subscription continues automatically and you keep the full library, custom mixes, and bedtime reminders.</p>
    <p>Changed your mind? You can cancel anytime before the trial ends in Google&nbsp;Play (Subscriptions), and you won't be charged.</p>
    <p style="color:#85716f;">— The Pulvio team</p>
  </div>
`;

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

type CandidateFlags = { push: boolean; email: boolean };

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Push VEYA e-posta henüz gönderilmemiş, trial'ı 36 saat içinde bitecek
  // herkes aday — hangi kanalın gönderileceği aşağıda bayrağa göre ayrışır.
  const { data: candidates, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, trial_reminder_sent, trial_reminder_email_sent")
    .eq("plan", "premium")
    .eq("status", "active")
    .eq("period_type", "trial")
    .or("trial_reminder_sent.eq.false,trial_reminder_email_sent.eq.false")
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

  const flagsByUser = new Map<string, CandidateFlags>(
    candidates.map((row) => [
      row.user_id,
      { push: !row.trial_reminder_sent, email: !row.trial_reminder_email_sent },
    ])
  );

  // subscriptions ve push_tokens arasında FK yok (ikisi de ayrı ayrı
  // auth.users'a referans veriyor), bu yüzden PostgREST embed yerine ayrı
  // bir sorguyla token'ları çekip JS tarafında eşliyoruz. timezone da
  // yalnızca burada tutuluyor — push token'ı olmayan kullanıcının yerel
  // saatini bilemediğimiz için (e-posta dahil) bu turda ona ulaşamıyoruz.
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
  // bayrakları false kalır, kendi yerel saatlerine denk gelen bir sonraki
  // saatlik çalıştırmada (hâlâ 36 saatlik pencerede oldukları sürece)
  // yakalanırlar.
  const dueNow = (tokenRows ?? []).filter((row) => localHourFor(row.timezone) === TARGET_LOCAL_HOUR);

  // --- Push ---
  const pushRows = dueNow.filter((row) => flagsByUser.get(row.user_id)?.push);
  const messages = pushRows.map((row) => ({
    to: row.expo_push_token,
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
  }));

  if (messages.length > 0) {
    await sendExpoPushNotifications(messages);
    const pushUserIds = pushRows.map((row) => row.user_id);
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ trial_reminder_sent: true })
      .in("user_id", pushUserIds);
    if (updateError) {
      console.error("send-trial-reminders: push flag update failed", updateError);
      return new Response("Push flag update failed", { status: 500 });
    }
  }

  // --- E-posta (push ile aynı an) ---
  // Kullanıcının e-postası auth.users'da; PostgREST bu şemayı dışa açmadığı
  // için GoTrue admin API'siyle tek tek çekiliyor. Bir cron turunda yerel
  // 09:00'a denk gelen aday sayısı tek haneli olur, N çağrı sorun değil.
  let emailsSent = 0;
  const emailUserIds = dueNow
    .filter((row) => flagsByUser.get(row.user_id)?.email)
    .map((row) => row.user_id);

  if (emailUserIds.length > 0 && emailConfigured()) {
    const emailMessages: EmailMessage[] = [];
    const emailedIds: string[] = [];

    for (const userId of emailUserIds) {
      const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      const address = data?.user?.email;
      if (userError || !address) {
        console.error("send-trial-reminders: user lookup failed", userId, userError);
        continue;
      }
      emailMessages.push({
        to: address,
        subject: EMAIL_SUBJECT,
        html: EMAIL_HTML,
        text: EMAIL_TEXT,
      });
      emailedIds.push(userId);
    }

    if (emailMessages.length > 0) {
      await sendEmails(emailMessages);
      emailsSent = emailMessages.length;
      const { error: emailFlagError } = await supabaseAdmin
        .from("subscriptions")
        .update({ trial_reminder_email_sent: true })
        .in("user_id", emailedIds);
      if (emailFlagError) {
        console.error("send-trial-reminders: email flag update failed", emailFlagError);
      }
    }
  }

  return new Response(
    `Sent ${messages.length} push + ${emailsSent} email of ${candidates.length} candidates (${tokenRows?.length ?? 0} had tokens)`,
    { status: 200 }
  );
});
