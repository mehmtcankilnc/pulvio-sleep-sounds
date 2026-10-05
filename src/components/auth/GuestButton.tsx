import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { continueAsGuest } from "../../lib/auth";
import { useUserStore } from "../../store/useUserStore";
import { useThemeColors } from "../../hooks/useThemeColors";

// "Continue without an account" — opens a real Supabase anonymous session
// (backend-enforced cooldown still applies) and enters the app. Hidden when a
// session already exists (a guest opening signup from Settings).
export function GuestButton() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const hasSession = useUserStore((state) => !!state.session);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (hasSession) return null;

  async function onPress() {
    setPending(true);
    setFailed(false);
    const { session, error } = await continueAsGuest();
    if (error || !session) {
      setPending(false);
      setFailed(true);
      return;
    }
    useUserStore.getState().setSession(session);
    router.replace("/(tabs)");
  }

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={pending}
        accessibilityRole="button"
        style={{ minHeight: 48, justifyContent: "center", marginTop: 8, opacity: pending ? 0.6 : 1 }}
      >
        <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "600", color: colors.accent }}>
          {t("guest.continue")}
        </Text>
      </Pressable>
      {failed ? (
        <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12.5, color: colors.notice }}>
          {t("guest.failed")}
        </Text>
      ) : null}
    </>
  );
}
