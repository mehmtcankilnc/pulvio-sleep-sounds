import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Localization from "expo-localization";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android 8+ bildirim göstermek için bir kanal şart, yoksa sessizce yutulur.
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// app/_layout.tsx içinde oturum açıkken bir kez çağrılır. İzin reddedilirse
// veya token alınamazsa (ör. emülatörde push credentials yoksa) sessizce
// çıkar — bedtime hatırlatıcısı (tamamen lokal) bundan etkilenmez.
export async function registerForPushNotifications(): Promise<void> {
  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  let expoPushToken: string;
  try {
    expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.warn("registerForPushNotifications: push token alınamadı", error);
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // send-trial-reminders'ın kullanıcının yerel sabahına göre gönderim
  // yapabilmesi için IANA timezone (ör. "Europe/Istanbul") de kaydediliyor.
  const timezone = Localization.getCalendars()[0]?.timeZone ?? null;

  const { error } = await supabase.from("push_tokens").upsert({
    user_id: user.id,
    expo_push_token: expoPushToken,
    timezone,
    updated_at: new Date().toISOString(),
  });

  if (error) console.warn("registerForPushNotifications: token kaydedilemedi", error);
}
