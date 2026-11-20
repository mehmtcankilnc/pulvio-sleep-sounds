import React from "react";
import { AbsoluteFill, Audio, Img, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Bridge, Cta, Glow, Kinetic, Line, Stars } from "./parts";
import { C } from "./theme";

// ---------------------------------------------------------------------------------------------
// Concept previews for video 4 (silent, 15 s loop that re-aligns at t=0 and t=15). Not final.
//   ripple-wave : rings leave the icon at different rates, all emit together at t=0 and t=15
//   spiral-wave : a line of dots twists into a spiral and untwists back into a line
//   domino-wave : a grid of tiles whose columns pulse at different rates, so a wave sweeps and re-aligns
// ---------------------------------------------------------------------------------------------
const FPS = 30;
const T = 15;
const CX = 540;
const CY = 960;
export const WAVE_PREVIEW_FRAMES = T * FPS + 60;

const mix = (i: number, n: number) => interpolateColors(i, [0, (n - 1) * 0.5, n - 1], [C.moon, C.accent, C.button]);

const Frame: React.FC<{ hook: string; children: React.ReactNode }> = ({ hook, children }) => (
  <AbsoluteFill>
    <Glow />
    <Stars count={50} />
    {children}
    <Kinetic text={hook} from={0} to={T * FPS - 8} size={92} step={3} top="12.5%" />
    <Line from={14} to={T * FPS - 8} top="21%" size={44} weight={500} color={C.muted}>sound on</Line>
    <Line from={T * FPS - 4} to={T * FPS + 60} top="13%" size={130} color={C.accent}>Perfect.</Line>
  </AbsoluteFill>
);

const Icon: React.FC<{ scale?: number; cy?: number }> = ({ scale = 1, cy = CY }) => (
  <Img src={staticFile("icon.png")} style={{ position: "absolute", left: CX - 70, top: cy - 70, width: 140, height: 140, borderRadius: 32, transform: `scale(${scale})`, boxShadow: "0 0 90px 20px rgba(242,180,140,0.4)" }} />
);

// ---- 1. Ripple ------------------------------------------------------------------------------
const RM = [11, 10, 9, 8, 7, 6, 5];
const RING_LIFE = 2.2;
const RING_MAX = 780;

export const RippleWave: React.FC<{ hook: string }> = ({ hook }) => {
  const t = Math.min(useCurrentFrame() / FPS, T + 2);
  let newest = 9;
  const rings: React.ReactNode[] = [];
  RM.forEach((m, k) => {
    const c = mix(k, RM.length);
    for (let j = 0; j <= m; j++) {
      const age = t - (j * T) / m;
      if (age < 0 || age > RING_LIFE) continue;
      newest = Math.min(newest, age);
      const p = age / RING_LIFE;
      const r = 70 + RING_MAX * (1 - Math.pow(1 - p, 2.2));
      rings.push(
        <div key={`${k}-${j}`} style={{ position: "absolute", left: CX - r, top: CY - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `${2 + 7 * (1 - p)}px solid ${c}`, opacity: Math.pow(1 - p, 1.4) * 0.9, boxSizing: "border-box", boxShadow: `0 0 ${30 * (1 - p)}px ${c}` }} />,
      );
    }
  });
  return (
    <Frame hook={hook}>
      {rings}
      <Icon scale={1 + 0.1 * Math.exp(-newest * 9)} />
    </Frame>
  );
};

// ---- 2. Spiral ------------------------------------------------------------------------------
const SN = 26;
const SPIRAL_TWIST = 0.5;

