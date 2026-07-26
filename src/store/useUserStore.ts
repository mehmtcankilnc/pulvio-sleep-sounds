import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

type SubscriptionStatus = "free" | "premium";

type UserState = {
  // undefined: session henüz yüklenmedi, null: giriş yok, Session: giriş var.
  // Route guard (app/_layout.tsx) bu üç durumu ayırt ederek yönlendirme yapar.
  session: Session | null | undefined;
  userId: string | null;
  subscriptionStatus: SubscriptionStatus;
  // Backend'den gelen ISO timestamp; cooldown bitene kadar dolu olur
  cooldownEndsAt: string | null;
  setSession: (session: Session | null) => void;
  setUser: (userId: string) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setCooldownEndsAt: (isoDate: string | null) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  session: undefined,
  userId: null,
  subscriptionStatus: "free",
  cooldownEndsAt: null,
  setSession: (session) => set({ session, userId: session?.user.id ?? null }),
  setUser: (userId) => set({ userId }),
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setCooldownEndsAt: (isoDate) => set({ cooldownEndsAt: isoDate }),
  logout: () =>
    set({ session: null, userId: null, subscriptionStatus: "free", cooldownEndsAt: null }),
}));
