import { useEffect } from "react";
import Purchases from "react-native-purchases";
import { useUserStore } from "../store/useUserStore";
import { configureRevenueCatOnce } from "../lib/revenuecat";
import { fetchUserStatus } from "../lib/playback";

// app/_layout.tsx içinde bir kez mount edilir. RevenueCat SDK'sını başlatır,
// Supabase user id'sini RevenueCat app_user_id'si olarak eşler (webhook'taki
// eşleştirmenin temeli budur). CustomerInfo listener'ı SADECE optimistic UI
// için — asla subscriptions tablosuna yazan bir RPC tetiklemez, en fazla
// mevcut read-only get_user_status'u tekrar çağırır.
export function useRevenueCatSync() {
  const session = useUserStore((state) => state.session);
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);

  useEffect(() => {
    configureRevenueCatOnce();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (session) {
      Purchases.logIn(session.user.id).catch(() => {});
    } else {
      Purchases.isAnonymous().then((isAnonymous) => {
        if (!isAnonymous) Purchases.logOut().catch(() => {});
      });
    }
  }, [session]);

  useEffect(() => {
    const listener = () => {
      fetchUserStatus().then((status) => {
        if (!status) return;
        setSubscriptionStatus(status.plan);
        setCooldownEndsAt(status.cooldown_ends_at);
      });
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [setSubscriptionStatus, setCooldownEndsAt]);
}
