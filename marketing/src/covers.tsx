import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Glow, Stars } from "./parts";
import { C, FONT } from "./theme";

const Disc: React.FC<{ cover: string; size: number }> = ({ cover, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      border: `${Math.max(3, size / 120)}px solid ${C.accent}`,
      boxShadow: "0 0 120px 30px rgba(242,180,140,0.28)",
    }}
  >
    <Img src={staticFile(`covers/${cover}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

// Thumbnail for the profile grid / feed. Key content stays inside the central 3:4 crop
// (between ~12% and ~88% of the height), brand mark at the bottom of that area.
export const Cover: React.FC<{ title: string; sub?: string; covers: string[]; moon?: boolean }> = ({ title, sub, covers, moon }) => (
  <AbsoluteFill style={{ fontFamily: FONT }}>
    <Glow />
    <Stars />
    <div style={{ position: "absolute", left: 70, right: 70, top: "17%", textAlign: "center", fontSize: 118, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, color: C.text }}>
      {title}
    </div>
    {sub ? (
      <div style={{ position: "absolute", left: 90, right: 90, top: "37%", textAlign: "center", fontSize: 58, fontWeight: 500, lineHeight: 1.2, color: C.accent }}>{sub}</div>
    ) : null}
    <div style={{ position: "absolute", left: 0, right: 0, top: "52%", display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
      {moon ? (
        <div style={{ width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle at 38% 34%, ${C.moon}, ${C.accent} 45%, ${C.button} 100%)`, boxShadow: "0 0 160px 60px rgba(242,180,140,0.35)" }} />
      ) : covers.length === 1 ? (
        <Disc cover={covers[0]} size={500} />
      ) : (
        covers.map((c) => <Disc key={c} cover={c} size={290} />)
      )}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: "82%", display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
      <Img src={staticFile("icon.png")} style={{ width: 96, height: 96, borderRadius: 22 }} />
      <div style={{ fontSize: 66, fontWeight: 800, color: C.text }}>Pulvio</div>
    </div>
  </AbsoluteFill>
);