export const SpiralWave: React.FC<{ hook: string }> = ({ hook }) => {
  const f = useCurrentFrame();
  const t = Math.min(f / FPS, T);
  const k = Math.sin((Math.PI * t) / T);
  const twist = SPIRAL_TWIST * k * k * (1 + 2.2 * k);
  const spin = 0.5 * Math.sin((2 * Math.PI * t) / T) * k;
  const aligned = Math.exp(-Math.min(t, T - t) * 4);
  return (
    <Frame hook={hook}>
      {Array.from({ length: SN }, (_, i) => {
        const r = 90 + i * 27;
        const a = -Math.PI / 2 + i * twist + spin * (1 - i / SN);
        const x = CX + r * Math.cos(a);
        const y = CY + r * Math.sin(a);
        const c = mix(i, SN);
        const size = 30 - i * 0.55 + 10 * aligned;
        return (
          <React.Fragment key={i}>
            {[4, 3, 2, 1].map((d) => {
              const tt = Math.max(0, t - d * 0.045);
              const kk = Math.sin((Math.PI * tt) / T);
              const tw = SPIRAL_TWIST * kk * kk * (1 + 2.2 * kk);
              const sp = 0.5 * Math.sin((2 * Math.PI * tt) / T) * kk;
              const ag = -Math.PI / 2 + i * tw + sp * (1 - i / SN);
              return <div key={d} style={{ position: "absolute", left: CX + r * Math.cos(ag), top: CY + r * Math.sin(ag), width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", background: c, opacity: 0.05 + (4 - d) * 0.03, filter: "blur(2px)" }} />;
            })}
            <div style={{ position: "absolute", left: x, top: y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff6ee, ${c} 62%)`, boxShadow: `0 0 ${18 + 30 * aligned}px ${c}` }} />
          </React.Fragment>
        );
      })}
      <Icon scale={1 + 0.05 * aligned} />
    </Frame>
  );
};

// ---- 3. Domino ------------------------------------------------------------------------------
const COLS = 6;
const ROWS = 9;
const CM = [9, 8, 7, 6, 5, 4];
const TILE_W = 124;
const TILE_H = 124;
const GAP = 22;

export const DominoWave: React.FC<{ hook: string }> = ({ hook }) => {
  const t = Math.min(useCurrentFrame() / FPS, T);
  const rho = 0.55 * Math.sin((Math.PI * t) / T);
  const left = CX - (COLS * TILE_W + (COLS - 1) * GAP) / 2;
  const top = CY - (ROWS * TILE_H + (ROWS - 1) * GAP) / 2 + 110;
  const aligned = Math.exp(-Math.min(t, T - t) * 4);
  return (
    <Frame hook={hook}>
      {Array.from({ length: ROWS * COLS }, (_, n) => {
        const r = Math.floor(n / COLS);
        const c = n % COLS;
        const p = Math.cos((Math.PI * CM[c] * t) / T - r * rho);
        const b = Math.pow(p * p, 2.5);
        const col = mix(c, COLS);
        return (
          <div key={n} style={{ position: "absolute", left: left + c * (TILE_W + GAP), top: top + r * (TILE_H + GAP), width: TILE_W, height: TILE_H, borderRadius: 30, background: col, opacity: 0.1 + 0.9 * b, transform: `scale(${0.82 + 0.18 * b})`, boxShadow: `0 0 ${46 * b}px ${col}` }} />
        );
      })}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(255,233,214,${0.15 * aligned}), transparent 60%)` }} />
    </Frame>
  );
};

// ---- 4. Swing (hanging pendulum wave: 7 colored pendulums, m_i swings in T, all aligned at t=0 and t=T) ------
const PM = [8, 9, 10, 11, 12, 13, 14];
const PCOL = ["#ff8fa3", "#ffb27a", "#ffd97a", "#9be8a5", "#7ad7ff", "#9a9bff", "#d79bff"];
const PIVOT_Y = 600;
const PLEN = 820;
const PAMP = 0.13;
const PX0 = 170;
const PDX = (1080 - 2 * PX0) / (PM.length - 1);
const bob = (i: number, t: number) => {
  const th = PAMP * Math.cos((2 * Math.PI * PM[i] * Math.min(t, T)) / T) * 1;
  const px = PX0 + i * PDX;
  return { px, x: px + PLEN * Math.sin(th), y: PIVOT_Y + PLEN * Math.cos(th), th };
};

export const SwingWave: React.FC<{ hook: string }> = ({ hook }) => {
  const f = useCurrentFrame();
  const t = Math.min(f / FPS, T);
  const aligned = Math.exp(-Math.min(t, T - t) * 4);
  return (
    <Frame hook={hook}>
      <div style={{ position: "absolute", left: 70, right: 70, top: PIVOT_Y - 10, height: 14, borderRadius: 7, background: "linear-gradient(90deg, rgba(242,180,140,0.15), rgba(242,180,140,0.7), rgba(242,180,140,0.15))", boxShadow: "0 0 30px rgba(242,180,140,0.35)" }} />
      {PM.map((_, i) => {
        const c = PCOL[i];
        const b = bob(i, t);
        const v = Math.abs(Math.sin((2 * Math.PI * PM[i] * t) / T));
        const ang = (Math.atan2(b.x - b.px, b.y - PIVOT_Y) * 180) / Math.PI;
        return (
          <React.Fragment key={i}>
            {[8, 6, 4, 2].map((d) => {
              const o = bob(i, Math.max(0, t - d * 0.035));
              return <div key={d} style={{ position: "absolute", left: o.x, top: o.y, width: 78, height: 78, marginLeft: -39, marginTop: -39, borderRadius: "50%", background: c, opacity: 0.05 + (8 - d) * 0.012, filter: "blur(3px)" }} />;
            })}
            <div style={{ position: "absolute", left: b.px - 1.5, top: PIVOT_Y, width: 3, height: PLEN, transformOrigin: "top center", transform: `rotate(${-ang}deg)`, background: `linear-gradient(180deg, rgba(246,237,233,0.5), ${c})`, opacity: 0.7 }} />
            <div style={{ position: "absolute", left: b.px - 9, top: PIVOT_Y - 4, width: 18, height: 18, borderRadius: "50%", background: c }} />
            <div style={{ position: "absolute", left: b.x, top: b.y, width: 84, height: 84, marginLeft: -42, marginTop: -42, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff6ee, ${c} 58%)`, boxShadow: `0 0 ${24 + 40 * v + 30 * aligned}px ${c}` }} />
          </React.Fragment>
        );
      })}
    </Frame>
  );
};

// ---- 5. Bloom (harmonograph): 6 light pens draw closed Lissajous curves that finish together at t=T ------------
// Pen i: x = R cos(2π a t/T), y = R sin(2π b t/T). Integer a, b => every curve closes exactly at T.
// Each time a pen crosses the vertical axis (x = 0) it plucks a note: 2a crossings per pen (sfx_bloom.py, keep in sync).
export const BLOOM_A = [3, 3, 3, 5, 5, 5];
const BLOOM_B = [2, 4, 5, 4, 6, 7];
const BLOOM_R = [440, 370, 300, 235, 170, 105];
const BLOOM_COL = ["#ff8fa3", "#ffb27a", "#ffd97a", "#9be8a5", "#7ad7ff", "#d79bff"];
const BCY = 1060;
const bpos = (i: number, t: number) => ({
  x: CX + BLOOM_R[i] * Math.cos((2 * Math.PI * BLOOM_A[i] * t) / T),
  y: BCY + BLOOM_R[i] * Math.sin((2 * Math.PI * BLOOM_B[i] * t) / T),
});
const bpath = (i: number, t1: number) => {
  const steps = Math.max(2, Math.ceil(t1 / 0.02));
  let d = "";
  for (let s = 0; s <= steps; s++) {
    const p = bpos(i, (t1 * s) / steps);
    d += `${s ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
};
export const BLOOM_FRAMES = T * FPS + 125 + 75;

export const BloomWave: React.FC<{ hook: string }> = ({ hook }) => {
  const f = useCurrentFrame();
  const t = Math.min(f / FPS, T);
  const done = Math.max(0, Math.min(1, (f / FPS - T) / 0.5));
  const crown = Math.exp(-Math.max(0, f / FPS - T) * 1.6) * (f / FPS >= T ? 1 : 0);
  return (
    <>
      <Audio src={staticFile("sfx/bloom.mp3")} volume={1} />
      <Bloom hook={hook} t={t} done={done} crown={crown} />
      <Sequence from={T * FPS + 50} durationInFrames={78}>
        <AbsoluteFill style={{ background: "rgba(18,10,16,0.9)" }} />
        <Bridge covers={["cadir_yagmuru", "gol_kiyisi", "damla"]} line="200+ sounds for sleep" />
      </Sequence>
      <Sequence from={T * FPS + 125}>
        <AbsoluteFill style={{ background: "rgba(18,10,16,0.9)" }} />
        <Cta from={0} />
      </Sequence>
    </>
  );
};

const Bloom: React.FC<{ hook: string; t: number; done: number; crown: number }> = ({ hook, t, done, crown }) => {
  return (
    <Frame hook={hook}>
      <div style={{ position: "absolute", left: CX - 520, top: BCY - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,233,214,${0.38 * crown}) 0%, rgba(242,180,140,${0.16 * crown}) 40%, transparent 70%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {BLOOM_A.map((_, i) => (
          <path key={`t${i}`} d={bpath(i, t)} fill="none" stroke={BLOOM_COL[i]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85 + 0.15 * done} style={{ filter: `drop-shadow(0 0 ${8 + 14 * done}px ${BLOOM_COL[i]})` }} />
        ))}
      </svg>
      {BLOOM_A.map((_, i) => {
        const c = BLOOM_COL[i];
        const p = bpos(i, t);
        const k = Math.floor((2 * BLOOM_A[i] * t) / T - 0.5);
        const dt = k >= 0 ? t - ((k + 0.5) * T) / (2 * BLOOM_A[i]) : 9;
        const flash = Math.exp(-dt * 7);
        return (
          <React.Fragment key={i}>
            {dt < 0.8 ? <div style={{ position: "absolute", left: p.x, top: p.y, width: 40 + dt * 240, height: 40 + dt * 240, marginLeft: -(20 + dt * 120), marginTop: -(20 + dt * 120), borderRadius: "50%", border: `3px solid ${c}`, opacity: Math.exp(-dt * 5) * 0.8 }} /> : null}
            <div style={{ position: "absolute", left: p.x, top: p.y, width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff6ee, ${c} 60%)`, boxShadow: `0 0 ${20 + 40 * flash}px ${c}` }} />
          </React.Fragment>
        );
      })}
      <Icon scale={1 + 0.06 * done} cy={BCY} />
    </Frame>
  );
};
