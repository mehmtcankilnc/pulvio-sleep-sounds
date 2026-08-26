import "../global.css";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Lora_400Regular_Italic, Lora_500Medium_Italic } from "@expo-google-fonts/lora";
import { useAuthListener } from "../src/hooks/useAuthListener";
import { useSubscriptionStatus } from "../src/hooks/useSubscriptionStatus";
import { useRevenueCatSync } from "../src/hooks/useRevenueCatSync";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useUserStore } from "../src/store/useUserStore";
import { PlayerEngineProvider } from "../src/lib/player/PlayerEngineProvider";
import { initI18n } from "../src/lib/i18n";
import { useThemeColors } from "../src/hooks/useThemeColors";

export default function RootLayout() {
  const colors = useThemeColors();
  useAuthListener();
  useSubscriptionStatus();
  useRevenueCatSync();
  usePushNotifications();
  const session = useUserStore((state) => state.session);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Lora_400Regular_Italic,
    Lora_500Medium_Italic,
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initI18n().then((language) => {
      setLanguage(language);
      setI18nReady(true);
    });
  }, [setLanguage]);

  // Root Layout only mounts the Stack (below) once session/i18n/fonts are
  // all ready — redirecting before that throws "navigate before mounting
  // the Root Layout component", since there's no navigator mounted yet.
  useEffect(() => {
    if (session === undefined || !i18nReady || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, i18nReady, fontsLoaded, segments, router]);

  if (session === undefined || !i18nReady || !fontsLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  return <AppShell />;
}

// player/paywall/onboarding screens draw their own Drift-styled top bars
// (back control, title, trailing icon) rather than using the native Stack
// header, so every modal route here is headerShown: false.
function AppShell() {
  return (
    <>
      <PlayerEngineProvider />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="discover" />
        <Stack.Screen
          name="player"
          options={{
            // Full-screen card (not a `modal` presentation, whose Android
            // dismiss animation is unreliable) that slides up from the bottom
            // and, on pop, slides straight back down — so the header chevron
            // reads as "swipe this away downward". Vertical gesture enables
            // swipe-down-to-dismiss to match.
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
