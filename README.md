# Pulvio — Faz 1 İskelet

## Kurulum

```bash
npm install
npx expo install --fix   # Expo SDK ile paket versiyonlarını hizala
npx expo start
```

## Yapı

- `app/` — Expo Router ekranları
  - `_layout.tsx` — Root stack, global.css burada import ediliyor
  - `(tabs)/` — Alt navigasyon: Keşfet, Player, Ayarlar (şimdilik placeholder)
- `src/store/` — Zustand store'ları
  - `usePlayerStore.ts` — çalma durumu, aktif track, geçen süre
  - `useUserStore.ts` — kullanıcı, abonelik durumu, cooldown bitiş zamanı
- `src/types/` — paylaşılan TypeScript tipleri
- `global.css` + `tailwind.config.js` + `metro.config.js` — NativeWind kurulumu

## Notlar

- `cooldownEndsAt` bilinçli olarak sadece **backend'den gelen** bir değer olarak
  tasarlandı — cihazda hesaplanmıyor, böylece kullanıcı saat/tarih değiştirerek
  cooldown'ı bypass edemez. Faz 4'te bu alanı dolduracak API çağrısını ekleyeceğiz.
- Şu an sadece iskelet var; UI tasarımına henüz girilmedi.
