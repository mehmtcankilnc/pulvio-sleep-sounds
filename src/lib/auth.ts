import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import i18n from "./i18n";

// OAuth akışı tarayıcıdan uygulamaya dönerken bekleyen promise'i tamamlaması için gerekli.
WebBrowser.maybeCompleteAuthSession();

// Shared password floor. Supabase's own minimum is set in the dashboard
// (Auth → Policies); keep that at least this high so the server never
// accepts something this client rejected.
export const MIN_PASSWORD = 8;

// Mail-triggered auth links (signup confirm, password reset, email change)
// go through this HTTPS landing page instead of straight to pulvio://.
// Reason: these links are opened from an email, which regularly happens on a
// device other than the one running the app (desktop webmail, a second
// phone) — a bare pulvio:// URI does nothing at all there, silently. The
// HTTPS page opens on any device, then JS-redirects into pulvio:// when the
// app is actually present, or shows a "open this on your phone" message
// otherwise. OAuth (Google) is unaffected — that flow only ever returns to
// the same device that started it, so it keeps using pulvio:// directly.
// NOTE: this exact URL (or a `/auth/*` wildcard) must be added to Supabase →
// Auth → URL Configuration → Redirect URLs, and the page itself must exist
// at pulvio.mehmtcankilinc.com/auth/callback.
//
// `lang` rides along as an ordinary query param — Supabase appends its own
// `?code=...` on top of whatever's already here, it doesn't replace it — so
// the callback page can greet the user in the language they're already
// using the app in, without needing six separate localized copies of it.
function authCallbackUrl(): string {
  return `https://pulvio.mehmtcankilinc.com/auth/callback?lang=${i18n.language}`;
}

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: authCallbackUrl() },
  });
  return { error };
}

// The anonymous-upgrade counterpart to signUpWithEmail: attaches an email +
// password to the CURRENT (anonymous) session's user instead of creating a
// new, disconnected one. Same auth.users.id throughout — every row keyed by
// it (favorites, sleep_schedule, listening_sessions/cooldown, subscriptions)
// is already this user's and needs no migration. Still confirmation-gated
// (Supabase holds the email as pending until the link is tapped, exactly
// like a fresh signup — check-email.tsx is reused as-is) and
// `is_anonymous` only flips to false once that confirmation lands, at which
// point the route guard's own strandedInAuth check moves them into (tabs).
export async function linkEmailToAnonymousUser(email: string, password: string) {
  const { error } = await supabase.auth.updateUser(
    { email: email.trim(), password },
    { emailRedirectTo: authCallbackUrl() }
  );
  return { error };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error };
}

// Sends the recovery email via the same HTTPS landing page as
// authCallbackUrl() — the path it lands on inside the app (reset-password)
// comes from the PASSWORD_RECOVERY auth event fired once the code is
// exchanged (useAuthListener → app/_layout.tsx route guard), not from the
// URL itself, so the generic callback page works here too.
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authCallbackUrl() });
  return { error };
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  return { error };
}

// Same shape as signUpWithEmail's redirect, but for an already-registered
// account changing its address rather than confirming a new one. Supabase
// holds the new address as pending until the confirmation link (sent to it)
// is tapped — `user.email` on the session doesn't change until then.
export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: authCallbackUrl() });
  return { error };
}

export type LinkedAuthProvider = "email" | "google" | "apple";

// Which identity actually backs this account's login — decides whether
// Account settings can offer an editable email/password (an "email"
// identity, from signUpWithEmail/linkEmailToAnonymousUser) or must show a
// read-only "connected via Google/Apple" instead, since an OAuth-only
// account has no password on file to change. A linked account can carry
// both kinds (an anonymous user who later also linked Google); "email"
// wins in that case because it's the one this screen can actually edit.
export function getLinkedAuthProvider(user: User | null | undefined): LinkedAuthProvider | null {
  const identities = user?.identities ?? [];
  if (identities.some((identity) => identity.provider === "email")) return "email";
  if (identities.some((identity) => identity.provider === "google")) return "google";
  if (identities.some((identity) => identity.provider === "apple")) return "apple";
  return null;
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
  return { error };
}

// The linking counterpart to resendConfirmationEmail — the pending
// confirmation from linkEmailToAnonymousUser is an "email_change" OTP, not a
// "signup" one; resending with the wrong type either no-ops or errors on the
// resend endpoint. check-email.tsx picks between the two by a `?linking=1`
// param on the route.
export async function resendEmailChangeConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: "email_change", email: email.trim() });
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
    // Supabase's own reset-password guard: the new password can't match the
    // one it's replacing. Falls through to the generic message without this
    // — which reads as a random failure and invites retrying the exact same
    // password again, forever.
    case "same_password":
      return "error.samePassword";
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
  if (msg.includes("different from the old password")) return "error.samePassword";
  if (msg.includes("unable to validate email") || msg.includes("invalid format")) return "error.invalidEmail";
  if (msg.includes("rate limit") || status === 429) return "error.rateLimited";
  if (msg.includes("network") || msg.includes("fetch")) return "error.network";
  if (status === 422) return "error.alreadyRegistered";

  // Nothing above matched — this is the case that reads as "something went
  // wrong, try again" with zero way to tell WHY from the UI alone, which is
  // exactly what made the same_password case above so hard to track down
  // (the on-screen message gave no hint it was that specific and re-testing
  // with the identical password just failed the same way forever). Logging
  // the raw code/status/message here means the next unmapped case shows up
  // in the device/Metro logs instead of requiring another guess-and-patch
  // round trip.
  console.warn("[auth] unmapped error, falling back to error.generic", { code, status, message: error.message });
  return "error.generic";
}

// Dev-only tail appended to an error message on screen — e.g. "[weak_password]"
// — so the raw Supabase code is visible without needing a Metro/logcat
// session attached to the device. Empty in a release build (__DEV__ false),
// where a raw engine code has no business being user-facing.
export function debugErrorSuffix(error: AuthError | Error | null): string {
  if (!__DEV__ || !error) return "";
  const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
  return ` [${code ?? error.message}]`;
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

// Same web flow as signInWithGoogle, but supabase.auth.linkIdentity attaches
// the OAuth identity to the CURRENT (anonymous) session's user instead of
// signing in to a separate one — see linkEmailToAnonymousUser's comment for
// why that distinction matters. Once the exchange lands (exchangeCodeFromUrl,
// same as any other OAuth return), `is_anonymous` flips to false immediately
// — no email confirmation step, Google already vouches for the address.
export async function linkGoogleAccount() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pulvio" });

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error ?? new Error("Google için OAuth URL'i alınamadı") };
  }

  await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  return { error: null };
}

// Apple: the native system flow (iOS only — the button is gated to
// Platform.OS === "ios"). App Store Guideline 4.8 + the Sign in with Apple
// guidelines require the real system sheet, not a web OAuth page. A nonce
// ties Apple's identity token to this request: Apple gets its SHA-256,
// Supabase gets the raw value and re-hashes to compare.
export async function signInWithApple() {
  return appleIdentity((token, nonce) => supabase.auth.signInWithIdToken({ provider: "apple", token, nonce }));
}

// Same native Apple sheet as signInWithApple, but links the identity to the
// current (anonymous) session's user — see linkGoogleAccount's comment.
export async function linkAppleAccount() {
  return appleIdentity((token, nonce) => supabase.auth.linkIdentity({ provider: "apple", token, nonce }));
}

async function appleIdentity(
  exchange: (token: string, nonce: string) => Promise<{ error: AuthError | null }>
) {
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

    const { error } = await exchange(credential.identityToken, rawNonce);
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
