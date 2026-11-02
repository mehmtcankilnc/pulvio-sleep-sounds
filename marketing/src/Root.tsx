import React from "react";
import { Composition } from "remotion";
import { YtBanner } from "./banner";
import { Cover } from "./covers";
import { PickOne, PovHook, RainLoop } from "./videos";
import { CoverFocus, FadeOut, SoundCycle } from "./videos2";
import { NIGHT_HOOK_FRAMES, NightHook } from "./videos3";
import { ORBIT_FRAMES, OrbitWave } from "./videos6";
import { PENDULUM_FRAMES, PendulumWave, STARE_FRAMES, StareChallenge } from "./videos5";

const base = { width: 1080, height: 1920, fps: 30 } as const;

const sounds = [
  { name: "Rain on a tent", cover: "cadir_yagmuru", sound: "rain.mp3" },
  { name: "Lake shore", cover: "gol_kiyisi", sound: "lake.mp3" },
  { name: "Slow drips", cover: "damla", sound: "drops.mp3" },
];

export const Root: React.FC = () => (
  <>
    <Composition
      id="pov-3am"
      component={PovHook}
      durationInFrames={450}
      {...base}
      defaultProps={{ hook: "POV: it's 3 AM and your brain won't shut up", sub: "Put this on. Just breathe.", sound: "rain.mp3" }}
    />
    <Composition
      id="rain-loop"
      component={RainLoop}
      durationInFrames={600}
      {...base}
      defaultProps={{ title: "Rain on the roof", tag: "leave it on · fall asleep", sound: "rain.mp3" }}
    />
    <Composition
      id="pick-one"
      component={PickOne}
      durationInFrames={420}
      {...base}
      defaultProps={{ question: "Which one are you sleeping to tonight?", options: ["Rain", "Lake shore", "Brown noise"], sound: "lake.mp3" }}
    />
    <Composition
      id="sound-cycle"
      component={SoundCycle}
      durationInFrames={75 + 150 * 3 + 90}
      {...base}
      defaultProps={{ question: "Three sounds. Which one gets you?", items: sounds }}
    />
    <Composition
      id="fade-out"
      component={FadeOut}
      durationInFrames={600}
      {...base}
      defaultProps={{ hook: "Press play. Close your eyes.", sub: "It fades out on its own.", cover: "cadir_yagmuru", sound: "rain.mp3" }}
    />
    <Composition
      id="night-hook"
      component={NightHook}
      durationInFrames={NIGHT_HOOK_FRAMES}
      {...base}
      defaultProps={{
        thoughts: ["Why didn't I say these in that fight?", "Why did I say that in 2016?", "Okay. One more scroll.", "Did I lock the door?"],
        cover: "gol_kiyisi",
        sound: "lake.mp3",
      }}
    />
    <Composition
      id="pendulum-wave"
      component={PendulumWave}
      durationInFrames={PENDULUM_FRAMES}
      {...base}
      defaultProps={{ hook: "Wait for the end." }}
    />
    <Composition
      id="orbit-wave"
      component={OrbitWave}
      durationInFrames={ORBIT_FRAMES}
      {...base}
      defaultProps={{ hook: "Watch them line up." }}
    />
    <Composition
      id="stare-challenge"
      component={StareChallenge}
      durationInFrames={STARE_FRAMES}
      {...base}
      defaultProps={{ hook: "DON'T LOOK AWAY", sub: "Keep your eyes on the dot.", sound: "rain.mp3" }}
    />
    <Composition
      id="cover-focus"
      component={CoverFocus}
      durationInFrames={600}
      {...base}
      defaultProps={{ title: "Rain on a tent", tag: "leave it on · fall asleep", cover: "cadir_yagmuru", sound: "rain.mp3", rain: true }}
    />
    <Composition id="yt-banner" component={YtBanner} durationInFrames={1} width={2560} height={1440} fps={30} />
    <Composition id="cover-pov-3am" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "POV: it's 3 AM and your brain won't shut up", covers: [], moon: true }} />
    <Composition id="cover-rain-loop" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "Rain on the roof", sub: "leave it on · fall asleep", covers: ["cadir_yagmuru"] }} />
    <Composition id="cover-pick-one" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "Which one are you sleeping to tonight?", covers: ["cadir_yagmuru", "gol_kiyisi", "damla"] }} />
    <Composition id="cover-sound-cycle" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "3 sounds. Which one gets you?", covers: ["cadir_yagmuru", "gol_kiyisi", "damla"] }} />
    <Composition id="cover-fade-out" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "Press play.", sub: "It fades out on its own.", covers: ["cadir_yagmuru"] }} />
    <Composition id="cover-night-hook" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "Your brain at 3 AM", sub: "Try this instead.", covers: [], moon: true }} />
    <Composition id="cover-cover-focus" component={Cover} durationInFrames={1} {...base} defaultProps={{ title: "Rain on a tent", sub: "leave it on · fall asleep", covers: ["cadir_yagmuru"] }} />
  </>
);
