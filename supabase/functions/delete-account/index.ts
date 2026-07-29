// Pulvio — hesap silme
// Google Play politikası, hesap oluşturmaya izin veren uygulamalardan hem
// uygulama içi hem web üzerinden hesap silme talebi imkanı istiyor. Bu
// fonksiyon uygulama içi tarafı karşılıyor.
//
// auth.users satırı silindiğinde subscriptions/listening_sessions/cooldowns
// tabloları "on delete cascade" ile otomatik temizleniyor (bkz. 0001_schema.sql),
// bu yüzden burada ayrıca satır silmeye gerek yok.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("delete-account: eksik ortam değişkeni (url/anon-key/service-role-key)");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Silinecek kullanıcıyı, isteği yapanın kendi JWT'sinden tespit ediyoruz —
  // body'den user_id almıyoruz, böylece biri başkasının hesabını silemez.
  const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser();
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    console.error("delete-account: kullanıcı silinemedi", deleteError);
    return new Response("Delete failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
