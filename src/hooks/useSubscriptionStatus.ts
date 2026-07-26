import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";
import { fetchUserStatus } from "../lib/playback";

// Giriş yapıldığında (session set olduğunda) mevcut plan/cooldown durumunu bir
// kez yükler. Gerçek yetkilendirme her zaman startPlayback/heartbeat RPC'lerinde
// yapılır — bu sadece açılışta UI'ı doğru göstermek için.
export function useSubscriptionStatus() {
  const session = useUserStore((state) => state.session);
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);

  useEffect(() => {
    if (!session) return;

    fetchUserStatus().then((status) => {
      if (!status) return;
      setSubscriptionStatus(status.plan);
      setCooldownEndsAt(status.cooldown_ends_at);
    });
  }, [session, setSubscriptionStatus, setCooldownEndsAt]);
}
