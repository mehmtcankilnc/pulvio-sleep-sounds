// Pulvio — Faz 5: RevenueCat webhook handler
// Tek güvenilir abonelik kaynağı burasıdır. Client hiçbir zaman subscriptions
// tablosuna yazamaz (bkz. 0002_rls.sql) — bu fonksiyon service_role ile RLS'i
// bypass ederek yazan tek yerdir. RevenueCat'in kendi Authorization header
// secret'ı ile doğrulanmadan hiçbir istek işlenmez.
//
// Sıralama/idempotency: RevenueCat event'leri sırasız ve birden çok kez
// teslim edilebilir. subscriptions.last_event_ms (0013) her satırda en son
// UYGULANAN event'in event_timestamp_ms'ini tutar; burada yalnızca ondan
// KESİN büyük bir event yazılır. Böylece geç teslim edilen bir CANCELLATION,
// daha yeni bir EXPIRATION'ın üzerine yazamaz (yaşanmış vaka).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { syncSubscriberFromRevenueCat } from "../_shared/revenuecatSync.ts";

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// TRANSFER event'lerini işlemek için gerekli (bir satın alma anonim id'den
// gerçek UUID'ye taşındığında entitlement/expiry event'te GELMEZ — RevenueCat
// API'sinden okumak gerekir). Tanımlı değilse TRANSFER sadece loglanıp geçilir.
const RC_SECRET_API_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY");
const RC_ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID") ?? "premium";

if (!REVENUECAT_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("revenuecat-webhook: eksik ortam değişkeni (secret/url/service-role-key)");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RevenueCatEvent = {
  id: string;
  type: string;
  event_timestamp_ms: number;
  app_user_id: string;
  original_app_user_id?: string | null;
  aliases?: string[] | null;
  expiration_at_ms: number | null;
  period_type: string | null;
  // Yalnızca TRANSFER event'lerinde dolu — satın alma bu id'lere taşındı.
  transferred_to?: string[] | null;
  transferred_from?: string[] | null;
};

type RevenueCatWebhookPayload = {
  api_version: string;
  event: RevenueCatEvent;
};

// Supabase auth.users.id UUID'dir; RevenueCat anonim id'leri ($RCAnonymousID:…)
// asla subscriptions.user_id'e eşlenmez. Event üç yerden id taşıyabilir
// (app_user_id / original_app_user_id / aliases) — hepsinden UUID olanları al.
function candidateUserIds(event: RevenueCatEvent): string[] {
  const raw = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return [...new Set(raw.filter((v): v is string => typeof v === "string" && UUID_RE.test(v)))];
}

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
      // gerçek kesinti ayrı bir EXPIRATION event'iyle gelecek. plan/status'a
      // dokunmuyoruz — "erişim bitti" kararı yalnızca EXPIRATION'ın; burada
      // plan='premium' yeniden yazmak, sıralama guard'ı olsa bile gereksiz
      // bir regresyon yüzeyi. Sadece bilinen expiry'yi güncelliyoruz.
      return { expires_at: expiresAt };

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
  if (!event?.type || !event?.id || typeof event.event_timestamp_ms !== "number") {
    return new Response("Malformed event", { status: 400 });
  }

  // TRANSFER: bir satın alma bir app_user_id'den başkalarına taşındı (tipik
  // olarak $RCAnonymousID:… → gerçek UUID, SDK logIn/alias sonrası). Event
  // entitlement/expiry taşımaz, bu yüzden hedef UUID'ler için RevenueCat
  // API'sinden gerçek durumu okuyup yazıyoruz. Bu, INITIAL_PURCHASE'ı anonim
  // id'de kaçırmış (eşlenemeyen) bir kullanıcının ödediği premium'a kavuşma
  // yolu. Sıralama guard'ı burada yok — sync idempotent ve yalnızca grant eder.
  if (event.type === "TRANSFER") {
    if (!RC_SECRET_API_KEY) {
      console.error("revenuecat-webhook: TRANSFER geldi ama REVENUECAT_SECRET_API_KEY yok", event.id);
      return new Response("TRANSFER ignored (no secret api key)", { status: 200 });
    }
    const targets = [...new Set((event.transferred_to ?? []).filter(
      (v): v is string => typeof v === "string" && UUID_RE.test(v),
    ))];
    if (targets.length === 0) {
      return new Response("TRANSFER: no UUID target", { status: 200 });
    }
    try {
      for (const uuid of targets) {
        const r = await syncSubscriberFromRevenueCat(uuid, supabaseAdmin, {
          secretApiKey: RC_SECRET_API_KEY,
          entitlementId: RC_ENTITLEMENT_ID,
        });
        console.log("revenuecat-webhook: TRANSFER synced", JSON.stringify({ uuid, ...r }));
      }
      return new Response("OK", { status: 200 });
    } catch (e) {
      console.error("revenuecat-webhook: TRANSFER sync failed", e instanceof Error ? e.message : e);
      return new Response("TRANSFER sync failed", { status: 500 });
    }
  }

  const update = resolveUpdate(event);
  if (!update) {
    return new Response("Ignored", { status: 200 });
  }

  const userIds = candidateUserIds(event);
  if (userIds.length === 0) {
    console.error("revenuecat-webhook: event has no UUID user id", event.id, event.app_user_id);
    return new Response("No mappable user id", { status: 200 });
  }

  // Atomik guard: satır yalnızca bu event daha yeniyse (last_event_ms < gelen
  // event_timestamp_ms, ya da hiç yoksa) güncellenir. Eski/sırasız/tekrar
  // event 0 satır etkiler.
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      ...update,
      revenuecat_id: event.app_user_id,
      last_event_ms: event.event_timestamp_ms,
      last_event_id: event.id,
    })
    .in("user_id", userIds)
    .or(`last_event_ms.is.null,last_event_ms.lt.${event.event_timestamp_ms}`)
    .select("user_id");

  if (error) {
    console.error("revenuecat-webhook: subscriptions update failed", error);
    return new Response("DB update failed", { status: 500 });
  }

  if (data && data.length > 0) {
    return new Response("OK", { status: 200 });
  }

  // 0 satır: ya eşleşen abonelik satırı yok ya da bu event bayat/tekrar.
  // Ayrımı yalnızca log/response için yapıyoruz — ikisi de 200 (RevenueCat'in
  // sonsuz retry'ına girmesin; kalıcı durumlar).
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, last_event_ms, last_event_id")
    .in("user_id", userIds)
    .limit(1);

  if (!existing || existing.length === 0) {
    console.error("revenuecat-webhook: no subscriptions row for", userIds);
    return new Response("No subscriptions row", { status: 200 });
  }

  console.log(
    "revenuecat-webhook: stale/duplicate event skipped",
    JSON.stringify({
      event_id: event.id,
      type: event.type,
      event_ms: event.event_timestamp_ms,
      row_last_event_ms: existing[0].last_event_ms,
    })
  );
  return new Response("Stale event, skipped", { status: 200 });
});
