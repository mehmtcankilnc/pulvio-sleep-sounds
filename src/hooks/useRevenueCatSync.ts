import { useEffect } from "react";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { useUserStore } from "../store/useUserStore";
import { configureRevenueCatOnce, purchasesDisabled, REVENUECAT_ENTITLEMENT_ID } from "../lib/revenuecat";
import { resolveSubscriptionState } from "../lib/subscription";

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
    if (purchasesDisabled || session === undefined) return;

    if (session) {
      Purchases.logIn(session.user.id).catch(() => {});
    } else {
      Purchases.isAnonymous().then((isAnonymous) => {
        if (!isAnonymous) Purchases.logOut().catch(() => {});
      });
    }
  }, [session]);

  useEffect(() => {
    if (purchasesDisabled || session === undefined) return;

    // Session-scoped: the backend's get_user_status RPC is the trusted
    // source whenever there's a session to ask it with — it's the only
    // place a cooldown can be known, and the only one allowed to grant
    // premium (resolveSubscriptionState only ever pulls a stale grant back
    // down, never up). Without a session — a guest, or the brief window
    // before auth resolves — there's nothing to ask, so this falls back to
    // RevenueCat's own entitlement for the device's anonymous id instead.
    // That's a real, durable signal (it's what a guest actually bought),
    // and it's the only thing that lets a returning guest's premium status
    // survive an app restart: without it, `subscriptionStatus` always boots
    // back to the store's "free" default, and no session-gated re-check
    // ever runs to correct it for someone who never signs in.
    function sync(cachedInfo?: CustomerInfo) {
      if (session) {
        resolveSubscriptionState().then((state) => {
          if (!state) return;
          setSubscriptionStatus(state.plan);
          setCooldownEndsAt(state.cooldownEndsAt);
        });
        return;
      }
      (cachedInfo ? Promise.resolve(cachedInfo) : Purchases.getCustomerInfo())
        .then((info) => {
          setSubscriptionStatus(info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ? "premium" : "free");
        })
        .catch(() => {});
    }

    sync(); // establish current status right away (e.g. a returning guest)

    const listener = (info: CustomerInfo) => sync(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [session, setSubscriptionStatus, setCooldownEndsAt]);
}
