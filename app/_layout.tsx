import "../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthListener } from "../src/hooks/useAuthListener";
import { useSubscriptionStatus } from "../src/hooks/useSubscriptionStatus";
import { useRevenueCatSync } from "../src/hooks/useRevenueCatSync";
import { useUserStore } from "../src/store/useUserStore";
import { PlayerEngineProvider } from "../src/lib/player/PlayerEngineProvider";

export default function RootLayout() {
  useAuthListener();
  useSubscriptionStatus();
  useRevenueCatSync();
  const session = useUserStore((state) => state.session);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, router]);

  if (session === undefined) {
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
          options={{ presentation: "modal", headerShown: true, title: "Premium" }}
        />
      </Stack>
    </>
  );
}
