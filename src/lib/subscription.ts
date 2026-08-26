import Purchases from "react-native-purchases";
import { fetchUserStatus } from "./playback";
import { REVENUECAT_ENTITLEMENT_ID } from "./revenuecat";

export type SubscriptionState = {
  plan: "free" | "premium";
  cooldownEndsAt: string | null;
};

// Uygulamanın "bu kullanıcı ŞU AN premium mi" sorusunu UI için çözdüğü tek
// yer. Backend (get_user_status RPC) premium VERME konusunda tek yetkili
// kaynaktır — buradaki RevenueCat çapraz-kontrolü SADECE aşağı çekebilir
// (premium -> free), asla yukarı çıkaramaz (PRODUCT.md: entitlement
// server-trusted). Amaç: aboneliği iptal/expire olmuş ama EXPIRATION
// webhook'u düşmüş bir kullanıcının subscriptions satırı bayat kaldığında
// UI'ın "premium" demeye devam etmesini önlemek.
export async function resolveSubscriptionState(): Promise<SubscriptionState | null> {
  const status = await fetchUserStatus();
  if (!status) return null;

  let plan = status.plan;

  if (plan === "premium") {
    try {
      const info = await Purchases.getCustomerInfo();
      if (!info.entitlements.active[REVENUECAT_ENTITLEMENT_ID]) {
        plan = "free";
      }
    } catch {
      // SDK yapılandırılmamış (iOS / eksik key) ya da cihaz çevrimdışı —
      // tahmin yürütmek yerine backend'in cevabını olduğu gibi bırak.
    }
  }

  return { plan, cooldownEndsAt: status.cooldown_ends_at };
}
