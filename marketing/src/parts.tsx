import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Glow: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const breathe = 0.75 + 0.25 * Math.sin(t * 0.9);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bg} 55%, ${C.bgDeep} 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 38% at ${50 + Math.sin(t * 0.3) * 6}% 78%, rgba(242,180,140,${0.5 * breathe * intensity}) 0%, rgba(217,126,82,${0.18 * intensity}) 45%, transparent 75%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Stars: React.FC<{ count?: number }> = ({ count = 70 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }).map((_, i) => {
        const size = 2 + random(`s${i}`) * 4;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(f / 30 + random(`p${i}`) * 6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`x${i}`) * width,
              top: random(`y${i}`) * height * 0.7,
              width: size,
              height: size,
              borderRadius: "50%",
              background: C.star,
              opacity: tw * 0.8,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Rain: React.FC<{ drops?: number }> = ({ drops = 90 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity: 0.55 }}>
      {Array.from({ length: drops }).map((_, i) => {
        const speed = 18 + random(`v${i}`) * 22;
        const len = 50 + random(`l${i}`) * 90;
        const y = ((f * speed + random(`ry${i}`) * (height + 400)) % (height + 400)) - 200;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`rx${i}`) * width,
              top: y,
              width: 3,
              height: len,
              borderRadius: 2,
              background: `linear-gradient(180deg, transparent, ${C.accent})`,
              opacity: 0.25 + random(`o${i}`) * 0.5,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Orb: React.FC<{ size?: number; top?: string }> = ({ size = 520, top = "46%" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = 1 + 0.06 * Math.sin((f / fps) * 1.1);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        width: size,
        height: size,
        transform: `translate(-50%,-50%) scale(${s})`,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 34%, ${C.moon}, ${C.accent} 45%, ${C.button} 100%)`,
        boxShadow: "0 0 160px 60px rgba(242,180,140,0.35)",
      }}
    />
  );
};

export const Rings: React.FC<{ top?: string }> = ({ top = "46%" }) => {
  const f = useCurrentFrame();
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const p = (f / 120 + i / 4) % 1;
        const d = 520 + p * 700;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top,
              width: d,
              height: d,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              border: `3px solid rgba(242,180,140,${(1 - p) * 0.5})`,
            }}
          />
        );
      })}
    </>
  );
};

// Text that fades/rises in at `from` and out at `to` (frames).
export const Line: React.FC<{
  from: number;
  to: number;
  size?: number;
  color?: string;
  weight?: number;
  top?: string;
  children: React.ReactNode;
}> = ({ from, to, size = 92, color = C.text, weight = 700, top = "50%", children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 14, to - 10, to], [0, 1, 1, 0], clamp);
  const y = interpolate(f, [from, from + 18], [28, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top,
        transform: `translateY(calc(-50% + ${y}px))`,
        opacity: o,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight: 1.15,
        letterSpacing: -1,
      }}
    >
      {children}
    </div>
  );
};

// Words pop in one by one (spring), starting at `from`, `step` frames apart; gone at `to`.
export const Kinetic: React.FC<{
  text: string;
  from: number;
  to: number;
  step?: number;
  size?: number;
  color?: string;
  top?: string;
}> = ({ text, from, to, step = 7, size = 100, color = C.text, top = "50%" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const out = interpolate(f, [to - 10, to], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top,
        transform: "translateY(-50%)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `0 ${size * 0.28}px`,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.12,
        letterSpacing: -2,
        color,
        opacity: out,
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: f - (from + i * step), fps, config: { damping: 12, stiffness: 210, mass: 0.6 } });
        return (
          <span key={i} style={{ display: "inline-block", transform: `scale(${s}) translateY(${(1 - s) * 30}px)`, opacity: Math.min(1, s * 1.4) }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Voice: React.FC<{ file: string; at: number; volume?: number }> = ({ file, at, volume = 1 }) => (
  <Sequence from={at}>
    <Audio src={staticFile(`voice/${file}.mp3`)} volume={volume} />
  </Sequence>
);

// Short "what is this app" scene for videos that are not about the app: real cover art + one honest line.
export const Bridge: React.FC<{ covers: string[]; line: string }> = ({ covers, line }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: "38%", display: "flex", justifyContent: "center", gap: 34 }}>
        {covers.map((c, i) => {
          const sc = spring({ frame: f - i * 6, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
          return (
            <div key={c} style={{ width: 280, height: 280, borderRadius: "50%", overflow: "hidden", border: `4px solid ${C.accent}`, transform: `scale(${sc})`, boxShadow: "0 0 90px 20px rgba(242,180,140,0.25)" }}>
              <Img src={staticFile(`covers/${c}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          );
        })}
      </div>
      <Kinetic text={line} from={14} to={9999} size={70} step={5} top="62%" />
    </AbsoluteFill>
  );
};

export const Cta: React.FC<{ from: number; line?: string }> = ({ from, line = "Free on the App Store" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <Img src={staticFile("icon.png")} style={{ width: 240, height: 240, borderRadius: 54, boxShadow: "0 0 120px rgba(242,180,140,0.4)" }} />
      <div style={{ marginTop: 48, fontSize: 108, fontWeight: 800, color: C.text }}>Pulvio</div>
      <div style={{ marginTop: 16, fontSize: 46, color: C.muted }}>{line}</div>
    </AbsoluteFill>
  );
};

export const Sound: React.FC<{ file: string; total: number; volume?: number }> = ({ file, total, volume = 0.9 }) => (
  <Audio
    src={staticFile(`audio/${file}`)}
    volume={(f) => volume * interpolate(f, [0, 30, total - 45, total], [0, 1, 1, 0], clamp)}
  />
);
