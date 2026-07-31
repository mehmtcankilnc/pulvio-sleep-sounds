// Pulvio — Faz 7: içerik duyurusu
// Elle tetiklenir (ör. `supabase functions invoke send-announcement --data
// '{"title":"...","body":"..."}'`). Yeni ses/kategori eklendiğinde bütün
// push_tokens'a broadcast atar. Admin paneli yok, bu yüzden yetkilendirme
// ANNOUNCEMENT_SECRET ile yapılıyor — aynı desen diğer fonksiyonlarda da var.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sendExpoPushNotifications } from "../_shared/expoPush.ts";

const ANNOUNCEMENT_SECRET = Deno.env.get("ANNOUNCEMENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!ANNOUNCEMENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("send-announcement: eksik ortam değişkeni (secret/url/service-role-key)");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type AnnouncementPayload = {
  title: string;
  body: string;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== ANNOUNCEMENT_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: AnnouncementPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!payload.title || !payload.body) {
    return new Response("title ve body zorunlu", { status: 400 });
  }

  const { data: rows, error } = await supabaseAdmin.from("push_tokens").select("expo_push_token");

  if (error) {
    console.error("send-announcement: query failed", error);
    return new Response("Query failed", { status: 500 });
  }

  const messages = (rows ?? []).map((row) => ({
    to: row.expo_push_token,
    title: payload.title,
    body: payload.body,
  }));

  if (messages.length > 0) {
    await sendExpoPushNotifications(messages);
  }

  return new Response(`Sent to ${messages.length} tokens`, { status: 200 });
});
