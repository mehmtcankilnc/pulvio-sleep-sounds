import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// OAuth akışı tarayıcıdan uygulamaya dönerken bekleyen promise'i tamamlaması için gerekli.
WebBrowser.maybeCompleteAuthSession();

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Android'de Custom Tabs, OAuth dönüşünü openAuthSessionAsync'in kendi promise'i
// üzerinden değil, uygulamanın normal deep-link akışı üzerinden yapabiliyor
// (openAuthSessionAsync bu durumda "dismiss" döner, halbuki yönlendirme aslında
// başarılı olmuştur). Bu yüzden asıl oturum kurma işi burada değil, gelen
// pulvio:// linkini dinleyen exchangeCodeFromUrl'de (useAuthListener) yapılıyor.
async function signInWithOAuth(provider: "google" | "apple") {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pulvio" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error ?? new Error(`${provider} için OAuth URL'i alınamadı`) };
  }

  await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  // Sonucu (success/dismiss) kasıtlı olarak yok sayıyoruz — gerçek tamamlanma
  // deep-link dinleyicisinden gelecek. Kullanıcı gerçekten iptal ettiyse login
  // ekranında kalır, ekstra bir hata göstermemize gerek yok.
  return { error: null };
}

export function signInWithGoogle() {
  return signInWithOAuth("google");
}

export function signInWithApple() {
  return signInWithOAuth("apple");
}

// pulvio:// ile dönen OAuth linkini işler, 'code' varsa session'a çevirir.
// useAuthListener hem canlı deep-link event'lerinde hem de soğuk başlangıçta
// (Linking.getInitialURL) bunu çağırır.
export async function exchangeCodeFromUrl(url: string) {
  const { queryParams } = Linking.parse(url);
  const code = queryParams?.code;
  if (typeof code !== "string") return;

  await supabase.auth.exchangeCodeForSession(code);
}
