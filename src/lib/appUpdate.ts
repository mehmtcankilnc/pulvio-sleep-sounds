import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

// Sürüm uyarısı sunucudan yönetilir (app_config, 0023): yeni sürüm
// mağazaya çıkınca tek bir UPDATE ile "yeni sürüm + yeni sesler hazır"
// uyarısı açılır; min_version yükseltilirse zorunlu güncellemeye döner.

export type AppConfig = {
  latestVersion: string;
  minVersion: string;
  storeUrl: string | null;
  message: Record<string, string> | null;
};

const ANDROID_FALLBACK_URL = "https://play.google.com/store/apps/details?id=com.pulvio.app";
const DISMISSED_KEY = "pulvio_update_dismissed_version";

// "1.2.10" > "1.2.9". Eksik/bozuk parçalar 0 sayılır.
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  const { data, error } = await supabase
    .from("app_config")
    .select("latest_version, min_version, store_url, message_i18n")
    .eq("platform", Platform.OS)
    .maybeSingle();
  if (error || !data) return null;
  return {
    latestVersion: data.latest_version,
    minVersion: data.min_version,
    storeUrl: data.store_url ?? (Platform.OS === "android" ? ANDROID_FALLBACK_URL : null),
    message: data.message_i18n ?? null,
  };
}

export async function getDismissedVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function rememberDismissedVersion(version: string) {
  AsyncStorage.setItem(DISMISSED_KEY, version).catch(() => {});
}
