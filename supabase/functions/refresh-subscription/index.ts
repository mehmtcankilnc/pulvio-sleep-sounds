// Pulvio — abonelik durumunu RevenueCat'ten zorla yeniden senkronize et.
// Client bunu satın alma sonrası (webhook gecikirse / hiç düşmezse) ve
// Ayarlar'daki "Satın alımları geri yükle" akışında çağırır. İsteği yapanın
// KENDİ JWT'sinden user_id alınır — body'den değil — böylece kimse başkasının
// aboneliğini tetikleyemez. Gerçek karar RevenueCat REST API'sinden gelir
// (bkz. _shared/revenuecatSync.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { syncSubscriberFromRevenueCat } from "../_shared/revenuecatSync.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RC_SECRET_API_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY");
const RC_ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID") ?? "premium";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !RC_SECRET_API_KEY) {
  throw new Error("refresh-subscription: eksik ortam değişkeni (url/anon/service-role/rc-secret)");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser();
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const result = await syncSubscriberFromRevenueCat(userData.user.id, supabaseAdmin, {
      secretApiKey: RC_SECRET_API_KEY,
      entitlementId: RC_ENTITLEMENT_ID,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("refresh-subscription:", e instanceof Error ? e.message : e);
    return new Response("Sync failed", { status: 502 });
  }
});
