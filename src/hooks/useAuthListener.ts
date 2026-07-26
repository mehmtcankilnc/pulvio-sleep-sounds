import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { exchangeCodeFromUrl } from "../lib/auth";
import { useUserStore } from "../store/useUserStore";

// app/_layout.tsx içinde bir kez çağrılır: mevcut session'ı yükler, sonraki
// auth değişikliklerini (giriş/çıkış/token yenileme) store'a yansıtır ve
// OAuth dönüşü olan pulvio:// deep link'lerini dinleyip session'a çevirir.
export function useAuthListener() {
  const setSession = useUserStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Uygulama açıkken gelen OAuth dönüşü
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      exchangeCodeFromUrl(url);
    });

    // Uygulama OAuth dönüşüyle soğuk başlatıldıysa
    Linking.getInitialURL().then((url) => {
      if (url) exchangeCodeFromUrl(url);
    });

    return () => {
      subscription.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [setSession]);
}
