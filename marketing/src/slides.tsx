import React from "react";
import { AbsoluteFill, continueRender, delayRender, Img, staticFile } from "remotion";
import { Glow, Stars } from "./parts";
import { C, FONT } from "./theme";

// TikTok photo-mode slides (1080x1920). Words stay out of the top 240px and the bottom 520px
// (TikTok's tabs and caption). Side margins are equal (180px) so everything is centered on
// the screen and also clears the right-hand buttons.
const PLATFORMS = {
  tiktok: { safe: { left: 180, top: 240, width: 720, height: 1160 }, dotsTop: 1384, spacer: 130 },
  // Instagram carousel, 1080x1350 (4:5): no app buttons over the slide, only the grid crop on slide 1.
  instagram: { safe: { left: 120, top: 105, width: 840, height: 1140 }, dotsTop: 1272, spacer: 20 },
} as const;

export type Platform = keyof typeof PLATFORMS;
const PlatformCtx = React.createContext<Platform>("tiktok");

const Safe: React.FC<{ children: React.ReactNode; justify?: "center" | "flex-end" }> = ({ children, justify = "center" }) => {
  const SAFE = PLATFORMS[React.useContext(PlatformCtx)].safe;
  return (
  <div
    style={{
      position: "absolute",
      left: SAFE.left,
      top: SAFE.top,
      width: SAFE.width,
      height: SAFE.height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: justify,
      textAlign: "center",
      gap: 36,
    }}
  >
    {children}
  </div>
  );
};

const Title: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 130 }) => (
  <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.03, letterSpacing: -3, color: C.text, textShadow: "0 4px 40px rgba(0,0,0,0.55)" }}>{children}</div>
);

const Sub: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 56 }) => (
  <div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.2, color: C.accent, textShadow: "0 3px 30px rgba(0,0,0,0.6)" }}>{children}</div>
);

const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.accent }}>{children}</span>;

// Full-bleed cover art as the slide background, darkened so words stay readable.
const Bg: React.FC<{ cover: string; blur?: number; dim?: number }> = ({ cover, blur = 0, dim = 0.5 }) => (
  <AbsoluteFill>
    <Img src={staticFile(`bg/${cover}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${blur}px) brightness(${dim})` }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(18,10,16,0.55) 0%, rgba(18,10,16,0) 30%, rgba(18,10,16,0.35) 62%, rgba(18,10,16,0.92) 100%)" }} />
  </AbsoluteFill>
);

const Dots: React.FC<{ n: number; total: number }> = ({ n, total }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: PLATFORMS[React.useContext(PlatformCtx)].dotsTop, display: "flex", justifyContent: "center", gap: 16 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ width: i + 1 === n ? 44 : 14, height: 14, borderRadius: 7, background: i + 1 === n ? C.accent : "rgba(246,237,233,0.35)" }} />
    ))}
  </div>
);

const CoverArt: React.FC<{ cover: string; size: number; radius?: number }> = ({ cover, size, radius = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", border: `3px solid ${C.accent}`, boxShadow: "0 0 80px 10px rgba(242,180,140,0.22)", flexShrink: 0 }}>
    <Img src={staticFile(`covers/${cover}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

// A lock-screen notification from "Brain": obviously a joke, not an app feature.
const Notice: React.FC<{ from: string; icon: string; text: string; when: string }> = ({ from, icon, text, when }) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      gap: 24,
      padding: "22px 28px",
      borderRadius: 44,
      background: "rgba(36,26,32,0.62)",
      border: "2px solid rgba(246,237,233,0.16)",
      boxShadow: "0 10px 50px rgba(0,0,0,0.35)",
      textAlign: "left",
    }}
  >
    <div style={{ width: 76, height: 76, borderRadius: 19, flexShrink: 0, background: `linear-gradient(160deg, ${C.accent}, ${C.button})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>
        <span>{from}</span>
        <span style={{ fontWeight: 500 }}>{when}</span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.16, color: C.text, marginTop: 4 }}>{text}</div>
    </div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: "20px 44px", borderRadius: 60, background: C.accent, color: C.bgDeep, fontSize: 50, fontWeight: 800 }}>{children}</div>
);

