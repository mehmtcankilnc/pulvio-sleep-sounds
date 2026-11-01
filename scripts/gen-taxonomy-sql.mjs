// node scripts/gen-taxonomy-sql.mjs  ->  supabase/migrations/0023_server_driven_catalog.sql
// Mevcut etiketler src/locales/*/catalog.json'dan, yeniler scripts/taxonomy.mjs'ten.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, EXISTING_ICONS, NEW_SUBCATEGORIES, SUB_ORDER } from "./taxonomy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["tr", "en", "de", "fr", "es", "pt"];
const glyphs = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json"), "utf8"),
);

const locale = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(root, "src/locales", l, "catalog.json"), "utf8"))]),
);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const labelsOf = (get) => {
  const o = Object.fromEntries(LANGS.map((l) => [l, get(l)]));
  for (const [l, v] of Object.entries(o)) if (!v) throw new Error(`label eksik: ${l}`);
  return q(JSON.stringify(o));
};
const checkIcon = (icon) => {
  if (!(icon in glyphs)) throw new Error(`Ionicons glyph yok: ${icon}`);
  return q(icon);
};

const newById = new Map(NEW_SUBCATEGORIES.map((s) => [s.id, s]));
const catRows = CATEGORIES.map((c, i) => {
  const labels = c.existing ? labelsOf((l) => locale[l].category[c.id]) : labelsOf((l) => c.labels[l]);
  return `  (${q(c.id)}, ${(i + 1) * 10}, ${labels}, ${checkIcon(c.icon)})`;
});

const subRows = [];
for (const [category, ids] of Object.entries(SUB_ORDER)) {
  ids.forEach((id, i) => {
    const fresh = newById.get(id);
    if (fresh && fresh.category !== category) throw new Error(`${id} kategori uyuşmazlığı`);
    const labels = fresh ? labelsOf((l) => fresh.labels[l]) : labelsOf((l) => locale[l].subcategory[id]);
    const icon = fresh ? fresh.icon : EXISTING_ICONS[id];
    if (!icon) throw new Error(`${id} için ikon yok`);
    subRows.push(`  (${q(id)}, ${q(category)}, ${(i + 1) * 10}, ${labels}, ${checkIcon(icon)})`);
  });
}
const seen = new Set(Object.values(SUB_ORDER).flat());
for (const s of NEW_SUBCATEGORIES) if (!seen.has(s.id)) throw new Error(`${s.id} SUB_ORDER'da yok`);

const sql = `-- Pulvio — sunucu güdümlü katalog (OTOMATİK ÜRETİLDİ: node scripts/gen-taxonomy-sql.mjs).
-- Kaynak: scripts/taxonomy.mjs + src/locales/*/catalog.json. Elle düzenleme; kaynağı değiştir, yeniden üret.
--
-- Amaç: kategori/alt kategori etiketi, sırası, ikonu ve parça başlığı çevirileri
-- istemci paketinden çıkıp veritabanına taşındı. Bundan sonra yeni içerik
-- (parça, alt kategori, üst kategori, çeviri) mağaza güncellemesi gerektirmez.
--
-- Eski istemci (1.0.0) koruması aşağıda: yeni alt kategorili parçalar
-- min_client_version ile işaretlenir ve 1.0.0'a RLS ile gösterilmez.

create table if not exists public.catalog_categories (
  id text primary key,
  sort_order int not null default 0,
  labels jsonb not null,           -- {"tr": "...", "en": "...", ...}
  icon text not null default 'moon-outline',  -- Ionicons glyph adı
  active boolean not null default true
);

create table if not exists public.catalog_subcategories (
  id text primary key,
  category_id text not null references public.catalog_categories (id),
  sort_order int not null default 0,
  labels jsonb not null,
  icon text not null default 'moon-outline',
  active boolean not null default true
);

-- Eski istemci koruması: min_client_version dolu parçalar, x-app-version başlığı
-- (src/lib/supabase.ts) bu sürümün altında olan ya da hiç göndermeyen istemcilere
-- (1.0.0) GÖRÜNMEZ. Böylece 1.0.0, bilmediği alt kategoriyi ham slug + varsayılan
-- ikonla asla göstermez. Yeni alt kategorili her parça '1.1.0' ile eklenir
-- (scripts/add-tracks.mjs bunu otomatik yapar).
alter table public.tracks add column if not exists min_client_version text;

create or replace function public.client_version_at_least(min_version text)
returns boolean
language plpgsql
stable
as $fn$
declare
  v text;
begin
  if min_version is null then
    return true;
  end if;
  v := nullif(current_setting('request.headers', true), '')::json ->> 'x-app-version';
  if v is null or v !~ '^[0-9]+([.][0-9]+){0,2}$' then
    return false;
  end if;
  return string_to_array(v, '.')::int[] >= string_to_array(min_version, '.')::int[];
exception when others then
  return false;
end;
$fn$;

drop policy if exists "tracks_select_all" on public.tracks;
create policy "tracks_select_all" on public.tracks for select
  using (public.client_version_at_least(min_client_version));

-- Parça başlığı çevirileri: {"en": "...", "de": "..."}; TR başlık \`title\` kolonunda kalır.
alter table public.tracks add column if not exists title_i18n jsonb;

-- Uygulama sürüm/uyarı ayarı (platform başına tek satır).
create table if not exists public.app_config (
  platform text primary key check (platform in ('ios', 'android')),
  latest_version text not null,    -- mağazadaki en güncel sürüm (x.y.z)
  min_version text not null,       -- bunun altı zorunlu güncelleme
  store_url text,                  -- null ise istemci Android için Play linkine düşer, iOS'ta uyarı gizlenir
  message_i18n jsonb               -- opsiyonel gövde metni: {"tr": "...", "en": "..."}
);

alter table public.catalog_categories enable row level security;
alter table public.catalog_subcategories enable row level security;
alter table public.app_config enable row level security;

drop policy if exists "catalog_categories_select_all" on public.catalog_categories;
create policy "catalog_categories_select_all" on public.catalog_categories for select using (true);
drop policy if exists "catalog_subcategories_select_all" on public.catalog_subcategories;
create policy "catalog_subcategories_select_all" on public.catalog_subcategories for select using (true);
drop policy if exists "app_config_select_all" on public.app_config;
create policy "app_config_select_all" on public.app_config for select using (true);

insert into public.catalog_categories (id, sort_order, labels, icon) values
${catRows.join(",\n")}
on conflict (id) do update set sort_order = excluded.sort_order, labels = excluded.labels, icon = excluded.icon;

insert into public.catalog_subcategories (id, category_id, sort_order, labels, icon) values
${subRows.join(",\n")}
on conflict (id) do update set category_id = excluded.category_id, sort_order = excluded.sort_order, labels = excluded.labels, icon = excluded.icon;

-- Başlangıç: herkes güncel (uyarı çıkmaz). Yeni sürüm yayınlanınca:
--   update public.app_config set latest_version = '1.1.0', store_url = '<mağaza linki>' where platform = 'ios';
insert into public.app_config (platform, latest_version, min_version, store_url) values
  ('ios', '1.0.0', '1.0.0', null),
  ('android', '1.0.0', '1.0.0', 'https://play.google.com/store/apps/details?id=com.pulvio.app')
on conflict (platform) do nothing;
`;

const out = path.join(root, "supabase/migrations/0023_server_driven_catalog.sql");
fs.writeFileSync(out, sql);
console.log(`yazıldı: ${out}\n${catRows.length} kategori, ${subRows.length} alt kategori`);
