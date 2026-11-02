import React from "react";
import { AbsoluteFill, Audio, Img, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Bridge, Cta, Glow, Kinetic, Line, Stars } from "./parts";
import { C } from "./theme";

// ---------------------------------------------------------------------------------------------
// Orbit wave: 8 dots on concentric rings around the app icon. Ring i is crossed at 12 o'clock m_i = 11-i times in 15s
// (inner = fastest = highest note); every crossing plucks a note (public/sfx/orbit.mp3, sfx_pendulum.py: keep in sync).
// Everything is at the top at t=0 and t=15.
// ---------------------------------------------------------------------------------------------
const FPS = 30;
const T = 15;
const M = [11, 10, 9, 8, 7, 6, 5, 4];
const N = M.length;
const CX = 540;
const CY = 960;
const radius = (i: number) => 118 + i * 52;
export const ORBIT_FRAMES = T * FPS + 125 + 75;

const color = (i: number) => interpolateColors(i, [0, N * 0.5, N - 1], [C.moon, C.accent, C.button]);
const angle = (i: number, t: number) => -Math.PI / 2 + (2 * Math.PI * M[i] * Math.min(t, T)) / T;

const hit = (i: number, t: number) => {
  if (t >= T) return { dt: t - T, big: true };
  const k = Math.floor((t * M[i]) / T);
  return { dt: t - (k * T) / M[i], big: k === 0 };
};

const Dim: React.FC = () => <AbsoluteFill style={{ background: "rgba(18,10,16,0.9)" }} />;

export const OrbitWave: React.FC<{ hook: string }> = ({ hook }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const infos = M.map((_, i) => hit(i, t));
  const pulse = 1 + 0.12 * Math.exp(-Math.min(...infos.map((h) => h.dt)) * 10);
  return (
    <AbsoluteFill>
      <Glow />
      <Stars count={50} />
      <Audio src={staticFile("sfx/orbit.mp3")} volume={1} />
      <div style={{ position: "absolute", left: CX - 1.5, top: CY - radius(N - 1) - 40, width: 3, height: radius(N - 1) + 40, background: "linear-gradient(180deg, transparent, rgba(242,180,140,0.3))" }} />
      {M.map((_, i) => {
        const r = radius(i);
        const { dt, big } = infos[i];
        const flash = Math.exp(-dt * 6) * (big ? 1 : 0.8);
        const a = angle(i, t);
        const c = color(i);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: CX - r, top: CY - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `${3 + 5 * flash}px solid ${c}`, opacity: 0.2 + 0.7 * flash, boxSizing: "border-box" }} />
            {dt < 0.7 ? (
              <div style={{ position: "absolute", left: CX, top: CY - r, width: 30 + dt * 220, height: 30 + dt * 220, marginLeft: -(15 + dt * 110), marginTop: -(15 + dt * 110), borderRadius: "50%", border: `3px solid ${c}`, opacity: Math.exp(-dt * 5) * 0.8 }} />
            ) : null}
            {[7, 6, 5, 4, 3, 2, 1].map((d) => {
              const ag = angle(i, Math.max(0, (f - d * 1.5) / FPS));
              return <div key={d} style={{ position: "absolute", left: CX + r * Math.cos(ag), top: CY + r * Math.sin(ag), width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: "50%", background: c, opacity: 0.03 + (7 - d) * 0.018, filter: "blur(2px)" }} />;
            })}
            <div style={{ position: "absolute", left: CX + r * Math.cos(a), top: CY + r * Math.sin(a), width: 38, height: 38, marginLeft: -19, marginTop: -19, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff6ee, ${c} 60%)`, boxShadow: `0 0 ${24 + 40 * flash}px ${c}` }} />
          </React.Fragment>
        );
      })}
      <Img src={staticFile("icon.png")} style={{ position: "absolute", left: CX - 70, top: CY - 70, width: 140, height: 140, borderRadius: 32, transform: `scale(${pulse})`, boxShadow: "0 0 90px 20px rgba(242,180,140,0.4)" }} />
      <Kinetic text={hook} from={0} to={T * FPS - 8} size={92} step={3} top="12.5%" />
      <Line from={14} to={T * FPS - 8} top="21%" size={44} weight={500} color={C.muted}>sound on</Line>
      <Line from={T * FPS - 4} to={T * FPS + 60} top="13%" size={130} color={C.accent}>Perfect.</Line>
      <Sequence from={T * FPS + 50} durationInFrames={78}>
        <Dim />
        <Bridge covers={["cadir_yagmuru", "gol_kiyisi", "damla"]} line="200+ sounds for sleep" />
      </Sequence>
      <Sequence from={T * FPS + 125}>
        <Dim />
        <Cta from={0} />
      </Sequence>
    </AbsoluteFill>
  );
};
