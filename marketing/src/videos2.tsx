import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CoverDisc } from "./disc";
import { Cta, Glow, Kinetic, Line, Rain, Sound, Stars, Voice } from "./parts";
import { C, FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const Dim: React.FC<{ a?: number }> = ({ a = 0.82 }) => <AbsoluteFill style={{ background: `rgba(18,10,16,${a})` }} />;

export type SoundItem = { name: string; cover: string; sound: string };

// Format D: 3 sounds in a row (voiced), comment-bait + audio-reactive disc. 20.5s. Voice: public/voice/cycle (Brian).
export const SoundCycle: React.FC<{ question: string; items: SoundItem[] }> = ({ question, items }) => {
  const SEG = 150;
  const START = 75;
  const END = START + SEG * items.length;
  return (
    <AbsoluteFill>
      <Glow />
      <Stars />
      <Kinetic text={question} from={2} to={END} size={80} step={7} top="14%" />
      <Voice file="cycle/q" at={2} />
      {items.map((it, i) => (
        <Sequence key={it.name} from={START + i * SEG} durationInFrames={SEG}>
          <Audio src={staticFile(`audio/${it.sound}`)} volume={(f) => interpolate(f, [0, 20, 70, 100, SEG - 20, SEG], [0, 0.45, 0.45, 1, 1, 0], clamp)} />
          <SegmentFade>
            <CoverDisc cover={it.cover} sound={it.sound} top="46%" />
            <Line from={0} to={SEG} top="70%" size={84} color={C.accent}>{`${i + 1}. ${it.name}`}</Line>
          </SegmentFade>
          <Voice file={`cycle/n${i + 1}`} at={6} />
        </Sequence>
      ))}
      <Line from={END - 68} to={END} top="82%" size={50} weight={500} color={C.muted}>
        Comment your number
      </Line>
      <Voice file="cycle/c" at={END - 62} />
      <Sequence from={END}>
        <Dim />
        <Cta from={0} />
      </Sequence>
    </AbsoluteFill>
  );
};

const SegmentFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 15, 135, 150], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// Format E: sound fades out while the screen goes dark, like the sleep timer (voiced). 20s. Voice: public/voice/fade (Andrew).
export const FadeOut: React.FC<{ hook: string; sub: string; cover: string; sound: string }> = ({ hook, sub, cover, sound }) => {
  const f = useCurrentFrame();
  const level = interpolate(f, [60, 480], [1, 0.12], clamp);
  const dark = interpolate(f, [60, 500], [0, 0.88], clamp);
  return (
    <AbsoluteFill>
      <Glow intensity={interpolate(f, [60, 500], [1, 0.25], clamp)} />
      <Stars />
      <Audio src={staticFile(`audio/${sound}`)} volume={(fr) => interpolate(fr, [0, 30, 110, 150, 480, 540], [0, 0.35, 0.35, 1, 0.08, 0], clamp)} />
      <CoverDisc cover={cover} sound={sound} top="52%" level={level} />
      <Kinetic text={hook} from={2} to={125} size={86} step={9} top="14%" />
      <Voice file="fade/h" at={2} />
      <Line from={66} to={330} top="26%" size={58} weight={500} color={C.muted}>{sub}</Line>
      <Voice file="fade/s" at={68} />
      <AbsoluteFill style={{ background: `rgba(10,5,9,${dark})` }} />
      <Sequence from={500}>
        <Line from={0} to={38} top="45%" size={92}>Sweet dreams.</Line>
      </Sequence>
      <Voice file="fade/e" at={502} />
      <Sequence from={540}>
        <Dim a={0.92} />
        <Cta from={0} line="Sleep timer that fades out" />
      </Sequence>
    </AbsoluteFill>
  );
};

// Format G: one big cover, slow zoom, minimal text. Pure "leave it on" retention. 20s.
export const CoverFocus: React.FC<{ title: string; tag: string; cover: string; sound: string; rain?: boolean }> = ({ title, tag, cover, sound, rain }) => (
  <AbsoluteFill>
    <Glow />
    <Stars count={40} />
    {rain ? <Rain drops={60} /> : null}
    <Sound file={sound} total={600} />
    <CoverDisc cover={cover} sound={sound} top="46%" size={620} />
    <Line from={10} to={490} top="14%" size={76}>{title}</Line>
    <Line from={10} to={490} top="80%" size={46} weight={500} color={C.muted}>{tag}</Line>
    <Sequence from={490}>
      <Dim />
      <Cta from={0} line="Sleep sounds, no ads" />
    </Sequence>
  </AbsoluteFill>
);
