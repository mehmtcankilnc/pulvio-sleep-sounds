import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  hasPriorPurchase,
} from "../src/lib/revenuecat";
import { resolveSubscriptionState } from "../src/lib/subscription";
import {
  formatCurrency,
  monthlyEquivalentPrice,
  monthsFreeVsMonthly,
  pricePerMonth,
  pricePerWeek,
  savingsPctVsMonthly,
  storeName,
  trialDaysFor,
} from "../src/lib/paywallPricing";
import {
  LEGAL_LINKS_READY,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  openExternalUrl,
} from "../src/lib/links";
import { useUserStore } from "../src/store/useUserStore";
import { usePlayerStore } from "../src/store/usePlayerStore";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { GlowBackground } from "../src/components/GlowBackground";
import { Testimonials } from "../src/components/PaywallTestimonials";
import {
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  MoonIcon,
  TimerIcon,
  XIcon,
} from "../src/components/icons";

const BENEFIT_KEYS = [
  "benefitMixes",
  "benefitLibrary",
  "benefitFadeOut",
  "benefitNewSounds",
] as const;

// PLACEHOLDER reviews so the section can be designed — REPLACE with real,
// attributable App Store / Play quotes (or a localized feed) before launch.
// Empty this array and the whole testimonials block stops rendering.
// PRODUCT.md principle 1: no invented social proof ships.
const TESTIMONIALS: { quote: string; author: string }[] = [
  {
    quote:
      "Zamanlayıcı bitmeden uyuyakalıyorum artık. İlk kez bir uygulama işe yaradı.",
    author: "Elif · App Store",
  },
  {
    quote: "Gece 3'te uyanınca açıyorum, 10 dakikada geri dalıyorum.",
    author: "Deniz · Google Play",
  },
  {
    quote: "Sesler gerçekten kaliteli, döngü fark edilmiyor. Buna değer.",
    author: "Mert · App Store",
  },
];

// Which packages get the two prominent cards; the rest go behind "Show other
// plans". Driven by the RevenueCat offering's `metadata.primary` (an array of
// package identifiers) so merchandising can change without an app update —
// falls back to "the plan with a free trial + the annual plan" when unset.
function partitionPackages(offering: PurchasesOffering | null): {
  primary: PurchasesPackage[];
  other: PurchasesPackage[];
} {
  const all = offering?.availablePackages ?? [];
  if (all.length === 0) return { primary: [], other: [] };

  const metaPrimary = offering?.metadata?.primary;
  const ids = Array.isArray(metaPrimary)
    ? metaPrimary.filter((v): v is string => typeof v === "string")
    : [];

  let primary = ids.length
    ? ids
        .map((id) => all.find((p) => p.identifier === id))
        .filter((p): p is PurchasesPackage => !!p)
    : [];

  if (primary.length === 0) {
    // Sensible default merchandising: annual first (the pushed plan), then
    // the 3-month.
    primary = [offering?.annual, offering?.threeMonth].filter(
      (p): p is PurchasesPackage => !!p,
    );
  }
  // De-dupe and guarantee at least two cards when that many exist.
  primary = Array.from(new Set(primary));
  for (const p of all) {
    if (primary.length >= 2) break;
    if (!primary.includes(p)) primary.push(p);
  }

  // Annual always sits first among the primary cards — it's the default
  // selection (primary[0]) and the top position, regardless of the order
  // dashboard metadata happened to list.
  primary.sort((a, b) => Number(b.packageType === "ANNUAL") - Number(a.packageType === "ANNUAL"));

  const other = all.filter((p) => !primary.includes(p));
  return { primary, other };
}

