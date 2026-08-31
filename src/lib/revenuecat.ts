import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

// RevenueCat dashboard'daki entitlement kimliği. Client tarafı premium
// çapraz-kontrolü (src/lib/subscription.ts) bunu okur. Dashboard'da farklı
// isimlendirildiyse .env'den override edilir.
export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "premium";

let isConfigured = false;

// Apple Developer hesabı henüz yok, Faz 5 kapsamı Android/Google Play ile
// sınırlı — iOS dalı bilinçli olarak erken dönüyor. İleride iOS eklenirken
// sadece bir EXPO_PUBLIC_REVENUECAT_IOS_API_KEY + bu koşul eklenmesi yeterli,
// mimari iOS'a kapalı değil.
export function configureRevenueCatOnce() {
  if (isConfigured) return;

  if (Platform.OS !== "android") {
    return;
  }

  if (!ANDROID_API_KEY) {
    console.warn("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY tanımlı değil, RevenueCat devre dışı");
    return;
  }

  Purchases.configure({ apiKey: ANDROID_API_KEY });
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  isConfigured = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}

// Re-syncs entitlements from the store for the current app_user_id. The
// backend still decides premium (webhook -> subscriptions), so Settings
// follows this with resolveSubscriptionState() rather than trusting the
// returned CustomerInfo directly.
export async function restorePurchases() {
  return Purchases.restorePurchases();
}

// Has this customer ever held the premium entitlement (active OR expired)?
// The paywall uses it to drop trial framing for a returning subscriber —
// Google Play won't grant the intro offer again, so promising "7 days free"
// would just breed a chargeback. Checks the entitlement specifically, NOT
// "any purchase ever" — an unrelated IAP must not hide the trial. Fails safe
// to `false` (show the trial) when the SDK isn't configured or offline.
export async function hasPriorPurchase(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.all[REVENUECAT_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

// Store-hosted "manage / cancel subscription" page for this exact customer,
// when RevenueCat can provide it (null on the free tier or before any
// purchase — caller falls back to the generic store page).
export async function getManagementUrl(): Promise<string | null> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.managementURL ?? null;
  } catch {
    return null;
  }
}
