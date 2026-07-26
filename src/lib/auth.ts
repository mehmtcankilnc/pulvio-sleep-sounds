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

async function signInWithOAuth(provider: "google" | "apple") {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pulvio" });
  console.log("TEMP DEBUG redirectUri:", redirectUri); // test bitince kaldırılacak

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error ?? new Error(`${provider} için OAuth URL'i alınamadı`) };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type !== "success") {
    // Kullanıcı tarayıcıyı kapattı/iptal etti — hata olarak sayma.
    return { error: null };
  }

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (typeof code !== "string") {
    return { error: new Error("OAuth yönlendirmesinde 'code' parametresi bulunamadı") };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: exchangeError };
}

export function signInWithGoogle() {
  return signInWithOAuth("google");
}

export function signInWithApple() {
  return signInWithOAuth("apple");
}
