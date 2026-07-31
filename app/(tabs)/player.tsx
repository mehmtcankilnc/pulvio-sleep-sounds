import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "../../src/store/usePlayerStore";
import { useUserStore } from "../../src/store/useUserStore";
import { usePlayerActions } from "../../src/hooks/usePlayerActions";
import { useCooldownCountdown } from "../../src/hooks/useCooldownCountdown";

function formatTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const { t } = useTranslation("player");
  const router = useRouter();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const elapsedSeconds = usePlayerStore((state) => state.elapsedSeconds);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const error = usePlayerStore((state) => state.error);
  const denyReason = usePlayerStore((state) => state.denyReason);
  const cooldownEndsAt = useUserStore((state) => state.cooldownEndsAt);
  const countdownLabel = useCooldownCountdown();
  const { togglePlayPause } = usePlayerActions();

  if (cooldownEndsAt) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-bold text-center mb-2">{t("limitTitle")}</Text>
        <Text className="text-gray-500 text-center mb-4">{t("limitRemaining")}</Text>
        <Text className="text-3xl font-bold mb-8">{countdownLabel ?? "…"}</Text>
        <Pressable
          className="bg-black rounded-lg px-6 py-3"
          onPress={() => router.push("/paywall")}
        >
          <Text className="text-white font-semibold">{t("limitCta")}</Text>
        </Pressable>
      </View>
    );
  }

  if (denyReason === "premium_only") {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-bold text-center mb-2">{t("premiumOnlyTitle")}</Text>
        <Text className="text-gray-500 text-center mb-8">{t("premiumOnlySubtitle")}</Text>
        <Pressable
          className="bg-black rounded-lg px-6 py-3"
          onPress={() => router.push("/paywall")}
        >
          <Text className="text-white font-semibold">{t("common:goPremium")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!currentTrack) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg">{t("noTrack")}</Text>
        {error && <Text className="text-red-600 text-center mt-4">{error}</Text>}
      </View>
    );
  }

  const progressRatio = durationSeconds > 0 ? Math.min(elapsedSeconds / durationSeconds, 1) : 0;

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-center mb-1">{currentTrack.title}</Text>
      <Text className="text-sm text-gray-500 text-center mb-8">
        {currentTrack.category} / {currentTrack.subcategory}
      </Text>

      {error && <Text className="text-red-600 text-center mb-4">{error}</Text>}

      <Pressable
        className="self-center border border-gray-300 rounded-full w-20 h-20 items-center justify-center mb-6"
        onPress={togglePlayPause}
      >
        <Text className="text-2xl">{isBuffering ? "…" : isPlaying ? "⏸" : "▶"}</Text>
      </Pressable>

      <View className="h-1 bg-gray-200 rounded-full mb-2">
        <View className="h-1 bg-black rounded-full" style={{ width: `${progressRatio * 100}%` }} />
      </View>
      <Text className="text-center text-gray-500">
        {formatTime(elapsedSeconds)} / {formatTime(durationSeconds)}
      </Text>
    </View>
  );
}