// A ring that empties: the sleep timer idea without pretending to be an app screen.
const FadeRing: React.FC = () => {
  const r = 220;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={440} height={440} viewBox="0 0 540 540" style={{ filter: "drop-shadow(0 0 60px rgba(242,180,140,0.35))" }}>
      <circle cx={270} cy={270} r={r} fill="none" stroke="rgba(246,237,233,0.14)" strokeWidth={26} />
      <circle cx={270} cy={270} r={r} fill="none" stroke={C.accent} strokeWidth={26} strokeLinecap="round" strokeDasharray={`${circ * 0.6} ${circ}`} transform="rotate(-90 270 270)" />
      <circle cx={270} cy={270} r={110} fill={C.accent} opacity={0.92} />
      <circle cx={270} cy={270} r={170} fill="none" stroke={C.accent} strokeWidth={4} opacity={0.35} />
    </svg>
  );
};

const NOTES = [
  { from: "MOM", icon: "👩", text: "Are you up? The pigeon is back.", when: "3:02 AM" },
  { from: "EX", icon: "🥀", text: "i think about your cat sometimes", when: "3:05 AM" },
  { from: "BOSS", icon: "💼", text: "Quick call at 3:10? Just kidding. Unless?", when: "now" },
];

const SOUNDS = [
  { cover: "cadir_yagmuru", name: "Rain on a tent", line: "Steady. Nothing to follow." },
  { cover: "gol_kiyisi", name: "Lake shore", line: "Slow water. Nothing to figure out." },
  { cover: "damla", name: "Slow drips", line: "Quiet, predictable, boring on purpose." },
];

export const SLIDES_3AM = 7;

// LEGACY (2026-11-04): "Your 3 AM group chat" deck. Posted on Instagram only; TikTok moved to the rain format (`SlidesRain` below). Kept so the Instagram post can be rebuilt.
// "Your 3 AM group chat" slideshow. 1 lock-screen hook, 2 second cover + app, 3-5 real covers,
// 6 fade-out, 7 ask.
export const Slides3am: React.FC<{ n: number; platform?: Platform }> = ({ n, platform = "tiktok" }) => {
  const P = PLATFORMS[platform];
  let body: React.ReactNode;
  let bg: React.ReactNode = (
    <>
      <Glow />
      <Stars />
    </>
  );

  if (n === 1) {
    bg = <Bg cover="sehir_yagmuru" blur={10} dim={0.55} />;
    body = (
      <Safe>
        <div style={{ fontSize: 200, fontWeight: 300, lineHeight: 0.95, letterSpacing: -6, color: C.text, textShadow: "0 6px 60px rgba(0,0,0,0.5)" }}>3:07</div>
        <Title size={104}>
          Your <Accent>3 AM</Accent>
          <br />
          group chat.
        </Title>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {NOTES.map((s) => (
            <Notice key={s.text} {...s} />
          ))}
        </div>
      </Safe>
    );
  } else if (n === 2) {
    bg = <Bg cover="gol_kiyisi" blur={14} dim={0.45} />;
    body = (
      <Safe>
        <Img src={staticFile("icon.png")} style={{ width: 230, height: 230, borderRadius: 52, boxShadow: "0 0 120px 30px rgba(242,180,140,0.35)" }} />
        <Title size={128}>
          Put this on
          <br />
          <Accent>instead.</Accent>
        </Title>
        <Sub>Pulvio: sleep sounds that fade out on their own.</Sub>
      </Safe>
    );
  } else if (n >= 3 && n <= 5) {
    const s = SOUNDS[n - 3];
    bg = <Bg cover={s.cover} dim={0.85} />;
    body = (
      <Safe justify="flex-end">
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 8, color: C.accent, textTransform: "uppercase", textShadow: "0 3px 30px rgba(0,0,0,0.6)" }}>Sound {n - 2} of 3</div>
        <Title size={140}>{s.name}</Title>
        <Sub size={54}>{s.line}</Sub>
        <div style={{ height: P.spacer }} />
      </Safe>
    );
  } else if (n === 6) {
    body = (
      <Safe>
        <FadeRing />
        <Title size={124}>
          Then
          <br />
          <Accent>forget it.</Accent>
        </Title>
        <Sub>It fades out on its own. Nothing to turn off.</Sub>
      </Safe>
    );
  } else {
    body = (
      <Safe>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24, width: 720 }}>
          {["yagmur_ormani", "kalimba", "sehir_yagmuru", "magara_damla", "selale", "kar_kis"].map((c) => (
            <CoverArt key={c} cover={c} size={224} radius={34} />
          ))}
        </div>
        <Title size={112}>
          200+ sounds <Accent>for sleep</Accent>
        </Title>
        <Pill>Free to start</Pill>
        <Sub size={50}>
          {platform === "instagram" ? (
            <>
              Link in bio
              <br />
              Pulvio on the App Store
            </>
          ) : (
            <>
              Search “Pulvio”
              <br />
              on the App Store
            </>
          )}
        </Sub>
      </Safe>
    );
  }

  return (
    <PlatformCtx.Provider value={platform}>
      <AbsoluteFill style={{ fontFamily: FONT }}>
        {bg}
        {body}
        {n < SLIDES_3AM ? <Dots n={n} total={SLIDES_3AM} /> : null}
      </AbsoluteFill>
    </PlatformCtx.Provider>
  );
};

