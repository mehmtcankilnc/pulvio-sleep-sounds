import React from "react";
import { AbsoluteFill, Audio, interpolate, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Bridge, Cta, Glow, Kinetic, Line, Stars, Voice } from "./parts";
import { CoverDisc } from "./disc";
import { C, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const Dim: React.FC<{ a?: number }> = ({ a = 0.9 }) => <AbsoluteFill style={{ background: `rgba(18,10,16,${a})` }} />;

// ---------------------------------------------------------------------------------------------
// Pendulum wave: 10 balls, ball i bounces 6+i times in 15s, so everything is on the floor at t=0 and t=15.
// Each floor hit plays a kalimba note (public/sfx/pendulum.mp3, made by sfx_pendulum.py; keep N/T/m in sync).
// ---------------------------------------------------------------------------------------------
const N = 10;
const T = 15;
const FPS = 30;
const FLOOR = 1420;
const HEIGHT = 880;
const X0 = 125;
const DX = (1080 - 2 * X0) / (N - 1);
const PENDULUM_FRAMES = T * FPS + 125 + 75;

const ballColor = (i: number) => interpolateColors(i, [0, N * 0.5, N - 1], [C.button, C.accent, C.moon]);
const bounces = (i: number) => 6 + i;
const yAt = (i: number, t: number) => FLOOR - HEIGHT * Math.abs(Math.sin((Math.PI * bounces(i) * Math.min(t, T)) / T));

const hitInfo = (i: number, t: number) => {
  if (t >= T) return { dt: t - T, big: true };
  const m = bounces(i);
  const k = Math.floor((t * m) / T);
  return { dt: t - (k * T) / m, big: k === 0 };
};

export const PendulumWave: React.FC<{ hook: string }> = ({ hook }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill>
      <Glow />
      <Stars count={50} />
      <Audio src={staticFile("sfx/pendulum.mp3")} volume={1} />
      <div style={{ position: "absolute", left: 60, right: 60, top: FLOOR + 38, height: 4, borderRadius: 2, background: "linear-gradient(90deg, transparent, rgba(242,180,140,0.55), transparent)" }} />
      {Array.from({ length: N }).map((_, i) => {
        const x = X0 + i * DX;
        const { dt, big } = hitInfo(i, t);
        const ring = dt < 0.9 ? Math.exp(-dt * 4.5) * (big ? 1 : 0.7) : 0;
        const pop = 1 + 0.35 * Math.exp(-dt * 14);
        const color = ballColor(i);
        return (
          <React.Fragment key={i}>
            {ring > 0.02 ? (
              <div style={{ position: "absolute", left: x, top: FLOOR + 40, width: 40 + dt * 300, height: 12 + dt * 80, marginLeft: -(20 + dt * 150), marginTop: -(6 + dt * 40), borderRadius: "50%", border: `3px solid ${color}`, opacity: ring * 0.8 }} />
            ) : null}
            {[6, 5, 4, 3, 2, 1].map((d) => (
              <div key={d} style={{ position: "absolute", left: x, top: yAt(i, Math.max(0, (f - d * 1.6) / FPS)), width: 70 * (1 - d * 0.05), height: 70 * (1 - d * 0.05), marginLeft: -35 * (1 - d * 0.05), marginTop: -35 * (1 - d * 0.05), borderRadius: "50%", background: color, opacity: 0.05 + (6 - d) * 0.02, filter: "blur(2px)" }} />
            ))}
            <div style={{ position: "absolute", left: x, top: yAt(i, t), width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: "50%", transform: `scale(${pop})`, background: `radial-gradient(circle at 35% 30%, #fff6ee, ${color} 55%)`, boxShadow: `0 0 ${30 + 50 * (pop - 1) * 3}px ${color}` }} />
          </React.Fragment>
        );
      })}
      <Kinetic text={hook} from={0} to={T * FPS - 8} size={96} step={3} top="13%" />
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

// ---------------------------------------------------------------------------------------------
// Stare challenge: a rotating spiral from the first frame, "don't look away", 10s countdown,
// then "now look at your hand". Voice: public/voice/stare (Andrew).
// ---------------------------------------------------------------------------------------------
const SWITCH = 300;
export const STARE_FRAMES = SWITCH + 252 + 90;

const spiralPath = (() => {
  const k = 480 / (14 * Math.PI);
  let d = "";
  for (let a = 0; a <= 14 * Math.PI; a += 0.06) {
    const r = k * a;
    d += `${d ? "L" : "M"}${(500 + r * Math.cos(a)).toFixed(1)} ${(500 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d;
})();

export const StareChallenge: React.FC<{ hook: string; sub: string; sound: string }> = ({ hook, sub, sound }) => {
  const f = useCurrentFrame();
  const left = Math.max(1, Math.ceil((SWITCH - f) / FPS));
  const flash = interpolate(f, [SWITCH - 1, SWITCH, SWITCH + 16], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Glow />
      <Stars />
      {f < SWITCH ? (
        <>
          <div style={{ position: "absolute", left: 60, top: 430, width: 960, height: 960, WebkitMaskImage: "radial-gradient(circle, #000 62%, transparent 71%)", maskImage: "radial-gradient(circle, #000 62%, transparent 71%)", transform: `scale(${1 + 0.03 * Math.sin(f / 18)})` }}>
            <svg viewBox="0 0 1000 1000" width="960" height="960" style={{ transform: `rotate(${f * 4}deg)` }}>
              <path d={spiralPath} fill="none" stroke={C.accent} strokeWidth={34} strokeLinecap="butt" />
            </svg>
            <div style={{ position: "absolute", left: 480 - 17, top: 480 - 17, width: 34, height: 34, borderRadius: "50%", background: "#fff6ee", boxShadow: "0 0 30px #fff6ee" }} />
          </div>
          <Kinetic text={hook} from={0} to={SWITCH - 6} size={104} step={3} top="11.5%" />
          <Line from={10} to={SWITCH - 6} top="21%" size={54} weight={500} color={C.muted}>{sub}</Line>
          <div style={{ position: "absolute", left: 0, right: 0, top: "77%", textAlign: "center", fontFamily: FONT, fontSize: 130, fontWeight: 800, color: C.accent }}>{left}</div>
          <Voice file="stare/a" at={2} />
          <Audio src={staticFile("sfx/drone.mp3")} volume={0.55} />
          {Array.from({ length: 9 }).map((_, k) => (
            <Sequence key={k} from={FPS * (k + 1)}>
              <Audio src={staticFile("sfx/tick.mp3")} volume={0.22} />
            </Sequence>
          ))}
        </>
      ) : null}
      <Sequence from={SWITCH}>
        <Audio src={staticFile("sfx/drop.mp3")} volume={0.4} />
      </Sequence>
      <Kinetic text="Now look at your hand." from={SWITCH + 4} to={SWITCH + 72} size={100} step={7} top="45%" />
      <Voice file="stare/b" at={SWITCH + 6} />
      <Line from={SWITCH + 74} to={SWITCH + 134} top="45%" size={96}>Did you notice that?</Line>
      <Voice file="stare/c" at={SWITCH + 76} />
      {/* bridge to the app: close your eyes and listen -> the real player disc with rain */}
      <Sequence from={SWITCH + 138} durationInFrames={114}>
        <Audio src={staticFile(`audio/${sound}`)} volume={(fr) => interpolate(fr, [0, 40, 100, 114], [0, 0.55, 0.9, 0.9], clamp)} />
        <AbsoluteFill style={{ opacity: interpolate(f, [SWITCH + 236, SWITCH + 250], [1, 0], clamp) }}>
          <Kinetic text="Now close your eyes, and just listen." from={2} to={9999} size={80} step={5} top="14%" />
          <AbsoluteFill style={{ opacity: interpolate(f, [SWITCH + 148, SWITCH + 178], [0, 1], clamp) }}>
            <CoverDisc cover="cadir_yagmuru" sound={sound} top="49%" />
          </AbsoluteFill>
          <Line from={50} to={9999} top="77%" size={46} weight={500} color={C.muted}>Sleep sounds that fade out on their own</Line>
        </AbsoluteFill>
      </Sequence>
      <Voice file="stare/d" at={SWITCH + 140} />
      <AbsoluteFill style={{ background: "#0a0509", opacity: flash }} />
      <Sequence from={SWITCH + 252}>
        <Dim />
        <Cta from={0} />
      </Sequence>
    </AbsoluteFill>
  );
};

export { PENDULUM_FRAMES };
