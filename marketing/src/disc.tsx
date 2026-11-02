import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { C } from "./theme";

const BARS = 56;

// Circular cover (like the in-app player) with a ring of bars that react to the audio.
export const CoverDisc: React.FC<{
  cover: string;
  sound: string;
  size?: number;
  top?: string;
  level?: number; // 0..1, scales bar height (e.g. to show a fade-out)
}> = ({ cover, sound, size = 560, top = "50%", level = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(`audio/${sound}`));
  const bars = audioData ? visualizeAudio({ fps, frame: f, audioData, numberOfSamples: 64, smoothing: true }) : new Array(64).fill(0);
  const avg = bars.slice(0, 16).reduce((a, b) => a + b, 0) / 16;
  const pulse = 1 + Math.min(0.05, avg * 0.35) * level;
  const zoom = interpolate(f, [0, 300], [1, 1.12], { extrapolateRight: "clamp" });
  const outer = size + 260;
  return (
    <div style={{ position: "absolute", left: "50%", top, width: outer, height: outer, transform: "translate(-50%,-50%)" }}>
      {Array.from({ length: BARS }).map((_, i) => {
        const v = bars[Math.floor((i / BARS) * 32)] ?? 0;
        const h = (14 + Math.min(1, v * 9) * 90) * level + 8;
        const a = (i / BARS) * 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 8,
              height: h,
              marginLeft: -4,
              borderRadius: 4,
              background: C.accent,
              opacity: 0.35 + Math.min(1, v * 9) * 0.55,
              transform: `rotate(${a}deg) translateY(${-(size / 2 + 26 + h / 2)}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: "50%",
          overflow: "hidden",
          transform: `scale(${pulse})`,
          border: `4px solid ${C.accent}`,
          boxShadow: "0 0 140px 40px rgba(242,180,140,0.28)",
        }}
      >
        <Img src={staticFile(`covers/${cover}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      </div>
    </div>
  );
};
