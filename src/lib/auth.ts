import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// OAuth akışı tarayıcıdan uygulamaya dönerken bekleyen promise'i tamamlaması için gerekli.
WebBrowser.maybeCompleteAuthSession();

export async function signUpWithEmail(email: string, password: string) {
  // Without emailRedirectTo the confirmation link falls back to the Supabase
  // project's Site URL (http://localhost:3000 by default). Point it at the
  // app's scheme so tapping the link opens Pulvio; the returning ?code is
  // exchanged by exchangeCodeFromUrl in useAuthListener.
  // NOTE: this exact URI must be added to Supabase → Auth → URL Configuration
  // → Redirect URLs.
  const emailRedirectTo = AuthSession.makeRedirectUri({ scheme: "pulvio" });
  const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo } });
  return { error };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error };
}

// Sends the recovery email. The link returns to the app via the pulvio://
// scheme and lands on reset-password (useAuthListener routes the
// PASSWORD_RECOVERY event there).
export async function sendPasswordReset(email: string) {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: "pulvio", path: "reset-password" });
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  return { error };
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  return { error };
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
  return { error };
}

// Maps Supabase auth errors to an i18n key under auth:error.*, so a
// TR/DE/FR/ES/PT user never sees a raw English engine string. Unknown
// errors fall back to a generic localized line, never `error.message`.
export function authErrorKey(error: AuthError | Error | null): string {
  if (!error) return "error.generic";
  const msg = ("message" in error ? error.message : String(error)).toLowerCase();
  const status = "status" in error ? error.status : undefined;

  if (msg.includes("invalid login credentials")) return "error.invalidCredentials";
  if (msg.includes("email not confirmed")) return "error.emailNotConfirmed";
  if (msg.includes("user already registered") || status === 422) return "error.alreadyRegistered";
  if (msg.includes("password should be at least")) return "error.weakPassword";
  if (msg.includes("unable to validate email") || msg.includes("invalid format")) return "error.invalidEmail";
  if (msg.includes("rate limit") || status === 429) return "error.rateLimited";
  if (msg.includes("network") || msg.includes("fetch")) return "error.network";
  return "error.generic";
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Sunucu tarafında hesabı ve ilişkili tüm verileri (subscriptions,
// listening_sessions, cooldowns) siler (bkz. supabase/functions/delete-account),
// ardından yerel oturumu temizler — useAuthListener bunu otomatik yakalayıp
// route guard'ı tetikler.
export async function deleteAccount() {
  const { error: invokeError } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });
  if (invokeError) return { error: invokeError };

  await supabase.auth.signOut();
  return { error: null };
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
