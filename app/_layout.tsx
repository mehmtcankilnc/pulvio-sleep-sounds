import "../global.css";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthListener } from "../src/hooks/useAuthListener";
import { useSubscriptionStatus } from "../src/hooks/useSubscriptionStatus";
import { useRevenueCatSync } from "../src/hooks/useRevenueCatSync";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useUserStore } from "../src/store/useUserStore";
import { PlayerEngineProvider } from "../src/lib/player/PlayerEngineProvider";
import { initI18n } from "../src/lib/i18n";

export default function RootLayout() {
  const { t } = useTranslation();
  useAuthListener();
  useSubscriptionStatus();
  useRevenueCatSync();
  usePushNotifications();
  const session = useUserStore((state) => state.session);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [i18nReady, setI18nReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initI18n().then((language) => {
      setLanguage(language);
      setI18nReady(true);
    });
  }, [setLanguage]);

  useEffect(() => {
    if (session === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, router]);

  if (session === undefined || !i18nReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <PlayerEngineProvider />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="paywall"
          options={{ presentation: "modal", headerShown: true, title: t("paywall:title") }}
        />
      </Stack>
    </>
  );
}
