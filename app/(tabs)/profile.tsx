import { useCallback, useEffect, useState } from "react";
import type { JSX } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import DatePicker from "react-native-date-picker";
import { signOut, deleteAccount } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";
import { useOnboardingAnswers, resolveOnboardingBedtime } from "../../src/lib/onboarding/useOnboardingAnswers";
import { resolveSubscriptionState } from "../../src/lib/subscription";
import { restorePurchases, getManagementUrl } from "../../src/lib/revenuecat";
import {
  PRIVACY_POLICY_URL,
  TERMS_URL,
  SUPPORT_EMAIL,
  LEGAL_LINKS_READY,
  openExternalUrl,
  openSupportEmail,
  openManageSubscription,
} from "../../src/lib/links";
import { changeAppLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../src/lib/i18n";
import { getBedtimeReminderPreference, setBedtimeReminder, type BedtimeReminderPreference } from "../../src/lib/bedtimeReminder";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { centeredColumn } from "../../src/theme/layout";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { BottomSheet } from "../../src/components/BottomSheet";
import { Toggle } from "../../src/components/ui/Toggle";
import { Button } from "../../src/components/ui/Button";
import {
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  DocumentIcon,
  LanguageIcon,
  LogOutIcon,
  MailIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
  XIcon,
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

type Notice = {
  title: string;
  message: string;
  // Failure notices that can just be retried carry the action here; the
  // sheet then leads with "Try again" instead of a dead-end "OK".
  retry?: () => void | Promise<void>;
};

// App-wide press vocabulary (Button.tsx / SelectChip.tsx / sleep.tsx) —
// reused here rather than inventing an opacity-only fallback.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(targetScale: number, duration = 150, disabled = false) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => {
      if (disabled) return;
      scale.value = withTiming(targetScale, { duration, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
    },
    onPressOut: () => {
      scale.value = withTiming(1, { duration, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
    },
  };
}

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
  tone = "default",
  busy = false,
  accessibilityLabel,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  tone?: "default" | "danger";
  // A non-pressable row whose title reflects an in-flight operation
  // (delete → "Deleting…"): announce the change and keep it a status node.
  busy?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useThemeColors();
  const press = usePressScale(0.98, 150, !onPress);
  const leadColor = tone === "danger" ? colors.danger : colors.accent;
  const titleColor = tone === "danger" ? colors.danger : colors.text;

  const content = (
    <>
      <Icon size={20} color={leadColor} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: titleColor }}>{title}</Text>
        {/* muted (~6.5:1 on `card`), not faint (~3.7:1, under the 4.5:1
            small-text floor) — this line carries the row's current value,
            read at arm's length in the dark. Same fix applied on sleep.tsx. */}
        {subtitle ? <Text style={{ fontSize: 11.5, color: colors.muted }}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );

  const layout = { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 } as const;

  if (!onPress) {
    return (
      <View
        style={layout}
        accessible={busy || undefined}
        accessibilityLiveRegion={busy ? "polite" : "none"}
        accessibilityLabel={busy ? accessibilityLabel ?? title : undefined}
      >
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[layout, press.style]}
    >
      {content}
    </AnimatedPressable>
  );
}

// Chevron here means "opens something" — every Row that renders it now
// actually navigates. Value text in `muted` (a real value the user reads),
// chevron in `faint` (a decorative affordance cue).
function ValueChevron({ value }: { value: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 12.5, color: colors.muted }}>{value}</Text>
      <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />
    </View>
  );
}

function Chevron() {
  const colors = useThemeColors();
  return <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />;
}

