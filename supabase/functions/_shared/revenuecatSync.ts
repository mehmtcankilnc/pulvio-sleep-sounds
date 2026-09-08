// Pulvio — RevenueCat REST API'den (server-to-server, secret key) bir
// kullanıcının GERÇEK entitlement durumunu okuyup public.subscriptions'a
// yazan ortak yardımcı.
//
// Neden gerekli: INITIAL_PURCHASE webhook'u, satın alma anonim bir RevenueCat
// id'sine ($RCAnonymousID:…) bağlıyken tetiklenebiliyor (SDK'nın logIn/alias
// yarışı). O event'in app_user_id'si UUID olmadığı için webhook onu hiçbir
// subscriptions satırına eşleyemiyor ve kullanıcı ödediği halde free kalıyor.
// Bu yardımcı UUID ile RevenueCat'e SORARAK (alias'lar birleştiği için
// transfer edilmiş satın alma da görünür) durumu düzeltir. Kaynak yine
// server-trusted: RevenueCat'in kendi API'si.

const RC_API = "https://api.revenuecat.com/v1";

type SyncResult = {
  plan: "free" | "premium";
  expiresAt: string | null;
};

// deno-lint-ignore no-explicit-any
type SupabaseAdmin = any;

export async function syncSubscriberFromRevenueCat(
  userId: string,
  supabaseAdmin: SupabaseAdmin,
  opts: { secretApiKey: string; entitlementId: string },
): Promise<SyncResult> {
  const res = await fetch(`${RC_API}/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${opts.secretApiKey}` },
  });

  if (!res.ok) {
    // 404 = RevenueCat bu id'yi hiç görmemiş (satın alma yok) — free.
    if (res.status === 404) return { plan: "free", expiresAt: null };
    throw new Error(`revenuecat api ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const ent = body?.subscriber?.entitlements?.[opts.entitlementId];
  const expiresDate: string | null = ent?.expires_date ?? null;
  const active = Boolean(ent) && (expiresDate === null || new Date(expiresDate) > new Date());

  if (!active) {
    // Burada AKTİF DEĞİL demek "grant yapma" demek — düşürme kararını
    // (premium→expired) yalnızca EXPIRATION webhook'u verir, bu yardımcı asla.
    return { plan: "free", expiresAt: expiresDate };
  }

  // Grant. last_event_ms'e DOKUNMUYORUZ — bu bir event değil; sonradan gelen
  // gerçek bir webhook event'i sıralama guard'ıyla yine uygulanabilsin.
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "premium",
        status: "active",
        expires_at: expiresDate,
        revenuecat_id: userId,
      },
      { onConflict: "user_id" },
    );

  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

  return { plan: "premium", expiresAt: expiresDate };
}
