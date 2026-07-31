import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18next from "./i18n";

const STORAGE_KEY = "pulvio_bedtime_reminder";
// Sabit identifier: aynı bildirimi tekrar schedule etmeden önce güvenle iptal
// edebilmek için (kullanıcı saati değiştirdiğinde eskiyi silip yenisini kurar).
const NOTIFICATION_IDENTIFIER = "bedtime-reminder";

export type BedtimeReminderPreference = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULT_PREFERENCE: BedtimeReminderPreference = { enabled: false, hour: 22, minute: 0 };

export async function getBedtimeReminderPreference(): Promise<BedtimeReminderPreference> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_PREFERENCE;
  try {
    return JSON.parse(stored) as BedtimeReminderPreference;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

// Ayarlar ekranındaki saat seçiciden çağrılır. İzin verilmezse tercih
// enabled:false olarak kaydedilir ve false döner ki UI toggle'ı geri alsın.
export async function setBedtimeReminder(
  preference: BedtimeReminderPreference
): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER).catch(() => {});

  if (preference.enabled) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...preference, enabled: false }));
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDENTIFIER,
      content: {
        title: i18next.t("settings:bedtimeNotifTitle"),
        body: i18next.t("settings:bedtimeNotifBody"),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: preference.hour,
        minute: preference.minute,
      },
    });
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  return true;
}
