import { useRef, useState } from "react";
import type { JSX } from "react";
import { View, Text, Pressable, ScrollView, type TextInput as RNTextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateEmail, updatePassword, authErrorKey, debugErrorSuffix, getLinkedAuthProvider, MIN_PASSWORD } from "../src/lib/auth";
import { useUserStore } from "../src/store/useUserStore";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { GlowBackground } from "../src/components/GlowBackground";
import { centeredColumn } from "../src/theme/layout";
import { BottomSheet } from "../src/components/BottomSheet";
import { TextField } from "../src/components/ui/TextField";
import { Button } from "../src/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, MailIcon, PencilIcon } from "../src/components/icons";
import type { IconProps } from "../src/components/icons";

function Hairline() {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.stroke }} />;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 9 }}>
      <Text accessibilityRole="header" style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.3, color: colors.muted }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.stroke,
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

// Same Row recipe as app/(tabs)/profile.tsx (Settings) — this screen is a
// drill-down from it, so its rows should read as the same list continued,
// not a different design.
function Row({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const content = (
    <>
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 11.5, color: colors.muted }}>{subtitle}</Text> : null}
      </View>
      {onPress ? <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} /> : null}
    </>
  );
  const layout = { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 } as const;

  if (!onPress) {
    return <View style={layout}>{content}</View>;
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={layout}>
      {content}
    </Pressable>
  );
}

// Google/Apple aren't in the app's own icon set (src/components/icons) —
// same Ionicons glyphs ProviderButtons.tsx already uses for these two
// providers' own brand marks, just inline here instead of adding
// single-use exports for a row that only ever needs these two.
function ProviderGlyph({ provider }: { provider: "google" | "apple" }) {
  const colors = useThemeColors();
  return <Ionicons name={provider === "google" ? "logo-google" : "logo-apple"} size={20} color={colors.accent} />;
}

export default function AccountScreen() {
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useUserStore((state) => state.session);
  const provider = getLinkedAuthProvider(session?.user);
  const email = session?.user.email ?? "";

  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, ...centeredColumn }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 20) + 6,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.stroke,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
          >
            <ChevronLeftIcon size={20} color={colors.muted} strokeWidth={1.7} />
          </Pressable>
          <Text accessibilityRole="header" className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
            {t("accountScreenTitle")}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
          <Group label={t("accountEmailLabel")}>
            <Row icon={MailIcon} title={email} />
          </Group>

          {provider === "email" ? (
            <Group label={t("accountGroup")}>
              <Row icon={PencilIcon} title={t("accountChangeEmailRow")} onPress={() => setEmailSheetOpen(true)} />
              <Hairline />
              <Row icon={LockIcon} title={t("accountChangePasswordRow")} onPress={() => setPasswordSheetOpen(true)} />
            </Group>
          ) : provider === "google" || provider === "apple" ? (
            <Group label={t("accountGroup")}>
              <Row
                icon={(props) => <ProviderGlyph provider={provider} {...props} />}
                title={t("accountConnectedTitle")}
                subtitle={provider === "google" ? t("accountConnectedGoogle") : t("accountConnectedApple")}
              />
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 17, paddingHorizontal: 2, paddingTop: 6, paddingBottom: 10 }}>
                {t("accountConnectedNote", { provider: provider === "google" ? "Google" : "Apple" })}
              </Text>
            </Group>
          ) : null}
        </ScrollView>
      </View>

      <ChangeEmailSheet visible={emailSheetOpen} currentEmail={email} onClose={() => setEmailSheetOpen(false)} />
      <ChangePasswordSheet visible={passwordSheetOpen} onClose={() => setPasswordSheetOpen(false)} />
    </GlowBackground>
  );
}

// Supabase holds the new address as pending until its confirmation link is
// tapped (same as signUpWithEmail) — `session.user.email` on this screen
// doesn't change the moment this sheet closes, so the success state says
// exactly that instead of implying the change already took effect.
function ChangeEmailSheet({
  visible,
  currentEmail,
  onClose,
}: {
  visible: boolean;
  currentEmail: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("settings");
  const { t: tAuth } = useTranslation("auth");
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setError(null);
    setSentTo(null);
    setLoading(false);
  }

  async function handleSubmit() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(tAuth("error.invalidEmail"));
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setError(t("accountChangeEmailSameError"));
      return;
    }
    setLoading(true);
    const { error: err } = await updateEmail(trimmed);
    setLoading(false);
    if (err) {
      setError(tAuth(authErrorKey(err)) + debugErrorSuffix(err));
      return;
    }
    setSentTo(trimmed);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        onClose();
        setTimeout(reset, 250);
      }}
      style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}
    >
      {sentTo ? (
        <>
          <View style={{ gap: 6 }} accessible accessibilityLiveRegion="polite">
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
              {t("accountChangeEmailSuccessTitle")}
            </Text>
            <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>
              {t("accountChangeEmailSuccessMessage", { email: sentTo })}
            </Text>
          </View>
          <Button
            label={t("common:ok")}
            onPress={() => {
              onClose();
              setTimeout(reset, 250);
            }}
          />
        </>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
              {t("accountChangeEmailSheetTitle")}
            </Text>
            <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{t("accountChangeEmailBody")}</Text>
          </View>
          <TextField
            kind="email"
            label={tAuth("field.email")}
            placeholder={tAuth("field.emailPlaceholder")}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError(null);
            }}
            error={error}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
          <Button label={t("accountChangeEmailSubmit")} onPress={handleSubmit} loading={loading} />
        </>
      )}
    </BottomSheet>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation("settings");
  const { t: tAuth } = useTranslation("auth");
  const colors = useThemeColors();
  const confirmRef = useRef<RNTextInput>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setPassword("");
    setConfirm("");
    setError(null);
    setDone(false);
    setLoading(false);
  }

  async function handleSubmit() {
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(tAuth("error.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setError(tAuth("reset.mismatch"));
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(tAuth(authErrorKey(err)) + debugErrorSuffix(err));
      return;
    }
    setDone(true);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        onClose();
        setTimeout(reset, 250);
      }}
      style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}
    >
      {done ? (
        <>
          <View style={{ gap: 6 }} accessible accessibilityLiveRegion="polite">
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
              {t("accountChangePasswordSuccessTitle")}
            </Text>
            <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{t("accountChangePasswordSuccessMessage")}</Text>
          </View>
          <Button
            label={t("common:ok")}
            onPress={() => {
              onClose();
              setTimeout(reset, 250);
            }}
          />
        </>
      ) : (
        <>
          <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
            {t("accountChangePasswordSheetTitle")}
          </Text>
          <TextField
            kind="newPassword"
            label={tAuth("field.newPassword")}
            placeholder={tAuth("field.newPasswordPlaceholder", { count: MIN_PASSWORD })}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={confirmRef}
            kind="newPassword"
            label={tAuth("reset.confirmLabel")}
            placeholder={tAuth("reset.confirmPlaceholder")}
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              if (error) setError(null);
            }}
            error={error}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
          <Button label={t("accountChangePasswordSubmit")} onPress={handleSubmit} loading={loading} />
        </>
      )}
    </BottomSheet>
  );
}
