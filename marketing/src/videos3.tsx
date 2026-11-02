import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CoverDisc } from "./disc";
import { Cta, Glow, Line, Stars } from "./parts";
import { C, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const DROP = 150; // the moment racing thoughts stop
const CALM = 164; // calm section starts
const TICKS = [0, 20, 38, 54, 68, 80, 91, 101, 110, 118, 125, 131, 136, 140, 144, 147];
const THOUGHT_AT = [34, 52, 74, 96];
// x offset (px), y (%), rotation (deg) per chip: scattered, like thoughts pushing in
const CHIP_POS = [
  { x: -50, y: 38, r: -2 },
  { x: 60, y: 50, r: 2 },
  { x: -40, y: 61, r: -1.5 },
  { x: 40, y: 71, r: 2.5 },
];

const Chip: React.FC<{ text: string; at: number; x: number; y: number; r: number }> = ({ text, at, x, y, r }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f >= DROP) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
  // jitter grows as the drop approaches
  const nerve = interpolate(f, [at, DROP], [1, 4], clamp);
  const jx = (random(`${text}x${f}`) - 0.5) * 2 * nerve;
  const jy = (random(`${text}y${f}`) - 0.5) * 2 * nerve;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: `${y}%`,
        transform: `translate(calc(-50% + ${x + jx}px), calc(-50% + ${jy}px)) rotate(${r}deg) scale(${s})`,
        padding: "26px 44px",
        borderRadius: 44,
        background: "rgba(246,237,233,0.09)",
        border: "2px solid rgba(242,180,140,0.35)",
        fontFamily: FONT,
        fontSize: 56,
        fontWeight: 600,
        color: C.text,
        textAlign: "center",
        lineHeight: 1.2,
        width: "max-content",
        maxWidth: 840,
        boxShadow: "0 0 60px rgba(242,180,140,0.15)",
      }}
    >
      {text}
    </div>
  );
};

const Clock: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= DROP) return null;
  const glitch = f < 12 && f % 2 === 0;
  const gx = glitch ? (random(`g${f}`) - 0.5) * 30 : 0;
  const style: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "20%",
    textAlign: "center",
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: 210,
    letterSpacing: -5,
    lineHeight: 1,
  };
  const nerve = interpolate(f, [12, DROP], [0, 5], clamp);
  const sx = (random(`cx${f}`) - 0.5) * nerve;
  return (
    <>
      {glitch ? <div style={{ ...style, color: C.accent, transform: `translateX(${gx}px)`, opacity: 0.7 }}>3:07 AM</div> : null}
      <div style={{ ...style, color: C.text, transform: `translateX(${sx}px)` }}>3:07 AM</div>
    </>
  );
};

// Hook-first format: starts mid-chaos (clock + racing thoughts, overlapping voices, accelerating ticks),
// then a hard drop to silence and a calm sound. ~14.5s.
export const NightHook: React.FC<{ thoughts: string[]; cover: string; sound: string }> = ({ thoughts, cover, sound }) => {
  const f = useCurrentFrame();
  const v = (file: string, at: number, volume = 1) => (
    <Sequence from={at}>
      <Audio src={staticFile(`voice/night/${file}.mp3`)} volume={volume} />
    </Sequence>
  );
  const intensity = interpolate(f, [0, DROP, DROP + 50], [0.4, 0.4, 1], clamp);
  const blackout = interpolate(f, [DROP - 2, DROP, DROP + 22], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Glow intensity={intensity} />
      <Stars />

      {/* tension: riser + accelerating ticks */}
      <Sequence from={0} durationInFrames={DROP}>
        <Audio src={staticFile("sfx/riser.mp3")} volume={0.35} />
      </Sequence>
      {TICKS.map((t) => (
        <Sequence key={t} from={t}>
          <Audio src={staticFile("sfx/tick.mp3")} volume={0.5} />
        </Sequence>
      ))}

      <div style={{ position: "absolute", left: 0, right: 0, top: "13%", textAlign: "center", fontFamily: FONT, fontSize: 46, fontWeight: 600, letterSpacing: 9, color: C.accent, opacity: f < DROP ? 1 : 0 }}>
        YOUR BRAIN AT 3 AM
      </div>
      <Clock />
      {thoughts.map((t, i) => (
        <Chip key={t} text={t} at={THOUGHT_AT[i]} {...CHIP_POS[i]} />
      ))}
      {thoughts.map((_, i) => v(`t${i + 1}`, THOUGHT_AT[i] + 3, 0.9))}

      {/* the drop */}
      <Sequence from={DROP}>
        <Audio src={staticFile("sfx/drop.mp3")} volume={0.8} />
      </Sequence>
      <AbsoluteFill style={{ background: "#0a0509", opacity: blackout }} />

      {/* calm */}
      <Sequence from={CALM}>
        <Audio src={staticFile(`audio/${sound}`)} volume={(fr) => interpolate(fr, [0, 50, 90, 225, 270], [0, 0.3, 0.9, 0.9, 0], clamp)} />
        <Line from={0} to={90} top="14%" size={84} color={C.accent}>Try this instead.</Line>
        <CoverDisc cover={cover} sound={sound} top="48%" />
      </Sequence>
      {v("t5", CALM + 4)}
      <Sequence from={CALM + 180}>
        <AbsoluteFill style={{ background: "rgba(18,10,16,0.82)" }} />
        <Cta from={0} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const NIGHT_HOOK_FRAMES = CALM + 270;
