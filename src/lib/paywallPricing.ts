import { Platform } from "react-native";
import type { PurchasesPackage, PurchasesStoreProduct } from "react-native-purchases";

// One ISO-8601 subscription period unit, in days. Good enough for the
// trial-length maths the paywall does — never for billing.
const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

// Months a single billing cycle covers, from the ISO-8601 period string.
function monthsForPeriod(period: string | null | undefined): number | null {
  switch (period) {
    case "P1W": return 12 / 52;
    case "P1M": return 1;
    case "P2M": return 2;
    case "P3M": return 3;
    case "P6M": return 6;
    case "P1Y":
    case "P12M": return 12;
    default: return null;
  }
}

// Months a package's cycle covers — trusts the RevenueCat package type first
// (set from the dashboard), falls back to the product's ISO period.
export function monthsForPackage(pkg: PurchasesPackage): number | null {
  switch (pkg.packageType) {
    case "WEEKLY": return 12 / 52;
    case "MONTHLY": return 1;
    case "TWO_MONTH": return 2;
    case "THREE_MONTH": return 3;
    case "SIX_MONTH": return 6;
    case "ANNUAL": return 12;
    default: return monthsForPeriod(pkg.product.subscriptionPeriod);
  }
}

// Free-trial length in days for a package, so the paywall's timeline never
// claims "Day 7" when the offer says 14 (or 3, or none). Returns 0 when the
// package has no *free* phase.
//
// Two sources: on Google Play a free trial is a zero-price pricing phase on
// the base plan's SubscriptionOption (`introPrice` is usually null there);
// on the App Store / legacy it's a zero-price `introPrice`.
export function trialDaysFor(pkg: PurchasesPackage | null | undefined): number {
  const product = pkg?.product;
  if (!product) return 0;

  const option = product.defaultOption ?? product.subscriptionOptions?.find((o) => o.freePhase);
  const freePhase = option?.freePhase;
  if (freePhase) {
    const cycles = freePhase.billingCycleCount && freePhase.billingCycleCount > 0 ? freePhase.billingCycleCount : 1;
    const unit = UNIT_DAYS[freePhase.billingPeriod.unit] ?? 0;
    const days = freePhase.billingPeriod.value * unit * cycles;
    if (days > 0) return Math.round(days);
  }

  const intro = product.introPrice;
  if (intro && intro.price <= 0) {
    const unit = UNIT_DAYS[intro.periodUnit] ?? 0;
    const cycles = intro.cycles > 0 ? intro.cycles : 1;
    return Math.round(intro.periodNumberOfUnits * unit * cycles);
  }
  return 0;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    // Hermes without full Intl-currency data — a bare number + code still
    // reads and is only ever a secondary "≈ /month" line.
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

// "≈ $1.44 / week" — prefers the store's localized string, falls back to
// dividing the headline price by the period. Used for the weekly plan.
export function pricePerWeek(product: PurchasesStoreProduct): string | null {
  if (product.pricePerWeekString) return product.pricePerWeekString;
  const period = product.subscriptionPeriod;
  const months = monthsForPeriod(period);
  if (!product.price || !months) return null;
  return formatCurrency(product.price / (months * (52 / 12)), product.currencyCode);
}

// "≈ $6.99 / month" — the comparison figure shown on every plan longer than
// a week, so a 3-month or annual price is legible against the monthly one.
export function pricePerMonth(product: PurchasesStoreProduct): string | null {
  if (product.pricePerMonthString) return product.pricePerMonthString;
  const months = monthsForPeriod(product.subscriptionPeriod);
  if (!product.price || !months) return null;
  return formatCurrency(product.price / months, product.currencyCode);
}

// Whole-percent saving of a package's per-month cost vs. the monthly plan.
// null unless the monthly plan is present and this package is genuinely
// cheaper per month — so a "SAVE X%" badge only ever shows a real number.
export function savingsPctVsMonthly(
  pkg: PurchasesPackage,
  monthlyPkg: PurchasesPackage | undefined
): number | null {
  const base = monthlyPkg?.product.price;
  const months = monthsForPackage(pkg);
  if (!base || !months) return null;
  const perMonth = pkg.product.price / months;
  const pct = Math.round((1 - perMonth / base) * 100);
  return pct > 0 && pct < 100 ? pct : null;
}

// The sticker to strike through on a longer plan: what its span would cost
// paid month-by-month ("₺1,299 if you paid monthly"). Real arithmetic on the
// live monthly price — null unless a monthly plan exists and paying monthly
// really is more expensive than this plan.
export function monthlyEquivalentPrice(
  pkg: PurchasesPackage,
  monthlyPkg: PurchasesPackage | undefined
): string | null {
  const base = monthlyPkg?.product.price;
  const months = monthsForPackage(pkg);
  if (!base || !months || months < 2) return null;
  const total = base * months;
  if (total <= pkg.product.price) return null;
  return formatCurrency(total, pkg.product.currencyCode);
}

// How many months of the monthly price a longer plan effectively gives away
// ("annual ≈ 2 months free"). null for sub-monthly plans or no saving.
export function monthsFreeVsMonthly(
  pkg: PurchasesPackage,
  monthlyPkg: PurchasesPackage | undefined
): number | null {
  const base = monthlyPkg?.product.price;
  const months = monthsForPackage(pkg);
  if (!base || !months || months < 2) return null;
  const n = Math.round(months - pkg.product.price / base);
  return n >= 1 ? n : null;
}

export function storeName(): string {
  return Platform.OS === "ios" ? "App Store" : "Google Play";
}
