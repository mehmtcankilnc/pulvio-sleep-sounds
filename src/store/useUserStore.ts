import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import type { SupportedLanguage } from "../lib/i18n";

type SubscriptionStatus = "free" | "premium";

const ONBOARDING_DONE_KEY = "pulvio.onboarding.completed.v1";

type UserState = {
  // undefined: session henüz yüklenmedi, null: giriş yok, Session: giriş var.
  // Route guard (app/_layout.tsx) bu üç durumu ayırt ederek yönlendirme yapar.
  session: Session | null | undefined;
  userId: string | null;
  subscriptionStatus: SubscriptionStatus;
  // Backend'den gelen ISO timestamp; cooldown bitene kadar dolu olur
  cooldownEndsAt: string | null;
  // undefined until read from AsyncStorage. Once a logged-out user has been
  // through (or dismissed) the pre-auth funnel, the route guard sends them
  // to (auth) instead of (onboarding) on subsequent launches.
  onboardingCompleted: boolean | undefined;
  // Gerçek kaynak i18next'in kendi state'i; bu alan UI'ın (örn. dil seçici)
  // aktif dili okuyabilmesi için bir ayna, bkz. src/lib/i18n.ts
  language: SupportedLanguage;
  // True between a PASSWORD_RECOVERY deep link landing and the user setting a
  // new password. The route guard uses it to keep the (recovery) session on
  // the reset-password screen instead of bouncing it into the app.
  passwordRecovery: boolean;
  setSession: (session: Session | null) => void;
  setUser: (userId: string) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setCooldownEndsAt: (isoDate: string | null) => void;
  setOnboardingCompleted: (value: boolean) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setPasswordRecovery: (value: boolean) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  session: undefined,
  userId: null,
  subscriptionStatus: "free",
  cooldownEndsAt: null,
  onboardingCompleted: undefined,
  language: "en",
  passwordRecovery: false,
  setSession: (session) => set({ session, userId: session?.user.id ?? null }),
  setUser: (userId) => set({ userId }),
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setCooldownEndsAt: (isoDate) => set({ cooldownEndsAt: isoDate }),
  setOnboardingCompleted: (value) => {
    set({ onboardingCompleted: value });
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, value ? "1" : "0").catch(() => {});
  },
  setLanguage: (language) => set({ language }),
  setPasswordRecovery: (passwordRecovery) => set({ passwordRecovery }),
  logout: () =>
    set({ session: null, userId: null, subscriptionStatus: "free", cooldownEndsAt: null }),
}));

// Read the "has been through onboarding" flag once at app start (app/_layout.tsx),
// alongside the i18n hydration. Defaults to false when unset or unreadable.
export async function hydrateOnboardingCompleted(): Promise<void> {
  let value = false;
  try {
    value = (await AsyncStorage.getItem(ONBOARDING_DONE_KEY)) === "1";
  } catch {
    // unreadable storage — treat as a fresh install
  }
  useUserStore.setState({ onboardingCompleted: value });
}
