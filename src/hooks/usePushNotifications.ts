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
    // Store-screenshot builds skip this: the iOS notification prompt is a
    // SpringBoard alert the capture automation can't see or dismiss.
    if (process.env.EXPO_PUBLIC_DISABLE_PUSH_PROMPT === "1") return;
    registerForPushNotifications();
  }, [session]);
}
