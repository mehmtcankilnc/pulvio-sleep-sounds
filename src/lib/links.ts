import { Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Hosted on a subdomain of the developer's personal domain rather than a
// dedicated pulvio.app domain (same setup as the smooth-icon library).
// App Store Guideline 5.1.1 and Google Play both require a reachable privacy
// policy; these must resolve to live pages before store submission.
export const PRIVACY_POLICY_URL = "https://pulvio.mehmtcankilinc.com/privacy";
export const TERMS_URL = "https://pulvio.mehmtcankilinc.com/terms";
export const SUPPORT_EMAIL = "mehmtcankilinc@gmail.com";

// Flip to `true` once the two URLs above point at live pages. Until then the
// Settings screen hides the Privacy / Terms rows rather than opening a 404.
// Contact support (mailto) is unaffected and always shown.
export const LEGAL_LINKS_READY = true;

// Generic store subscription-management landing, used only when RevenueCat
// doesn't hand back a customer-specific managementURL.
const STORE_SUBSCRIPTIONS_FALLBACK =
  Platform.OS === "ios"
    ? "https://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions";

export function openExternalUrl(url: string) {
  return WebBrowser.openBrowserAsync(url).catch(() => {});
}

// Rejects when no mail client is registered — the caller surfaces the
// address as a fallback rather than letting the tap do nothing.
export function openSupportEmail() {
  return Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
}

export function openManageSubscription(managementUrl: string | null) {
  return Linking.openURL(managementUrl ?? STORE_SUBSCRIPTIONS_FALLBACK).catch(
    () => {},
  );
}
