import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

// Dev escape hatch for emulators without Google Play Billing: the SDK logs a
// red `BILLING_UNAVAILABLE` on every configure/logIn there. Set
// EXPO_PUBLIC_DISABLE_PURCHASES=1 in .env to skip RevenueCat entirely — the
// paywall then just shows its "couldn't load" state. Never set in production.
export const purchasesDisabled = process.env.EXPO_PUBLIC_DISABLE_PURCHASES === "1";

// RevenueCat dashboard'daki entitlement kimliği. Client tarafı premium
// çapraz-kontrolü (src/lib/subscription.ts) bunu okur. Dashboard'da farklı
// isimlendirildiyse .env'den override edilir.
export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "premium";

let isConfigured = false;

export function configureRevenueCatOnce() {
  if (isConfigured) return;

  if (purchasesDisabled) {
    console.warn("EXPO_PUBLIC_DISABLE_PURCHASES=1, RevenueCat devre dışı");
    return;
  }

  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return;
  }

  const apiKey = Platform.OS === "ios" ? IOS_API_KEY : ANDROID_API_KEY;
  const missingKeyEnvVar =
    Platform.OS === "ios"
      ? "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
      : "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY";

  if (!apiKey) {
    console.warn(`${missingKeyEnvVar} tanımlı değil, RevenueCat devre dışı`);
    return;
  }

  Purchases.configure({ apiKey });
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  isConfigured = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (purchasesDisabled || !isConfigured) return null;
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
