import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let isConfigured = false;

// Apple Developer hesabı henüz yok, Faz 5 kapsamı Android/Google Play ile
// sınırlı — iOS dalı bilinçli olarak erken dönüyor. İleride iOS eklenirken
// sadece bir EXPO_PUBLIC_REVENUECAT_IOS_API_KEY + bu koşul eklenmesi yeterli,
// mimari iOS'a kapalı değil.
export function configureRevenueCatOnce() {
  if (isConfigured) return;

  if (Platform.OS !== "android") {
    return;
  }

  if (!ANDROID_API_KEY) {
    console.warn("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY tanımlı değil, RevenueCat devre dışı");
    return;
  }

  Purchases.configure({ apiKey: ANDROID_API_KEY });
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  isConfigured = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}