function Group({ label, children, tone = "default" }: { label: string; children: React.ReactNode; tone?: "default" | "danger" }) {
  const colors = useThemeColors();
  const isDanger = tone === "danger";
  return (
    <View style={{ gap: 9 }}>
      {/* Overline in `muted` (DESIGN.md's Overline role is accent or muted).
          The danger section steps the overline + the card border up to the
          `danger` red — enough to read as a distinct, cautionary zone
          without a full red-tinted fill (which over-signalled on an
          otherwise near-monochrome bedtime screen). The full red-bordered
          treatment lives on the confirmation sheet, where it belongs. */}
      <Text accessibilityRole="header" style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.3, color: isDanger ? colors.danger : colors.muted }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: isDanger ? colors.danger : colors.stroke,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  // A guest (paywall skip, or an anonymous purchase) holds a real session
  // with no email/password behind it — signing out would abandon it for
  // good, with no way back in, so that row is hidden for them entirely (see
  // the ACCOUNT group below) in favor of a row that offers to link one.
  const isAnonymous = useUserStore((state) => state.session?.user.is_anonymous === true);
  const accountEmail = useUserStore((state) => state.session?.user.email);
  const subscriptionStatus = useUserStore((state) => state.subscriptionStatus);
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);

  const [bedtime, setBedtime] = useState<BedtimeReminderPreference>({ enabled: false, hour: 22, minute: 0 });
  const [bedtimeSheetOpen, setBedtimeSheetOpen] = useState(false);

  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);
  const [signOutSheetOpen, setSignOutSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isOpeningManage, setIsOpeningManage] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    // Seed the time from the onboarding bedtime answer when the user hasn't
    // set a reminder yet, instead of a bare 22:00.
    resolveOnboardingBedtime().then((fallback) =>
      getBedtimeReminderPreference(fallback ?? undefined).then(setBedtime),
    );
  }, []);

  // RevenueCat'in cihaz-lokal customerInfo listener'ı iptal/expire gibi
  // durumlarda gecikmeli tetiklenebiliyor. Ekran her odaklandığında backend'in
  // kendi get_user_status'unu (Keşfet'teki oynatma engelinin de kullandığı
  // aynı kaynak) tekrar sorarak iki ekran arasında tutarsızlığı önlüyoruz.
  useFocusEffect(
    useCallback(() => {
      resolveSubscriptionState().then((state) => {
        if (!state) return;
        setSubscriptionStatus(state.plan);
        setCooldownEndsAt(state.cooldownEndsAt);
      });
    }, [setSubscriptionStatus, setCooldownEndsAt])
  );

  async function handleToggleBedtime() {
    const next = { ...bedtime, enabled: !bedtime.enabled };
    const granted = await setBedtimeReminder(next);
    setBedtime(granted ? next : { ...next, enabled: false });
    if (!granted) setNotice({ title: t("bedtimePermissionDeniedTitle"), message: t("bedtimePermissionDeniedMessage") });
  }

  // Time change from the picker sheet — reschedules the notification if the
  // reminder is already on, otherwise just remembers the time for when it is.
  async function handleChangeBedtimeTime(hour: number, minute: number) {
    const next = { ...bedtime, hour, minute };
    const granted = await setBedtimeReminder(next);
    setBedtime(granted ? next : { ...next, enabled: false });
    if (!granted) setNotice({ title: t("bedtimePermissionDeniedTitle"), message: t("bedtimePermissionDeniedMessage") });
  }

  async function handleSelectLanguage(next: SupportedLanguage) {
    if (next === language || pendingLanguage) {
      if (next === language) setLanguageSheetOpen(false);
      return;
    }
    // Show a spinner on the tapped row while the switch applies + a short
    // settle beat, so the pause reads as "applying" rather than a frozen
    // sheet. Other rows go inert until it resolves (guard above).
    setPendingLanguage(next);
    Haptics.selectionAsync().catch(() => {});
    await changeAppLanguage(next);
    setLanguage(next);
    setTimeout(() => {
      setLanguageSheetOpen(false);
      setPendingLanguage(null);
    }, 350);
  }

  async function runSignOut() {
    setNotice(null);
    const { error } = await signOut();
    if (error) setNotice({ title: t("signOutFailedTitle"), message: t("signOutFailedMessage"), retry: runSignOut });
  }

  function confirmSignOut() {
    setSignOutSheetOpen(false);
    void runSignOut();
  }

  async function runDeleteAccount() {
    setNotice(null);
    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);
    setDeleteSheetOpen(false);
    if (error) setNotice({ title: t("deleteFailedTitle"), message: t("deleteFailedMessage"), retry: runDeleteAccount });
  }

  async function handleRestore() {
    setNotice(null);
    setIsRestoring(true);
    try {
      await restorePurchases();
      const state = await resolveSubscriptionState();
      if (state?.plan === "premium") {
        setSubscriptionStatus("premium");
        setCooldownEndsAt(null);
        setNotice({ title: t("restoreSuccessTitle"), message: t("restoreSuccessMessage") });
      } else {
        setNotice({ title: t("restoreNoneTitle"), message: t("restoreNoneMessage") });
      }
    } catch {
      setNotice({ title: t("restoreFailedTitle"), message: t("restoreFailedMessage"), retry: handleRestore });
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleManageSubscription() {
    if (isOpeningManage) return;
    setIsOpeningManage(true);
    try {
      const url = await getManagementUrl();
      openManageSubscription(url);
    } finally {
      setIsOpeningManage(false);
    }
  }

  async function handleSupportEmail() {
    try {
      await openSupportEmail();
    } catch {
      // No mail client — surface the address instead of a dead tap.
      setNotice({ title: t("supportRow"), message: t("supportFallbackMessage", { email: SUPPORT_EMAIL }) });
    }
  }

  const bedtimeTime = `${bedtime.hour.toString().padStart(2, "0")}:${bedtime.minute.toString().padStart(2, "0")}`;
  const bedtimeStateLabel = bedtime.enabled
    ? t("bedtimeReminderOnSubtitle", { time: bedtimeTime })
    : t("bedtimeReminderOffSubtitle", { time: bedtimeTime });
  const isPremium = subscriptionStatus === "premium";
  const version = Constants.expoConfig?.version ?? "";

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ ...centeredColumn, paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: tabBarHeight + 24, gap: 16 }}
      >
        <ScreenHeader eyebrow={t("screenEyebrow")} title={t("screenTitle")} />

        {/* Guest (anonymous session) — promoted from a plain settings row to
            its own highlighted card, first thing under the header: a guest is
            one uninstall/device-loss away from losing everything with no way
            back in, which is a bigger stakes moment than the membership
            upsell below it. Accent-tinted background + accent border (vs the
            neutral `colors.card`/`colors.stroke` used everywhere else on this
            screen) is what actually makes it read as "more urgent than a
            list row" — copy stays factual (completeAccountSubtitle), no fake
            urgency per PRODUCT.md. */}
        {isAnonymous && (
          <View
            style={{
              backgroundColor: colors.glowSoft,
              borderWidth: 1.5,
              borderColor: colors.accent,
              borderRadius: 20,
              padding: 16,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SparklesIcon size={20} color={colors.accent} strokeWidth={1.6} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{t("completeAccountTitle")}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{t("completeAccountSubtitle")}</Text>
              </View>
            </View>
            <Button label={t("completeAccountCta")} onPress={() => router.push("/(auth)/signup")} />
          </View>
        )}

        {/* Membership — the app's one monetization surface, and it carries
            exactly one CTA: Go Premium for free, Manage subscription for
            premium (so the plan and its controls sit together). No fake
            urgency (PRODUCT.md principle 1): the copy names the free limit
            plainly and lets the user decide. */}
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <SparklesIcon size={20} color={colors.accent} strokeWidth={1.6} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {isPremium ? t("planPremiumTitle") : t("planFreeTitle")}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {isPremium ? t("planPremiumSubtitle") : t("planFreeSubtitle")}
              </Text>
            </View>
          </View>
          {isPremium ? (
            <Button
              label={t("manageSubscription")}
              variant="outline"
              loading={isOpeningManage}
              onPress={handleManageSubscription}
            />
          ) : (
            <Button label={t("common:goPremium")} onPress={() => router.push("/paywall")} />
          )}
        </View>

        <Group label={t("preferencesGroup")}>
          <Row
            icon={BellIcon}
            title={t("bedtimeTitle")}
            subtitle={bedtimeStateLabel}
            onPress={() => setBedtimeSheetOpen(true)}
            accessibilityLabel={`${t("bedtimeTitle")}, ${bedtimeStateLabel}. ${t("bedtimeSheetTitle")}`}
            trailing={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />
                <Toggle
                  value={bedtime.enabled}
                  onValueChange={handleToggleBedtime}
                  accessibilityLabel={`${t("bedtimeTitle")}, ${bedtimeStateLabel}`}
                />
              </View>
            }
          />
          <Hairline />
          <Row
            icon={LanguageIcon}
            title={t("languageRowTitle")}
            trailing={<ValueChevron value={LANGUAGE_LABELS[language]} />}
            onPress={() => setLanguageSheetOpen(true)}
            accessibilityLabel={`${t("languageRowTitle")}, ${LANGUAGE_LABELS[language]}`}
          />
        </Group>

        {/* Empty (and hidden) for a guest who has already gone premium: the
            account row is guest-only-hidden, restorePurchases is
            premium-only-hidden, and sign-out is guest-only-hidden too — all
            three conditions land on this one combination at once. */}
        {(!isAnonymous || !isPremium) && (
        <Group label={t("accountGroup")}>
          {/* A guest (no email/password behind the session) has nothing this
              row could show or edit — the highlighted card above the
              Membership card (isAnonymous) is the CTA that applies to them,
              and leads here indirectly once they've added real credentials. */}
          {!isAnonymous && (
            <>
              <Row
                icon={UserIcon}
                title={t("accountRowTitle")}
                subtitle={accountEmail ?? undefined}
                trailing={<Chevron />}
                onPress={() => router.push("/account")}
              />
              <Hairline />
            </>
          )}
          {!isPremium && (
            <>
              <Row
                icon={RefreshIcon}
                title={t("restorePurchases")}
                subtitle={isRestoring ? t("restoring") : undefined}
                busy={isRestoring}
                accessibilityLabel={isRestoring ? t("restoring") : undefined}
                trailing={isRestoring ? <ActivityIndicator size="small" color={colors.muted} /> : undefined}
                onPress={isRestoring ? undefined : handleRestore}
              />
              {!isAnonymous && <Hairline />}
            </>
          )}
          {/* No chevron — sign-out opens a confirmation sheet, it doesn't
              navigate; the missing chevron also sets it apart from the
              external ABOUT links below. Hidden for a guest: see isAnonymous
              above — the row that replaces it (completeAccountTitle) is the
              row this same tap should have led to anyway. */}
          {!isAnonymous && <Row icon={LogOutIcon} title={t("signOut")} onPress={() => setSignOutSheetOpen(true)} />}
        </Group>
        )}

        <Group label={t("aboutGroup")}>
          {LEGAL_LINKS_READY && (
            <>
              <Row icon={ShieldIcon} title={t("privacyRow")} trailing={<Chevron />} onPress={() => openExternalUrl(PRIVACY_POLICY_URL)} />
              <Hairline />
              <Row icon={DocumentIcon} title={t("termsRow")} trailing={<Chevron />} onPress={() => openExternalUrl(TERMS_URL)} />
              <Hairline />
            </>
          )}
          <Row icon={MailIcon} title={t("supportRow")} trailing={<Chevron />} onPress={handleSupportEmail} />
        </Group>

        <Group label={t("dangerGroup")} tone="danger">
          <Row
            icon={TrashIcon}
            title={isDeleting ? t("deleting") : t("deleteAccount")}
            tone="danger"
            busy={isDeleting}
            onPress={isDeleting ? undefined : () => setDeleteSheetOpen(true)}
          />
        </Group>

        {/* Dev-only: replay the (now wired) onboarding funnel. Clears the
            saved answers + the "completed" flag first so the guard doesn't
            bounce straight back. __DEV__-gated — never ships. */}
        {__DEV__ && (
          <Pressable
            onPress={() => {
              useOnboardingAnswers.getState().reset();
              useUserStore.getState().setOnboardingCompleted(false);
              router.push("/(onboarding)/welcome");
            }}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ fontSize: 12.5, color: colors.muted, textAlign: "center" }}>{t("previewOnboarding")}</Text>
          </Pressable>
        )}

        <View style={{ alignItems: "center", gap: 3, paddingTop: 2 }}>
          <Text style={{ fontSize: 12, color: colors.muted, letterSpacing: 0.2 }}>{t("footerTagline")}</Text>
          {version ? <Text style={{ fontSize: 11, color: colors.muted }}>{`Pulvio ${version}`}</Text> : null}
        </View>
      </ScrollView>

      <LanguageSheet
        visible={languageSheetOpen}
        current={language}
        pending={pendingLanguage}
        onSelect={handleSelectLanguage}
        onClose={() => setLanguageSheetOpen(false)}
      />
      <SignOutSheet visible={signOutSheetOpen} onConfirm={confirmSignOut} onClose={() => setSignOutSheetOpen(false)} />
      <DeleteAccountSheet
        visible={deleteSheetOpen}
        deleting={isDeleting}
        onConfirm={runDeleteAccount}
        onClose={() => {
          if (!isDeleting) setDeleteSheetOpen(false);
        }}
      />
      <BedtimeSheet
        visible={bedtimeSheetOpen}
        hour={bedtime.hour}
        minute={bedtime.minute}
        onSave={handleChangeBedtimeTime}
        onClose={() => setBedtimeSheetOpen(false)}
      />
      <NoticeSheet notice={notice} onClose={() => setNotice(null)} />
    </GlowBackground>
  );
}

function bedtimeDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Time picker for the bedtime reminder — the app's dark BottomSheet + the
// same `react-native-date-picker` wheel the onboarding bedtime step and the
// Sleep tab use. The pick is committed on "Done" (not per wheel-settle) so a
// fast spin doesn't reschedule the notification on every tick.
function BedtimeSheet({
  visible,
  hour,
  minute,
  onSave,
  onClose,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  onSave: (hour: number, minute: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  const [value, setValue] = useState(() => bedtimeDate(hour, minute));

  useEffect(() => {
    if (visible) setValue(bedtimeDate(hour, minute));
  }, [visible, hour, minute]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      style={{ borderWidth: 1, borderColor: colors.stroke, paddingTop: 16, paddingBottom: 24 }}
    >
      <Text className="font-bold" style={{ fontSize: 16, color: colors.text, paddingHorizontal: 20, paddingBottom: 12 }}>
        {t("bedtimeSheetTitle")}
      </Text>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, alignItems: "center", paddingVertical: 4 }}>
          <DatePicker date={value} mode="time" theme="dark" dividerColor={colors.stroke} onDateChange={setValue} />
        </View>
        <Button
          label={t("bedtimeSheetDoneCta")}
          onPress={() => {
            onSave(value.getHours(), value.getMinutes());
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

// Same dark BottomSheet the rest of the app uses instead of a bright native
// Alert — a full-brightness system dialog is the single most jarring thing
// this screen could produce in a dark room (see sleep.tsx's PermissionDeniedSheet).
// A failure notice with a `retry` leads with "Try again" so the user isn't
// left to re-find and re-trigger the action they just attempted.
function NoticeSheet({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  // Retain the last content so the copy doesn't blank out mid close-animation.
  const [shown, setShown] = useState(notice);
  useEffect(() => {
    if (notice) setShown(notice);
  }, [notice]);

  const retry = notice?.retry;

  return (
    <BottomSheet visible={!!notice} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}>
      <View style={{ gap: 6 }} accessible accessibilityLiveRegion="polite">
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {shown?.title}
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{shown?.message}</Text>
      </View>
      {retry ? (
        <View style={{ gap: 8 }}>
          <Button
            label={t("common:retry")}
            onPress={() => {
              onClose();
              void retry();
            }}
          />
          <Button label={t("common:close")} variant="outline" onPress={onClose} />
        </View>
      ) : (
        <Button label={t("common:ok")} onPress={onClose} />
      )}
    </BottomSheet>
  );
}

// Sign-out lives in exactly one place (the ACCOUNT row) and always asks
// first. Being dropped at an auth wall is a real late-night valley — one
// mis-tap should never do it.
function SignOutSheet({ visible, onConfirm, onClose }: { visible: boolean; onConfirm: () => void; onClose: () => void }) {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {t("signOutConfirmTitle")}
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{t("signOutConfirmMessage")}</Text>
      </View>
      <View style={{ gap: 8 }}>
        <Button label={t("signOut")} onPress={onConfirm} />
        <Button label={t("common:cancel")} variant="outline" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

// Irreversible, so it earns real friction: a `danger` heading and border, a
// deliberate two-tap confirm — "Delete account" (danger outline) arms
// "Delete forever" (solid danger) with a warning haptic — and a modal lock
// while the request runs, with a "this can take a moment" note so it never
// reads as frozen.
function DeleteAccountSheet({
  visible,
  deleting,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (visible) setArmed(false);
  }, [visible]);

  function arm() {
    setArmed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.bg, padding: 20, gap: 16 }}>
      <View style={{ gap: 6 }} accessible accessibilityLiveRegion="polite">
        <Text className="font-bold" style={{ fontSize: 16, color: colors.danger }}>
          {t("deleteConfirmTitle")}
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{t("deleteConfirmMessage")}</Text>
        {armed && !deleting && (
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.danger }}>{t("deleteFinalPrompt")}</Text>
        )}
        {deleting && <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("deleteWorkingNote")}</Text>}
      </View>
      <View style={{ gap: 8 }}>
        {armed ? (
          <Button label={deleting ? t("deleting") : t("deleteFinalCta")} variant="danger" loading={deleting} onPress={onConfirm} />
        ) : (
          <Button label={t("deleteConfirmCta")} variant="danger-outline" onPress={arm} />
        )}
        {!deleting && <Button label={t("common:cancel")} variant="outline" onPress={onClose} />}
      </View>
    </BottomSheet>
  );
}

