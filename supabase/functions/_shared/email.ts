// Resend ile toplu transactional e-posta gönderimi.
// Resend batch endpoint tek istekte en fazla 100 e-posta kabul ediyor, bu
// yüzden expoPush.ts'teki gibi 100'lük parçalara bölünüyor.
// bkz. https://resend.com/docs/api-reference/emails/send-batch-emails
//
// RESEND_API_KEY ve EMAIL_FROM zorunlu — çağıran fonksiyon eksikse baştan
// throw eder (diğer Edge Function'lardaki desen).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// "Pulvio <hello@yourdomain.com>" — domain Resend'de doğrulanmış olmalı.
const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
const CHUNK_SIZE = 100;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY && !!EMAIL_FROM;
}

export async function sendEmails(messages: EmailMessage[]): Promise<void> {
  if (messages.length === 0) return;
  if (!emailConfigured()) {
    console.error("sendEmails: RESEND_API_KEY / EMAIL_FROM tanımlı değil — atlanıyor");
    return;
  }

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE).map((m) => ({
      from: EMAIL_FROM,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
    }));

    try {
      const response = await fetch(RESEND_BATCH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(chunk),
      });
      if (!response.ok) {
        console.error("sendEmails: chunk failed", response.status, await response.text());
      }
    } catch (error) {
      console.error("sendEmails: fetch error", error);
    }
  }
}
