import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { signOut, deleteAccount } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";
import { fetchUserStatus } from "../../src/lib/playback";
import { changeAppLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../src/lib/i18n";
import { getBedtimeReminderPreference, setBedtimeReminder, type BedtimeReminderPreference } from "../../src/lib/bedtimeReminder";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { Toggle } from "../../src/components/ui/Toggle";
import { Button } from "../../src/components/ui/Button";
import {
  BellIcon,
  ChevronRightIcon,
  CompassIcon,
  HeartIcon,
  PencilIcon,
  UserIcon,
  WindIcon,
} from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

function Hairline() {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.stroke }} />;
}

function Row({
  icon: Icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  subtitle?: string;
  trailing: React.ReactNode;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 }}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 11.5, color: colors.faint }}>{subtitle}</Text>}
      </View>
      {trailing}
    </Pressable>
  );
}

function ValueChevron({ value }: { value: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 12.5, color: colors.muted }}>{value}</Text>
      <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 9 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.3, color: colors.faint }}>{label}</Text>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 }}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const subscriptionStatus = useUserStore((state) => state.subscriptionStatus);
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bedtime, setBedtime] = useState<BedtimeReminderPreference>({ enabled: false, hour: 22, minute: 0 });

  useEffect(() => {
    getBedtimeReminderPreference().then(setBedtime);
  }, []);

  async function handleSelectLanguage(next: SupportedLanguage) {
    if (next === language) return;
    await changeAppLanguage(next);
    setLanguage(next);
  }

  async function handleToggleBedtime() {
    const next = { ...bedtime, enabled: !bedtime.enabled };
    const granted = await setBedtimeReminder(next);
    setBedtime(granted ? next : { ...next, enabled: false });
    if (!granted) Alert.alert(t("bedtimePermissionDeniedTitle"), t("bedtimePermissionDeniedMessage"));
  }

  // RevenueCat'in cihaz-lokal customerInfo listener'ı iptal/expire gibi
  // durumlarda gecikmeli tetiklenebiliyor. Ekran her odaklandığında backend'in
  // kendi get_user_status'unu (Keşfet'teki oynatma engelinin de kullandığı
  // aynı kaynak) tekrar sorarak iki ekran arasında tutarsızlığı önlüyoruz.
  useFocusEffect(
    useCallback(() => {
      fetchUserStatus().then((status) => {
        if (!status) return;
        setSubscriptionStatus(status.plan);
        setCooldownEndsAt(status.cooldown_ends_at);
      });
    }, [setSubscriptionStatus, setCooldownEndsAt])
  );

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) Alert.alert(t("signOutFailedTitle"), error.message);
  }

  function handleDeleteAccount() {
    Alert.alert(t("deleteConfirmTitle"), t("deleteConfirmMessage"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("deleteAccount"),
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          const { error } = await deleteAccount();
          setIsDeleting(false);
          if (error) Alert.alert(t("deleteFailedTitle"), error.message);
        },
      },
    ]);
  }

  const bedtimeTime = `${bedtime.hour.toString().padStart(2, "0")}:${bedtime.minute.toString().padStart(2, "0")}`;

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: tabBarHeight + 24, gap: 18 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <GlowBackground variant="artworkTile" style={{ width: 62, height: 62, borderRadius: 999, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}>
            <UserIcon size={26} color={colors.moon} strokeWidth={1.4} />
          </GlowBackground>
          <View style={{ flex: 1, gap: 3 }}>
            {subscriptionStatus === "premium" ? (
              <Text style={{ fontSize: 12.5, fontWeight: "700", color: "#4ade80" }}>{t("premiumActive")}</Text>
            ) : (
              <Pressable onPress={() => router.push("/paywall")} accessibilityRole="button">
                <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.accent }}>{t("common:goPremium")}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Group label={t("libraryGroup")}>
          <Row icon={CompassIcon} title={t("savedScenesRowTitle")} trailing={<ValueChevron value="0" />} />
          <Hairline />
          <Row icon={HeartIcon} title={t("favoriteSoundsRowTitle")} trailing={<ValueChevron value="0" />} />
        </Group>

        <Group label={t("preferencesGroup")}>
          <Row
            icon={BellIcon}
            title={t("bedtimeTitle")}
            subtitle={bedtime.enabled ? t("bedtimeReminderOnSubtitle", { time: bedtimeTime }) : t("bedtimeReminderOffSubtitle")}
            trailing={<Toggle value={bedtime.enabled} onValueChange={handleToggleBedtime} accessibilityLabel={t("bedtimeTitle")} />}
          />
          <Hairline />
          <Row
            icon={WindIcon}
            title={t("languageRowTitle")}
            trailing={<ValueChevron value={LANGUAGE_LABELS[language]} />}
          />
        </Group>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => handleSelectLanguage(lang)}
              style={{
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: language === lang ? colors.button : colors.card,
                borderWidth: language === lang ? 0 : 1,
                borderColor: colors.stroke,
              }}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: language === lang ? colors.buttonText : colors.muted }}>
                {LANGUAGE_LABELS[lang]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Group label={t("accountGroup")}>
          <Row icon={UserIcon} title={t("accountRowTitle")} trailing={<ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />} onPress={handleSignOut} />
          <Hairline />
          <Row
            icon={PencilIcon}
            title={isDeleting ? t("deleting") : t("deleteAccount")}
            trailing={<ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />}
            onPress={handleDeleteAccount}
          />
        </Group>

        {/* Dev/review-only entry point for the not-yet-wired onboarding funnel. */}
        <Pressable onPress={() => router.push("/(onboarding)/welcome")} accessibilityRole="button">
          <Text style={{ fontSize: 12.5, color: colors.faint, textAlign: "center" }}>{t("previewOnboarding")}</Text>
        </Pressable>

        <Button label={t("signOut")} variant="outline" onPress={handleSignOut} />
      </ScrollView>
    </GlowBackground>
  );
}
