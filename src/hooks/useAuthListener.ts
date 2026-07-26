import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useUserStore } from "../store/useUserStore";

// app/_layout.tsx içinde bir kez çağrılır: mevcut session'ı yükler ve
// sonraki auth değişikliklerini (giriş/çıkış/token yenileme) store'a yansıtır.
export function useAuthListener() {
  const setSession = useUserStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession]);
}