export default function PaywallScreen() {
  const { t, i18n } = useTranslation("paywall");
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const setSubscriptionStatus = useUserStore(
    (state) => state.setSubscriptionStatus,
  );
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const { retryLast } = usePlayerActions();
  // Only Now Playing opens the paywall with `?resume=1` (from its cooldown /
  // premium lockout). Reached any other way — Profile, Explore, onboarding —
  // a successful purchase must NOT start playback, because there is no player
  // on screen to control it.
  //
  // `?from=onboarding` is the pre-auth funnel step: the user has no account
  // yet, so every exit (skip OR purchase) leads to signup, where
  // Purchases.logIn() attaches any anonymous purchase to the new account.
  const { resume, from } = useLocalSearchParams<{
    resume?: string;
    from?: string;
  }>();
  const shouldResume = resume === "1";
  const fromOnboarding = from === "onboarding";
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A benign outcome, not a failure (e.g. restore found nothing) — shown in
  // `notice` amber next to the CTA, never the alarming `danger` red.
  const [notice, setNotice] = useState<string | null>(null);
  // True only while the post-purchase entitlement poll is running, so the CTA
  // spinner gets an explanatory line instead of looking hung for ~7.5s.
  const [confirming, setConfirming] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);
  // A store account that has bought before won't be re-granted the intro
  // offer, so the trial timeline + "free" CTA are swapped for plain
  // subscribe copy. Starts false (assume eligible) until the check resolves.
  const [priorPurchase, setPriorPurchase] = useState(false);
  // The entitlement poll runs for up to ~7.5s after purchasePackage resolves.
  // If the user dismisses the paywall in that window, a late "premium"
  // result must NOT yank them back / auto-play a track they walked away from.
  const dismissed = useRef(false);

  function dismiss() {
    dismissed.current = true;
    if (fromOnboarding) {
      router.replace("/(auth)/signup");
      return;
    }
    router.back();
  }

  // Named so the load-failure state can offer a real retry instead of a
  // dead-end "no subscription" message.
  const loadOffering = useCallback(() => {
    setLoading(true);
    setError(null);
    getCurrentOffering()
      .then(setOffering)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadOffering();
    hasPriorPurchase().then(setPriorPurchase);
  }, [loadOffering]);

  const { primary, other } = useMemo(
    () => partitionPackages(offering),
    [offering],
  );

  // Default selection = the first primary card (per the pricing decision),
  // so the CTA opens on the trial plan and reads "Start my free trial".
  useEffect(() => {
    if (!offering) return;
    setSelectedId(
      (prev) =>
        prev ??
        primary[0]?.identifier ??
        offering.availablePackages[0]?.identifier ??
        null,
    );
  }, [offering, primary]);

  const allPackages = offering?.availablePackages ?? [];
  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.identifier === selectedId) ?? null,
    [allPackages, selectedId],
  );
  // Typed accessor — `/month/i` would also match `$rc_three_month` and throw
  // every savings % off (the three-month plan became the "monthly" baseline).
  const monthlyPackage = offering?.monthly ?? undefined;

  // Trial length comes from the selected package's real free phase, not a
  // constant — see paywallPricing.trialDaysFor.
  const trialDays = trialDaysFor(selectedPackage);
  const trialActive = trialDays > 0 && !priorPurchase;

  // The reminder (push + email, send-trial-reminders) fires ~1 day before the
  // trial ends, so the timeline's middle step names that day, not "day 5".
  const reminderDay = Math.max(1, trialDays - 1);
  const store = storeName();

  const title = shouldResume
    ? t("titleResume")
    : trialActive
      ? t("title", { days: trialDays })
      : t("titleNoTrial");
  // Trial CTA leads with "nothing due today" in the user's own currency —
  // the timeline already carries the day count, so the button reinforces the
  // zero-payment reassurance instead of repeating "7-day".
  // formatCurrency falls back to "0.00 TRY" on a Hermes build without full
  // Intl-currency data — no good in a CTA, so only use it when it produced a
  // real symbol (no bare 3-letter code).
  const zeroRaw = selectedPackage ? formatCurrency(0, selectedPackage.product.currencyCode) : null;
  const zeroToday = zeroRaw && !/[A-Za-z]{3}/.test(zeroRaw) ? zeroRaw : null;
  const ctaLabel = trialActive
    ? zeroToday
      ? t("startTrialCtaZero", { amount: zeroToday })
      : t("startTrialCta", { days: trialDays })
    : t("subscribeCta");
  const chargeHint = trialActive
    ? t("noChargeHint", { store })
    : t("noChargeHintNoTrial", { store });

  // Applied identically after a fresh purchase and after a restore: flip the
  // stores to premium, clear any cooldown/deny state, and only resume/pop if
  // Now Playing sent us here and the user hasn't already walked away.
  function applyPremiumAndExit() {
    setSubscriptionStatus("premium");
    setCooldownEndsAt(null);
    usePlayerStore.getState().setDenyReason(null);
    usePlayerStore.getState().setError(null);
    const resumeNow = shouldResume && !dismissed.current;
    if (resumeNow) {
      // Flip the player into its loading state BEFORE popping, so it never
      // renders the empty branch behind the dismissing modal.
      usePlayerStore.getState().setStartingPlayback(true);
    }
    if (!dismissed.current) router.back();
    if (resumeNow) retryLast();
  }

  async function handlePurchase() {
    if (!selectedPackage) return;
    setPurchasing(true);
    setError(null);
    setNotice(null);
    try {
      await purchasePackage(selectedPackage);

      if (fromOnboarding) {
        // Anonymous purchase — the entitlement is confirmed after signup,
        // when Purchases.logIn() aliases it to the real account and the
        // backend webhook lands. Polling an anonymous user's status here
        // would just time out.
        router.replace("/(auth)/signup");
        return;
      }

      setConfirming(true);
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const state = await resolveSubscriptionState();
        if (state?.plan === "premium") {
          applyPremiumAndExit();
          return;
        }
      }

      Alert.alert(t("purchaseReceivedTitle"), t("purchaseReceivedMessage"), [
        { text: t("common:ok"), onPress: () => router.back() },
      ]);
    } catch (err) {
      // A deliberate cancel (RevenueCat's `userCancelled`) is not something to
      // tell the user about. Anything else gets ONE localized line — the store
      // SDK's own `err.message` is frequently English and not user-facing.
      if (
        err &&
        typeof err === "object" &&
        "userCancelled" in err &&
        (err as { userCancelled?: boolean }).userCancelled
      ) {
        return;
      }
      setError(t("purchaseFailed"));
    } finally {
      setConfirming(false);
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (restoring || purchasing) return;
    setRestoring(true);
    setError(null);
    setNotice(null);
    try {
      await restorePurchases();

      if (fromOnboarding) {
        // No account yet to attach an entitlement to — the restore aliases
        // on signup, same as an anonymous purchase does.
        router.replace("/(auth)/signup");
        return;
      }

      const state = await resolveSubscriptionState();
      if (state?.plan === "premium") {
        applyPremiumAndExit();
        return;
      }
      // Not a failure — nothing to restore is a normal answer.
      setNotice(t("restoreNone"));
    } catch {
      setError(t("restoreFailed"));
    } finally {
      setRestoring(false);
    }
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  if (!offering || allPackages.length === 0) {
    // `error` here is the load failure (t("loadError")); no error = a genuine
    // empty offering. Either way the user gets a retry and a way out, never a
    // dead-end message.
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: colors.bg, gap: 16 }}
      >
        <Text
          style={{ color: colors.text, textAlign: "center", fontSize: 15 }}
        >
          {error ?? t("empty")}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={loadOffering}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 20,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.stroke,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
                fontSize: 13.5,
              }}
            >
              {t("common:retry")}
            </Text>
          </Pressable>
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 20,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.muted,
                fontWeight: "600",
                fontSize: 13.5,
              }}
            >
              {t("common:close")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const trialSteps = [
    {
      icon: MoonIcon,
      title: t("trialTodayTitle"),
      subtitle: t("trialTodaySubtitle"),
    },
    {
      icon: BellIcon,
      title: t("trialReminderTitle", { day: reminderDay }),
      subtitle: t("trialReminderSubtitle"),
    },
    {
      icon: TimerIcon,
      title: t("trialEndTitle", { day: trialDays }),
      subtitle: t("trialEndSubtitle"),
    },
  ];

  // Order in the scroll body depends on trialActive (see the JSX below), so
  // the feature list is built once here and placed in either slot.
  const benefitsBlock = (
    <View style={{ gap: 9 }}>
      {BENEFIT_KEYS.map((key) => (
        <View
          key={key}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <CheckIcon size={16} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 13.5, color: colors.text, flex: 1 }}>
            {t(key)}
          </Text>
        </View>
      ))}
    </View>
  );

  function planName(pkg: PurchasesPackage): string {
    switch (pkg.packageType) {
      case "WEEKLY":
        return t("planWeekly");
      case "MONTHLY":
        return t("planMonthly");
      case "THREE_MONTH":
        return t("planQuarterly");
      case "SIX_MONTH":
        return t("planSixMonth");
      case "ANNUAL":
        return t("planYearly");
      default:
        return pkg.product.title;
    }
  }

  function PlanCard({ pkg }: { pkg: PurchasesPackage }) {
    const selected = pkg.identifier === selectedId;
    const isWeekly =
      pkg.packageType === "WEEKLY" || /week/i.test(pkg.identifier);
    const pkgTrialDays = trialDaysFor(pkg);
    const showTrial = pkgTrialDays > 0 && !priorPurchase;
    // Annual is quoted per *week* — the smallest, least daunting unit — to
    // cut sticker shock; shorter plans stay per-month.
    const perUnitWeekly = isWeekly || pkg.packageType === "ANNUAL";
    const perAmount = perUnitWeekly ? pricePerWeek(pkg.product) : pricePerMonth(pkg.product);
    const perPeriodLabel = perAmount
      ? t(perUnitWeekly ? "perWeekShort" : "perMonthShort", { price: perAmount })
      : null;
    const savingsPct = savingsPctVsMonthly(pkg, monthlyPackage);
    const monthsFree =
      pkg.packageType === "ANNUAL"
        ? monthsFreeVsMonthly(pkg, monthlyPackage)
        : null;
    // What this plan's span costs paid monthly — struck through beside the
    // real price. Real figure from the live monthly rate.
    const anchorPrice = monthlyEquivalentPrice(pkg, monthlyPackage);

    // The saving goes in a pill on the card's top border (like a store badge).
    // Percentage first — it's instant to read; "N months free" is the fallback
    // when there's no monthly plan to compute a percentage against.
    const discountLabel = savingsPct
      ? t("savePercent", { pct: savingsPct })
      : monthsFree
        ? t("monthsFree", { count: monthsFree })
        : null;
    const trialLabel = showTrial
      ? t("freeTrialLabel", { days: pkgTrialDays })
      : null;

    return (
      <Pressable
        onPress={() => {
          // Re-engaging with the choice — drop any stale purchase/restore line.
          setError(null);
          setNotice(null);
          setSelectedId(pkg.identifier);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={[
          planName(pkg),
          pkg.product.priceString,
          perPeriodLabel,
          trialLabel,
          discountLabel,
        ]
          .filter(Boolean)
          .join(", ")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 18,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.accent : colors.stroke,
          backgroundColor: selected ? colors.glowSoft : colors.card,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        {discountLabel && (
          // An accent-outlined LABEL, not a `button`-filled blob. The ember
          // selection treatment (1.5px accent border + filled radio) is the
          // only "this is the pick" signal on the card; a solid-ember pill on
          // an unselected card was reading as a second, competing one.
          <View
            style={{
              position: "absolute",
              top: -8,
              right: 12,
              maxWidth: "70%",
              backgroundColor: colors.cardSoft,
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.3,
                color: colors.accent,
              }}
            >
              {/* Locale-aware upper-casing — a plain toUpperCase() turns
                  Turkish "i" into "I" instead of "İ". */}
              {discountLabel.toLocaleUpperCase(i18n.language)}
            </Text>
          </View>
        )}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            borderWidth: selected ? 6 : 1.5,
            borderColor: selected ? colors.button : colors.faint,
          }}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: "700", color: colors.text }}
          >
            {planName(pkg)}
          </Text>
          {trialLabel && (
            <Text
              numberOfLines={1}
              style={{ fontSize: 11, color: colors.accent, fontWeight: "600" }}
            >
              {trialLabel}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
          {anchorPrice && (
            <Text
              numberOfLines={1}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ fontSize: 11, color: colors.faint, textDecorationLine: "line-through" }}
            >
              {anchorPrice}
            </Text>
          )}
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "700", color: colors.text }}
          >
            {pkg.product.priceString}
          </Text>
          {perPeriodLabel && (
            <Text
              numberOfLines={1}
              style={{ fontSize: 11, color: colors.muted }}
            >
              {perPeriodLabel}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: -10 }, color: colors.glow, extent: 48 }]}
      style={{ flex: 1 }}
    >
      {/* Fixed close — sits above the scroll area, never scrolls away. */}
      <Pressable
        onPress={dismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t("common:close")}
        style={{
          position: "absolute",
          top: insets.top + 6,
          right: 14,
          zIndex: 20,
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <XIcon size={16} color={colors.faint} strokeWidth={1.6} />
      </Pressable>

      {/* Scrollable top: pitch + benefits + reviews + (trial timeline). */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: 28,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 6 }}>
          <Text
            className="font-lora-italic"
            style={{ fontSize: 15, color: colors.accent }}
          >
            {t("eyebrow")}
          </Text>
          <Text
            className="font-bold"
            style={{
              fontSize: 25,
              letterSpacing: -0.2,
              color: colors.text,
              maxWidth: 320,
            }}
          >
            {title}
          </Text>
        </View>

        {trialActive && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.stroke,
              borderRadius: 20,
              padding: 16,
              paddingBottom: 12,
              gap: 0,
            }}
          >
            {trialSteps.map((step, i, arr) => {
              // Step 0 ("Bugün") is where the user actually is right now — give
              // it a lit node, a dark-on-ember icon, a "you are here" tag, and
              // let the connector leaving it read as travelled (`accent`).
              const active = i === 0;
              return (
                <View
                  key={step.title}
                  style={{ flexDirection: "row", gap: 12 }}
                >
                  <View style={{ alignItems: "center", width: 24 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: active
                          ? colors.button
                          : colors.glowSoft,
                        borderWidth: 1,
                        borderColor: active ? colors.button : colors.stroke,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <step.icon
                        size={13}
                        color={active ? colors.buttonText : colors.accent}
                        strokeWidth={1.8}
                      />
                    </View>
                    {i < arr.length - 1 && (
                      <View
                        style={{
                          width: 1,
                          flex: 1,
                          minHeight: 10,
                          backgroundColor: active
                            ? colors.accent
                            : colors.stroke,
                        }}
                      />
                    )}
                  </View>
                  <View
                    style={{
                      flex: 1,
                      gap: 1,
                      paddingBottom: i < arr.length - 1 ? 12 : 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                      >
                        {step.title}
                      </Text>
                      {active && (
                        <View
                          style={{
                            backgroundColor: colors.glowSoft,
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          {/* Sentence case, no tracking — a quiet "you are
                              here" chip, not a third shouting micro-label. */}
                          <Text
                            style={{
                              fontSize: 10.5,
                              fontWeight: "700",
                              color: colors.accent,
                            }}
                          >
                            {t("trialStepNow")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11.5, color: colors.muted }}>
                      {step.subtitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* With a trial, the timeline is the pitch — reviews come next as
            reinforcement, then the feature list. Without a trial, lead with
            the feature list and let reviews close. */}
        {trialActive ? (
          <>
            <Testimonials items={TESTIMONIALS} />
            {benefitsBlock}
          </>
        ) : (
          <>
            {benefitsBlock}
            <Testimonials items={TESTIMONIALS} />
          </>
        )}
      </ScrollView>

      {/* Fixed bottom: plans + CTA + restore. Raised off the scroll area with
          a top border, a darker fill, and an upward shadow + fade so the
          split between "scrolls" and "always here" reads at a glance. */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.stroke,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: colors.bgDeep,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 14) + 4,
          gap: 9,
          // iOS-only lift. No Android `elevation` — MIUI renders a light rim
          // around the top-only radius that reads as a stray lighter layer;
          // the 1px top border + darker fill + the fade below carry the split.
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
        }}
      >
        <LinearGradient
          // Fades to the sheet's own fill — derived from the token so the two
          // can't drift apart. `${bgDeep}00` is the same colour at zero alpha.
          colors={[`${colors.bgDeep}00`, colors.bgDeep]}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -24,
            height: 24,
          }}
        />

        <View style={{ gap: 11 }}>
          {primary.map((pkg) => (
            <PlanCard key={pkg.identifier} pkg={pkg} />
          ))}

          {showAllPlans && other.length > 0 && (
            <>
              {/* The revealed plans are a distinct, lower-priority group —
                  give them a labelled rule so they don't read as three more
                  equal options stacked on the two primary cards. */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 5,
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colors.stroke }}
                />
                {/* Sentence case — the two hairline rules carry the "section
                    break" structure, the label just names it quietly. */}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  {t("otherPlansHeading")}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colors.stroke }}
                />
              </View>
              {other.map((pkg) => (
                <PlanCard key={pkg.identifier} pkg={pkg} />
              ))}
            </>
          )}
        </View>

        {other.length > 0 && (
          <Pressable
            onPress={() => setShowAllPlans((v) => !v)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              minHeight: 36,
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: showAllPlans }}
          >
            <Text
              style={{ fontSize: 12.5, fontWeight: "600", color: colors.muted }}
            >
              {showAllPlans ? t("hideOtherPlans") : t("showOtherPlans")}
            </Text>
            <View
              style={{
                transform: [{ rotate: showAllPlans ? "180deg" : "0deg" }],
              }}
            >
              <ChevronDownIcon
                size={14}
                color={colors.faint}
                strokeWidth={1.8}
              />
            </View>
          </Pressable>
        )}

        {/* Purchase/restore status — right where the eye is when the CTA is
            tapped, not off-screen up in the scroll body. `error` is a real
            failure (danger), `notice` a benign outcome (amber), `confirming`
            the ~7.5s entitlement poll after a successful charge. */}
        {(error || notice || confirming) && (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              textAlign: "center",
              paddingHorizontal: 4,
              color: error
                ? colors.danger
                : notice
                  ? colors.notice
                  : colors.muted,
            }}
          >
            {error ?? notice ?? t("confirmingSub")}
          </Text>
        )}

        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || restoring || !selectedPackage}
          style={{
            height: 54,
            borderRadius: 999,
            backgroundColor: colors.button,
            alignItems: "center",
            justifyContent: "center",
            opacity: purchasing ? 0.7 : 1,
            shadowColor: colors.glow,
            shadowOpacity: 1,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 10 },
            // The one sanctioned lift in the app (DESIGN.md §Elevation). Safe
            // on Android unlike the sheet's removed elevation — this is a
            // symmetric pill, not a top-only radius, so MIUI has no half-edge
            // to mis-render a rim around.
            elevation: 6,
            marginTop: 2,
          }}
          accessibilityRole="button"
        >
          {purchasing ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.buttonText,
              }}
            >
              {ctaLabel}
            </Text>
          )}
        </Pressable>

        <View
          style={{
            minHeight: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Disclosure text — `muted`, not `faint`: at 11.5px on `bgDeep`
              `faint` falls under 4.5:1, and a subscription screen's charge
              terms have to stay readable in a dark room. */}
          <Text
            style={{ fontSize: 11.5, color: colors.muted, textAlign: "center" }}
          >
            {chargeHint}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            onPress={handleRestore}
            disabled={restoring || purchasing}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text
              style={{ fontSize: 11.5, fontWeight: "600", color: colors.muted }}
            >
              {restoring ? t("restoringLabel") : t("restoreCta")}
            </Text>
          </Pressable>
          {/* Store review requires a reachable EULA + privacy link on any
              screen that sells a subscription — shown once the URLs are live
              (same flag Settings uses). */}
          {LEGAL_LINKS_READY && (
            <>
              <Text style={{ fontSize: 11.5, color: colors.faint }}>·</Text>
              <Pressable
                onPress={() => openExternalUrl(TERMS_URL)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  {t("termsLink")}
                </Text>
              </Pressable>
              <Text style={{ fontSize: 11.5, color: colors.faint }}>·</Text>
              <Pressable
                onPress={() => openExternalUrl(PRIVACY_POLICY_URL)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: "600",
                    color: colors.muted,
                  }}
                >
                  {t("privacyLink")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </GlowBackground>
  );
}