// "Rain" slideshow: the sound is the product. Photos with a few small lowercase words, as plain
// as a normal post. 1 hook, 2 turn the sound on, 3 the keyword people search, 4 the app.
// Text is set like TikTok's own text: Figtree bold, white, black outline (`classic`, chosen 2026-11-04). The other styles stay for comparison. Fonts (OFL) are in public/fonts and loaded before the still is captured.
const SERIF = `"Instrument Serif", Georgia, "Times New Roman", serif`;

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

const useSerif = () => {
  const [handle] = React.useState(() => delayRender("Loading Instrument Serif"));
  React.useEffect(() => {
    const faces = [
      new FontFace("Instrument Serif", `url(${staticFile("fonts/instrument-serif-latin-400-normal.woff2")})`, { style: "normal" }),
      new FontFace("Instrument Serif", `url(${staticFile("fonts/instrument-serif-latin-400-italic.woff2")})`, { style: "italic" }),
      new FontFace("Figtree", `url(${staticFile("fonts/figtree-latin-700-normal.woff2")})`, { weight: "700", unicodeRange: LATIN }),
      new FontFace("Figtree", `url(${staticFile("fonts/figtree-latin-800-normal.woff2")})`, { weight: "800", unicodeRange: LATIN }),
      // latin-ext carries the Turkish ş ğ İ
      new FontFace("Figtree", `url(${staticFile("fonts/figtree-latin-ext-700-normal.woff2")})`, { weight: "700", unicodeRange: LATIN_EXT }),
      new FontFace("Figtree", `url(${staticFile("fonts/figtree-latin-ext-800-normal.woff2")})`, { weight: "800", unicodeRange: LATIN_EXT }),
    ];
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => loaded.forEach((f) => document.fonts.add(f)))
      .catch(() => {})
      .finally(() => continueRender(handle));
  }, [handle]);
};

const APP_LINES = ["200+ sleep sounds", "search “Pulvio” on the App Store"];

