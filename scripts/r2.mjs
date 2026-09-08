// Pulvio — Cloudflare R2 (S3 uyumlu) yükleme yardımcıları.
// upload-audio.mjs, upload-covers.mjs ve migrate-storage-to-r2.mjs tarafından
// paylaşılır. Bağımlılık: @aws-sdk/client-s3  (npm i -D @aws-sdk/client-s3)
//
// Gerekli ortam değişkenleri (.env'den otomatik okunur — sadece SCRIPT tarafı,
// asla EXPO_PUBLIC değil; R2 anahtarları uygulamaya girmez):
//   R2_ACCOUNT_ID
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET          (ör. pulvio-media)
//   R2_PUBLIC_BASE     (ör. https://cdn.pulvio.mehmtcankilinc.com — sondaki / olmadan)

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE,
} = process.env;

// Sabit CDN domaini — bir sır değil; --sql çıktısı ve URL üretimi R2 anahtarları
// olmadan da doğru sonucu versin diye varsayılanı burada.
export const PUBLIC_BASE = (R2_PUBLIC_BASE || "https://cdn.pulvio.mehmtcankilinc.com").replace(/\/$/, "");
export const BUCKET = R2_BUCKET;

export function assertR2Env() {
  const missing = [
    ["R2_ACCOUNT_ID", R2_ACCOUNT_ID],
    ["R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET", R2_BUCKET],
    ["R2_PUBLIC_BASE", R2_PUBLIC_BASE],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`\nEksik R2 ortam değişkenleri (.env): ${missing.join(", ")}`);
    process.exit(1);
  }
}

// R2 anahtarı Supabase'deki yolla aynı: "tracks/<subcat>/<id>.mp3", "covers/<x>.png"
export const publicUrl = (key) => `${PUBLIC_BASE}/${key.replace(/^\/+/, "")}`;

let _client = null;
async function client() {
  if (_client) return _client;
  assertR2Env();
  const { S3Client } = await import("@aws-sdk/client-s3");
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return _client;
}

export async function putObject(key, body, contentType) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const c = await client();
  await c.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key.replace(/^\/+/, ""),
      Body: body,
      ContentType: contentType,
      // Uzun ömürlü, içeriği değişmeyen medya — CDN + istemci agresif cache'lesin.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function objectExists(key) {
  const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
  const c = await client();
  try {
    await c.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key.replace(/^\/+/, "") }));
    return true;
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") return false;
    throw e;
  }
}