function LanguageOption({
  label,
  selected,
  pending,
  disabled,
  onPress,
  last,
}: {
  label: string;
  selected: boolean;
  pending: boolean;
  disabled: boolean;
  onPress: () => void;
  last: boolean;
}) {
  const colors = useThemeColors();
  const press = usePressScale(0.98, 150, disabled);
  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled, busy: pending }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          minHeight: 52,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: colors.stroke,
          opacity: disabled && !pending ? 0.4 : 1,
        },
        press.style,
      ]}
    >
      <Text style={{ flex: 1, fontSize: 15, fontWeight: selected || pending ? "700" : "500", color: selected || pending ? colors.accent : colors.text }}>
        {label}
      </Text>
      {pending ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : selected ? (
        <CheckIcon size={18} color={colors.accent} strokeWidth={2} />
      ) : null}
    </AnimatedPressable>
  );
}

// One representation of the language setting — the Row opens this, the
// choice lives here. Selecting shows a spinner on that row while the switch
// applies + a short settle beat (see handleSelectLanguage), then dismisses.
function LanguageSheet({
  visible,
  current,
  pending,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: SupportedLanguage;
  pending: SupportedLanguage | null;
  onSelect: (lang: SupportedLanguage) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.stroke, paddingTop: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text className="font-bold" accessibilityRole="header" style={{ fontSize: 16, color: colors.text }}>
          {t("languageSheetTitle")}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t("common:close")} hitSlop={12}>
          <XIcon size={20} color={colors.faint} strokeWidth={1.7} />
        </Pressable>
      </View>
      <Hairline />
      <View style={{ paddingHorizontal: 20 }}>
        {SUPPORTED_LANGUAGES.map((lang, index) => (
          <LanguageOption
            key={lang}
            label={LANGUAGE_LABELS[lang]}
            selected={lang === current}
            pending={pending === lang}
            disabled={pending !== null}
            onPress={() => onSelect(lang)}
            last={index === SUPPORTED_LANGUAGES.length - 1}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
