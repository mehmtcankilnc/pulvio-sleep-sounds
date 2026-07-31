// Pulvio — Faz 5: RevenueCat webhook handler
// Tek güvenilir abonelik kaynağı burasıdır. Client hiçbir zaman subscriptions
// tablosuna yazamaz (bkz. 0002_rls.sql) — bu fonksiyon service_role ile RLS'i
// bypass ederek yazan tek yerdir. RevenueCat'in kendi Authorization header
// secret'ı ile doğrulanmadan hiçbir istek işlenmez.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!REVENUECAT_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("revenuecat-webhook: eksik ortam değişkeni (secret/url/service-role-key)");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type RevenueCatEvent = {
  type: string;
  app_user_id: string;
  expiration_at_ms: number | null;
  period_type: string | null;
};

type RevenueCatWebhookPayload = {
  api_version: string;
  event: RevenueCatEvent;
};

// plan/status kararı: yalnızca 'active' ve 'expired' kullanılıyor. start_playback
// RPC'si premium'u `status = 'active' and (expires_at is null or expires_at > now())`
// ile kontrol ediyor — bu yüzden BILLING_ISSUE'da status'u DEĞİŞTİRMİYORUZ:
// RevenueCat/Google Play kendi grace period'unu expires_at üzerinden yönetiyor,
// biz sadece expires_at'i güncel tutuyoruz. Erişim grace period boyunca devam eder.
// period_type ("TRIAL" | "NORMAL" | "INTRO") Faz 7'de send-trial-reminders'ın
// trial kullanıcılarını normal yenilemeden ayırt etmesi için ekli — trial'dan
// normale geçildiğinde (RENEWAL/PRODUCT_CHANGE) trial_reminder_sent sıfırlanır,
// aksi halde aynı kullanıcı gerçek abone olduktan sonra bile "trial bitiyor"
// hatırlatması tetiklemeye devam edebilirdi.
function resolveUpdate(event: RevenueCatEvent): Record<string, unknown> | null {
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
  const periodType = event.period_type ? event.period_type.toLowerCase() : null;

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return {
        plan: "premium",
        status: "active",
        expires_at: expiresAt,
        period_type: periodType,
        trial_reminder_sent: false,
      };

    case "CANCELLATION":
      // Otomatik yenileme kapatıldı ama dönem sonuna kadar erişim devam eder;
      // gerçek kesinti ayrı bir EXPIRATION event'iyle gelecek.
      return { plan: "premium", status: "active", expires_at: expiresAt };

    case "BILLING_ISSUE":
      return { expires_at: expiresAt };

    case "EXPIRATION":
      return { plan: "free", status: "expired", expires_at: expiresAt };

    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== REVENUECAT_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: RevenueCatWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = payload?.event;
  if (!event?.app_user_id || !event?.type) {
    return new Response("Malformed event", { status: 400 });
  }

  const update = resolveUpdate(event);
  if (!update) {
    return new Response("Ignored", { status: 200 });
  }

  // app_user_id, client'ta Purchases.logIn(supabaseUserId) ile Supabase
  // auth.users.id olarak set edildiği için doğrudan subscriptions.user_id'e
  // eşlenir (bkz. useRevenueCatSync hook'u).
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({ ...update, revenuecat_id: event.app_user_id })
    .eq("user_id", event.app_user_id)
    .select("user_id");

  if (error) {
    console.error("revenuecat-webhook: subscriptions update failed", error);
    return new Response("DB update failed", { status: 500 });
  }

  if (!data || data.length === 0) {
    console.warn("revenuecat-webhook: no subscriptions row for user_id", event.app_user_id);
  }

  return new Response("OK", { status: 200 });
});
