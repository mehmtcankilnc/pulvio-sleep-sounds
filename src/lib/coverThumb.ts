import { useCallback, useState } from "react";

// Kategori kapakları 1254x1254 PNG (~2 MB); kutular ise ~160x112 dp gösterir. Liste/raf
// ekranları bunun yerine scripts/make-cover-thumbs.mjs'in R2'ye koyduğu 480x480 WebP
// önizlemeyi (covers/t/<slug>.webp, ~20 KB) çeker. Oyuncu ekranı tam boyutu kullanır.
//   .../covers/yagmur.png  ->  .../covers/t/yagmur.webp
const FULL_COVER = /^(https?:\/\/[^/]+\/covers\/)([a-z0-9_]+)\.png$/i;

export function coverThumbUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = FULL_COVER.exec(url);
  return match ? `${match[1]}t/${match[2]}.webp` : url;
}

// Önizlemeyi dener; yüklenemezse (henüz üretilmemiş yeni kapak, çevrimdışı vb.)
// bir kez tam boyutlu kapağa düşer, o da başarısız olursa `uri` undefined olur ->
// çağıran bileşen ikon yedeğini gösterir (eski `imageFailed` davranışıyla aynı).
export function useCoverSource(coverUrl: string | undefined) {
  const thumb = coverThumbUrl(coverUrl);
  const [useOriginal, setUseOriginal] = useState(false);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => {
    if (!useOriginal && thumb !== coverUrl) setUseOriginal(true);
    else setFailed(true);
  }, [useOriginal, thumb, coverUrl]);
  return { uri: failed ? undefined : useOriginal ? coverUrl : thumb, onError };
}
