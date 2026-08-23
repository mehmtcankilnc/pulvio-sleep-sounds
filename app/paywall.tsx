import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { getCurrentOffering, purchasePackage } from "../src/lib/revenuecat";
import { fetchUserStatus } from "../src/lib/playback";
import { useUserStore } from "../src/store/useUserStore";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { GlowBackground } from "../src/components/GlowBackground";
import { CheckIcon, MoonIcon, TimerIcon, XIcon } from "../src/components/icons";

const BENEFIT_KEYS = ["benefitMixes", "benefitLibrary", "benefitFadeOut", "benefitNewSounds"] as const;

// Trial-timeline dates are illustrative — see docs/DRIFT_IMPLEMENTATION_PLAN.md
// for wiring them to the real RevenueCat intro-price/trial period.
export default function PaywallScreen() {
  const { t } = useTranslation("paywall");
  const router = useRouter();
  const colors = useThemeColors();
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentOffering()
      .then((result) => {
        setOffering(result);
        const preferred = result?.availablePackages.find((pkg) => /year|annual/i.test(pkg.identifier)) ?? result?.availablePackages[0];
        setSelectedId(preferred?.identifier ?? null);
      })
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const selectedPackage = useMemo(
    () => offering?.availablePackages.find((pkg) => pkg.identifier === selectedId) ?? null,
    [offering, selectedId]
  );

  async function handlePurchase() {
    if (!selectedPackage) return;
    setPurchasing(true);
    setError(null);
    try {
      await purchasePackage(selectedPackage);

      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const status = await fetchUserStatus();
        if (status?.plan === "premium") {
          setSubscriptionStatus("premium");
          setCooldownEndsAt(null);
          router.back();
          return;
        }
      }

      Alert.alert(t("purchaseReceivedTitle"), t("purchaseReceivedMessage"), [{ text: t("common:ok"), onPress: () => router.back() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("purchaseFailed"));
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  if (!offering || offering.availablePackages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, textAlign: "center" }}>{t("empty")}</Text>
      </View>
    );
  }

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: -10 }, color: colors.glow, extent: 48 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, justifyContent: "space-between" }}
    >
      <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
            accessibilityRole="button"
            accessibilityLabel={t("common:close")}
          >
            <XIcon size={19} color={colors.faint} strokeWidth={1.7} />
          </Pressable>
        </View>

        <View style={{ gap: 6, marginTop: -8 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("eyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 25, letterSpacing: -0.2, color: colors.text, maxWidth: 320 }}>
            {t("title")}
          </Text>
        </View>

        <View style={{ gap: 9 }}>
          {BENEFIT_KEYS.map((key) => (
            <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <CheckIcon size={16} color={colors.accent} strokeWidth={2} />
              <Text style={{ fontSize: 13.5, color: colors.text, flex: 1 }}>{t(key)}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, padding: 16, paddingBottom: 12, gap: 0 }}>
          {[
            { icon: MoonIcon, title: t("trialTodayTitle"), subtitle: t("trialTodaySubtitle") },
            { icon: MoonIcon, title: t("trialDay5Title"), subtitle: t("trialDay5Subtitle") },
            { icon: TimerIcon, title: t("trialDay7Title"), subtitle: t("trialDay7Subtitle") },
          ].map((step, i, arr) => (
            <View key={step.title} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ alignItems: "center", width: 24 }}>
                <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: colors.glowSoft, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}>
                  <step.icon size={13} color={colors.accent} strokeWidth={1.8} />
                </View>
                {i < arr.length - 1 && <View style={{ width: 1, flex: 1, minHeight: 10, backgroundColor: colors.stroke }} />}
              </View>
              <View style={{ gap: 1, paddingBottom: i < arr.length - 1 ? 12 : 0 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{step.title}</Text>
                <Text style={{ fontSize: 11.5, color: colors.muted }}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        {error && <Text style={{ textAlign: "center", color: "#ef4444" }}>{error}</Text>}

        <View style={{ flexDirection: "row", gap: 11 }}>
          {offering.availablePackages.map((pkg: PurchasesPackage) => {
            const selected = pkg.identifier === selectedId;
            const isYearly = /year|annual/i.test(pkg.identifier);
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelectedId(pkg.identifier)}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? colors.accent : colors.stroke,
                  backgroundColor: selected ? colors.glowSoft : colors.card,
                  padding: 14,
                  gap: 3,
                }}
                accessibilityRole="button"
                accessibilityLabel={pkg.product.title}
              >
                {selected && isYearly && (
                  <View style={{ position: "absolute", top: -9, left: 12, backgroundColor: colors.button, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5, color: colors.buttonText }}>{t("saveBadge")}</Text>
                  </View>
                )}
                <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? colors.text : colors.muted, marginTop: 3 }}>
                  {pkg.product.title}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{pkg.product.priceString}</Text>
                {selected && <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>{t("selectedPlanHint")}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ gap: 3 }}>
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
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
            elevation: 6,
          }}
          accessibilityRole="button"
        >
          {purchasing ? <ActivityIndicator color={colors.buttonText} /> : <Text style={{ fontSize: 15, fontWeight: "700", color: colors.buttonText }}>{t("startTrialCta")}</Text>}
        </Pressable>
        <View style={{ minHeight: 34, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 11.5, color: colors.faint }}>{t("noChargeHint")}</Text>
        </View>
        <Pressable onPress={() => router.back()} style={{ minHeight: 40, alignItems: "center", justifyContent: "center" }} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{t("continueFreeCta")}</Text>
        </Pressable>
      </View>
    </GlowBackground>
  );
}
