import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { Cta, Glow, Kinetic, Line, Orb, Rain, Rings, Sound, Stars, Voice } from "./parts";
import { C } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const Dim = () => <AbsoluteFill style={{ background: "rgba(18,10,16,0.82)" }} />;

// Format A: "POV" hook (voiced, words pop in) -> calm sound visual -> CTA. 15s. Voice: public/voice/pov (Brian).
export const PovHook: React.FC<{ hook: string; sub: string; sound: string }> = ({ hook, sub, sound }) => (
  <AbsoluteFill>
    <Glow />
    <Stars />
    <Sequence from={125}>
      <Rings top="58%" />
      <Orb top="58%" size={460} />
    </Sequence>
    <Audio src={staticFile(`audio/${sound}`)} volume={(f) => interpolate(f, [0, 20, 190, 260, 400, 450], [0, 0.25, 0.25, 0.9, 0.9, 0], clamp)} />
    <Kinetic text={hook} from={2} to={125} size={104} step={10} />
    <Voice file="pov/h" at={2} />
    <Line from={125} to={340} size={84} color={C.accent} top="24%">{sub}</Line>
    <Voice file="pov/s" at={130} />
    <Sequence from={330}>
      <Dim />
      <Cta from={0} />
    </Sequence>
  </AbsoluteFill>
);

// Format B: calm loop, text-light (retention / "leave it on" content), intentionally voice-free. 20s.
export const RainLoop: React.FC<{ title: string; tag: string; sound: string }> = ({ title, tag, sound }) => (
  <AbsoluteFill>
    <Glow />
    <Stars count={50} />
    <Rain />
    <Sound file={sound} total={600} />
    <Line from={10} to={500} top="26%" size={78}>{title}</Line>
    <Line from={10} to={500} top="74%" size={46} weight={500} color={C.muted}>{tag}</Line>
    <Sequence from={490}>
      <Dim />
      <Cta from={0} line="Sleep sounds, no ads" />
    </Sequence>
  </AbsoluteFill>
);

// Format C: comment-bait ("which one?"), voiced. 14s. Voice: public/voice/pick (Ava).
export const PickOne: React.FC<{ question: string; options: string[]; sound: string }> = ({ question, options, sound }) => {
  const T = 420;
  const OPT_AT = [62, 120, 176];
  return (
    <AbsoluteFill>
      <Glow />
      <Stars />
      <Audio src={staticFile(`audio/${sound}`)} volume={(f) => interpolate(f, [0, 20, 285, 330, 390, T], [0, 0.3, 0.3, 0.9, 0.9, 0], clamp)} />
      <Kinetic text={question} from={2} to={T - 110} size={88} step={8} top="22%" />
      <Voice file="pick/q" at={2} />
      {options.map((o, i) => (
        <React.Fragment key={o}>
          <Line from={OPT_AT[i]} to={T - 110} top={`${40 + i * 12}%`} size={74} weight={600} color={C.accent}>{`${i + 1}. ${o}`}</Line>
          <Voice file={`pick/o${i + 1}`} at={OPT_AT[i] + 2} />
        </React.Fragment>
      ))}
      <Line from={244} to={T - 110} top="82%" size={50} weight={500} color={C.muted}>Comment your number</Line>
      <Voice file="pick/c" at={246} />
      <Sequence from={T - 110}>
        <Dim />
        <Cta from={0} />
      </Sequence>
    </AbsoluteFill>
  );
};