// Four slides a deck: hook, a short turn, the keyword people search, the app.
export const RAIN_DECKS = {
  rain: [
    { bg: "sehir_yagmuru", lines: ["can’t sleep?"] },
    { bg: "cadir_yagmuru", lines: ["put this on"] },
    { bg: "yagmur_ormani", lines: ["rain sounds for sleep"] },
    { bg: "damla", lines: APP_LINES },
  ],
  tent: [
    { bg: "cadir_yagmuru", lines: ["rain on a tent hits different"] },
    { bg: "yagmur_ormani", lines: ["close your eyes"] },
    { bg: "sehir_yagmuru", lines: ["rain sounds for sleep"] },
    { bg: "damla", lines: APP_LINES },
  ],
  night: [
    { bg: "sehir_yagmuru", lines: ["3 AM. you needed this."] },
    { bg: "cadir_yagmuru", lines: ["just listen"] },
    { bg: "gol_kiyisi", lines: ["lake sounds for sleep"] },
    { bg: "damla", lines: APP_LINES },
  ],
  sound: [
    { bg: "yagmur_ormani", lines: ["turn your sound on for this"] },
    { bg: "magara_damla", lines: ["keep it on"] },
    { bg: "selale", lines: ["waterfall sounds for sleep"] },
    { bg: "damla", lines: APP_LINES },
  ],
  // Turkish version (X account, Turkish audience)
  "rain-tr": [
    { bg: "sehir_yagmuru", lines: ["uyuyamıyor musun?"] },
    { bg: "cadir_yagmuru", lines: ["bunu aç"] },
    { bg: "yagmur_ormani", lines: ["uyku için\nyağmur sesi"] },
    { bg: "damla", lines: ["200+ uyku sesi", "link profilde"] },
  ],
} as const;

export type RainDeck = keyof typeof RAIN_DECKS;
export const SLIDES_RAIN = 4;

export type RainType = "instrument" | "times" | "classic" | "label";

// Text styles compared on 2026-11-04; the owner picks one.
const RAIN_TYPE: Record<RainType, { fontFamily: string; main: React.CSSProperties; sub: React.CSSProperties; box?: React.CSSProperties }> = {
  instrument: {
    fontFamily: SERIF,
    main: { fontSize: 112, letterSpacing: -1, lineHeight: 1.12 },
    sub: { fontSize: 64, fontStyle: "italic", lineHeight: 1.12, opacity: 0.92 },
  },
  times: {
    fontFamily: `"Times New Roman", Times, serif`,
    main: { fontSize: 76, lineHeight: 1.2 },
    sub: { fontSize: 52, lineHeight: 1.2, opacity: 0.92 },
  },
  classic: {
    fontFamily: `"Figtree", "Segoe UI", sans-serif`,
    main: { fontSize: 84, fontWeight: 800, lineHeight: 1.12, WebkitTextStroke: "14px #000", paintOrder: "stroke fill" },
    sub: { fontSize: 56, fontWeight: 700, lineHeight: 1.12, WebkitTextStroke: "12px #000", paintOrder: "stroke fill" },
  },
  label: {
    fontFamily: `"Figtree", "Segoe UI", sans-serif`,
    main: { fontSize: 70, fontWeight: 700, lineHeight: 1.15, color: "#111" },
    sub: { fontSize: 48, fontWeight: 700, lineHeight: 1.15, color: "#111" },
    box: { background: "#fff", borderRadius: 26, padding: "14px 34px", display: "inline-block", textShadow: "none" },
  },
};

export const SlidesRain: React.FC<{ n: number; deck?: RainDeck; type?: RainType }> = ({ n, deck = "rain", type = "classic" }) => {
  useSerif();
  const s = RAIN_DECKS[deck][n - 1];
  const t = RAIN_TYPE[type];
  return (
    <AbsoluteFill style={{ fontFamily: t.fontFamily }}>
      <AbsoluteFill>
        <Img src={staticFile(`bg/${s.bg}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.82)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 22% at 50% 47%, rgba(10,6,10,0.5), transparent 75%)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, width: 840, top: 840, textAlign: "center", color: "#fff", textShadow: "0 2px 28px rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        {s.lines.map((l, i) => (
          <div key={l} style={{ ...(i === 0 ? t.main : t.sub), ...(t.box ?? {}), whiteSpace: "pre-line" }}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
