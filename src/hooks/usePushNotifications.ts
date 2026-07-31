import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";
import { registerForPushNotifications } from "../lib/notifications";

// app/_layout.tsx içinde bir kez mount edilir. Sadece giriş yapılmışken
// push token kaydı dener — anonim/çıkış yapılmış durumda push_tokens'a
// yazacak bir user_id yok.
export function usePushNotifications() {
  const session = useUserStore((state) => state.session);

  useEffect(() => {
    if (!session) return;
    registerForPushNotifications();
  }, [session]);
}
