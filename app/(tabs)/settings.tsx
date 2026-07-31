import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { signOut, deleteAccount } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";
import { fetchUserStatus } from "../../src/lib/playback";
import { changeAppLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../src/lib/i18n";
import {
  getBedtimeReminderPreference,
  setBedtimeReminder,
  type BedtimeReminderPreference,
} from "../../src/lib/bedtimeReminder";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const subscriptionStatus = useUserStore((state) => state.subscriptionStatus);
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bedtime, setBedtime] = useState<BedtimeReminderPreference>({
    enabled: false,
    hour: 22,
    minute: 0,
  });

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

  async function handleAdjustBedtime(deltaMinutes: number) {
    const totalMinutes = (bedtime.hour * 60 + bedtime.minute + deltaMinutes + 24 * 60) % (24 * 60);
    const next = { ...bedtime, hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
    setBedtime(next);
    if (bedtime.enabled) await setBedtimeReminder(next);
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

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-lg mb-6">{t("placeholder")}</Text>

      {subscriptionStatus === "premium" ? (
        <Text className="text-green-700 font-semibold mb-6">{t("premiumActive")}</Text>
      ) : (
        <Pressable
          className="bg-black rounded-lg px-6 py-3 mb-6"
          onPress={() => router.push("/paywall")}
        >
          <Text className="text-white font-semibold">{t("common:goPremium")}</Text>
        </Pressable>
      )}

      <Text className="text-sm text-gray-500 mb-2">{t("language")}</Text>
      <View className="flex-row flex-wrap justify-center mb-6">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Pressable
            key={lang}
            className={`border rounded-lg px-4 py-2 m-1 ${
              language === lang ? "bg-black border-black" : "border-gray-300"
            }`}
            onPress={() => handleSelectLanguage(lang)}
          >
            <Text className={language === lang ? "text-white" : "text-black"}>
              {LANGUAGE_LABELS[lang]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm text-gray-500 mb-2">{t("bedtimeTitle")}</Text>
      <View className="flex-row items-center mb-6">
        <Pressable
          className={`border rounded-lg px-4 py-2 mr-3 ${
            bedtime.enabled ? "bg-black border-black" : "border-gray-300"
          }`}
          onPress={handleToggleBedtime}
        >
          <Text className={bedtime.enabled ? "text-white" : "text-black"}>
            {bedtime.enabled ? t("bedtimeOn") : t("bedtimeOff")}
          </Text>
        </Pressable>

        <Pressable
          className="border border-gray-300 rounded-lg w-9 h-9 items-center justify-center"
          onPress={() => handleAdjustBedtime(-30)}
        >
          <Text>-</Text>
        </Pressable>
        <Text className="text-base font-semibold mx-3">
          {formatTime(bedtime.hour, bedtime.minute)}
        </Text>
        <Pressable
          className="border border-gray-300 rounded-lg w-9 h-9 items-center justify-center"
          onPress={() => handleAdjustBedtime(30)}
        >
          <Text>+</Text>
        </Pressable>
      </View>

      <Pressable
        className="border border-gray-300 rounded-lg px-6 py-3 mb-4"
        onPress={handleSignOut}
      >
        <Text>{t("signOut")}</Text>
      </Pressable>

      <Pressable
        className="px-6 py-3"
        onPress={handleDeleteAccount}
        disabled={isDeleting}
      >
        <Text className="text-red-600">{isDeleting ? t("deleting") : t("deleteAccount")}</Text>
      </Pressable>
    </View>
  );
}
