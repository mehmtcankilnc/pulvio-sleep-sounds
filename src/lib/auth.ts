import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// OAuth akışı tarayıcıdan uygulamaya dönerken bekleyen promise'i tamamlaması için gerekli.
WebBrowser.maybeCompleteAuthSession();

// Shared password floor. Supabase's own minimum is set in the dashboard
// (Auth → Policies); keep that at least this high so the server never
// accepts something this client rejected.
export const MIN_PASSWORD = 8;

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
//
// Supabase v2 attaches a stable `code` to most auth errors — that's the
// primary signal. The English-substring checks are only a fallback for
// codeless errors (older engine strings, transport failures).
export function authErrorKey(error: AuthError | Error | null): string {
  if (!error) return "error.generic";

  const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
  const status = "status" in error && typeof error.status === "number" ? error.status : undefined;
  const msg = ("message" in error ? error.message : String(error)).toLowerCase();

  switch (code) {
    case "invalid_credentials":
      return "error.invalidCredentials";
    case "email_not_confirmed":
      return "error.emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "error.alreadyRegistered";
    case "weak_password":
      return "error.weakPassword";
    case "validation_failed":
      return "error.invalidEmail";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return "error.rateLimited";
  }

  if (msg.includes("invalid login credentials")) return "error.invalidCredentials";
  if (msg.includes("email not confirmed")) return "error.emailNotConfirmed";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "error.alreadyRegistered";
  if (msg.includes("password should be at least") || msg.includes("weak password")) return "error.weakPassword";
  if (msg.includes("unable to validate email") || msg.includes("invalid format")) return "error.invalidEmail";
  if (msg.includes("rate limit") || status === 429) return "error.rateLimited";
  if (msg.includes("network") || msg.includes("fetch")) return "error.network";
  if (status === 422) return "error.alreadyRegistered";
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

// Google: Custom Tabs / SFAuthenticationSession web flow. On Android the
// return often comes through the app's normal deep-link path rather than
// openAuthSessionAsync's own promise (which resolves "dismiss" even on a
// successful redirect), so the real session exchange happens in
// exchangeCodeFromUrl (useAuthListener), not here.
export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pulvio" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error ?? new Error("Google için OAuth URL'i alınamadı") };
  }

  await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  // Sonucu (success/dismiss) kasıtlı olarak yok sayıyoruz — gerçek tamamlanma
  // deep-link dinleyicisinden gelecek.
  return { error: null };
}

// Apple: the native system flow (iOS only — the button is gated to
// Platform.OS === "ios"). App Store Guideline 4.8 + the Sign in with Apple
// guidelines require the real system sheet, not a web OAuth page. A nonce
// ties Apple's identity token to this request: Apple gets its SHA-256,
// Supabase gets the raw value and re-hashes to compare.
export async function signInWithApple() {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { error: new Error("Apple bir identity token döndürmedi") };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    return { error };
  } catch (e) {
    // Tapping "Cancel" on the system sheet is not an error state.
    if (typeof e === "object" && e !== null && "code" in e && e.code === "ERR_REQUEST_CANCELED") {
      return { error: null };
    }
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
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
