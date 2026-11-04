import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT } from "./theme";

// YouTube channel banner, 2560x1440. Everything important stays inside the
// 1546x423 centre "safe area" that shows on every device (TV, desktop, phone).
export const YtBanner: React.FC<{ tagline?: string }> = ({ tagline = "Sleep sounds that fade out on their own" }) => (
  <AbsoluteFill style={{ fontFamily: FONT, background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bg} 55%, ${C.bgDeep} 100%)` }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 50% 52%, rgba(242,180,140,0.42) 0%, rgba(217,126,82,0.14) 50%, transparent 78%)" }} />
    {Array.from({ length: 90 }).map((_, i) => {
      const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
      const size = 3 + r(3) * 6;
      return <div key={i} style={{ position: "absolute", left: r(1) * 2560, top: r(2) * 1440, width: size, height: size, borderRadius: "50%", background: C.star, opacity: 0.25 + r(4) * 0.6 }} />;
    })}
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 70 }}>
      <Img src={staticFile("icon.png")} style={{ width: 260, height: 260, borderRadius: 58, boxShadow: "0 0 140px 30px rgba(242,180,140,0.35)" }} />
      <div>
        <div style={{ fontSize: 190, fontWeight: 800, color: C.text, letterSpacing: -4, lineHeight: 1 }}>Pulvio</div>
        <div style={{ marginTop: 22, fontSize: 56, fontWeight: 500, color: C.accent }}>{tagline}</div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
