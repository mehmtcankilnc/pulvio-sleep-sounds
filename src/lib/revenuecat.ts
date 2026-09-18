import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchasesOffering, PurchasesPackage, PurchasesStoreProduct } from "react-native-purchases";
import { formatCurrency } from "./paywallPricing";

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

// Screenshot-only escape hatch: App Store Connect's subscription review
// screenshot is a chicken-and-egg requirement — it won't leave "Missing
// Metadata" without one, but StoreKit won't resolve real prices for a
// product that isn't Ready to Submit yet (and a fresh CI simulator has no
// Sandbox Apple ID either way). Apple doesn't require this particular
// screenshot to show live pricing, just what the purchase screen looks like,
// so EXPO_PUBLIC_MOCK_PAYWALL_OFFERING=1 substitutes a realistic offering
// (real prices, no live StoreKit/RevenueCat calls) when the real one is
// unavailable. Never set outside the `screenshots` EAS profile.
export const mockPaywallOfferingEnabled =
  process.env.EXPO_PUBLIC_MOCK_PAYWALL_OFFERING === "1";

function mockProduct(
  price: number,
  subscriptionPeriod: string,
  introPrice: PurchasesStoreProduct["introPrice"] = null,
): PurchasesStoreProduct {
  return {
    identifier: `mock_${subscriptionPeriod}`,
    description: "",
    title: "",
    price,
    priceString: formatCurrency(price, "USD"),
    currencyCode: "USD",
    subscriptionPeriod,
    introPrice,
    discounts: null,
    productCategory: "SUBSCRIPTION",
    productType: "AUTO_RENEWABLE_SUBSCRIPTION",
    defaultOption: null,
    subscriptionOptions: null,
    presentedOfferingIdentifier: "default",
    presentedOfferingContext: { offeringIdentifier: "default", placementIdentifier: null, targetingContext: null },
  } as unknown as PurchasesStoreProduct;
}

function mockPackage(
  identifier: string,
  packageType: string,
  price: number,
  subscriptionPeriod: string,
  introPrice: PurchasesStoreProduct["introPrice"] = null,
): PurchasesPackage {
  return {
    identifier,
    packageType,
    product: mockProduct(price, subscriptionPeriod, introPrice),
    offeringIdentifier: "default",
    presentedOfferingContext: { offeringIdentifier: "default", placementIdentifier: null, targetingContext: null },
  } as unknown as PurchasesPackage;
}

export function getMockOffering(): PurchasesOffering {
  const weekly = mockPackage("$rc_weekly", "WEEKLY", 2.99, "P1W");
  const monthly = mockPackage("$rc_monthly", "MONTHLY", 4.99, "P1M");
  const threeMonth = mockPackage("$rc_three_month", "THREE_MONTH", 13.99, "P3M", {
    price: 0,
    priceString: formatCurrency(0, "USD"),
    period: "P1W",
    periodUnit: "WEEK",
    periodNumberOfUnits: 1,
    cycles: 1,
  } as unknown as PurchasesStoreProduct["introPrice"]);
  const annual = mockPackage("$rc_annual", "ANNUAL", 49.99, "P1Y");
  const availablePackages = [weekly, monthly, threeMonth, annual];

  return {
    identifier: "default",
    serverDescription: "Mock offering (EXPO_PUBLIC_MOCK_PAYWALL_OFFERING=1)",
    metadata: { primary: ["$rc_annual", "$rc_three_month"] },
    availablePackages,
    lifetime: null,
    annual,
    sixMonth: null,
    threeMonth,
    twoMonth: null,
    monthly,
    weekly,
  } as unknown as PurchasesOffering;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (purchasesDisabled || !isConfigured) {
    return mockPaywallOfferingEnabled ? getMockOffering() : null;
  }
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? (mockPaywallOfferingEnabled ? getMockOffering() : null);
  } catch (e) {
    // StoreKit can throw outright (unresolvable products, no Sandbox Apple
    // ID) rather than just returning a null `current` — the mock fallback
    // needs to catch that path too, not just the empty-offering one above.
    if (mockPaywallOfferingEnabled) return getMockOffering();
    throw e;
  }
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
