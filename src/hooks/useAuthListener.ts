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
    // getSession() AsyncStorage kurtarma + gerekirse token yenilemesini
    // bekleyip İLK yetkili değeri verir. onAuthStateChange ise abone olur
    // olmaz, storage kurtarması bitmeden geçici bir INITIAL_SESSION(null)
    // yayınlayabiliyor — bunu store'a yazarsak, oturumu açık bir kullanıcı
    // soğuk açılışta bir an login ekranına düşüp sonra geri yönleniyor.
    // Bu yüzden getSession() çözülene kadar listener olaylarını yok sayıyoruz.
    let initialResolved = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialResolved = true;
      setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialResolved) return;
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
