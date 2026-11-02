"""Synthesizes the kalimba-like soundtracks of the "wave" videos (public/sfx/<name>.mp3, no samples used).

Ball/dot i has m_i hits in T seconds, at k*T/m_i, so every one of them hits at t=0 and t=T (a chord both times).
Keep the config here in sync with src/videos5.tsx (pendulum) and src/videos6.tsx (orbit).
Requires ffmpeg on PATH. Usage: python sfx_pendulum.py [pendulum|orbit]   (no argument = all)
"""
import array
import math
import os
import subprocess
import sys
import wave

SR = 44100
T = 15.0
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx")

# Ball i -> note. Pendulum: C major pentatonic, bright kalimba. Orbit: A minor pentatonic, inner (i=0) = highest, softer.
CONFIGS = {
    "pendulum": {
        "notes": [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00],
        "hits": [6 + i for i in range(10)],
        "decay": 3.4,
        "bright": 1.0,
    },
    "orbit": {
        "notes": [587.33, 523.25, 440.00, 392.00, 329.63, 293.66, 261.63, 220.00],
        "hits": [11 - i for i in range(8)],
        "decay": 2.6,
        "bright": 0.6,
    },
}


def pluck(freq: float, length: float, decay: float, bright: float) -> list:
    n = int(length * SR)
    buf = []
    for k in range(n):
        t = k / SR
        attack = min(1.0, t / 0.004)
        s = (math.sin(2 * math.pi * freq * t) * math.exp(-decay * t)
             + 0.25 * bright * math.sin(2 * math.pi * 2 * freq * t) * math.exp(-2 * decay * t)
             + 0.10 * bright * math.sin(2 * math.pi * 3.9 * freq * t) * math.exp(-4 * decay * t))
        buf.append(s * attack)
    return buf


def render(name: str) -> None:
    cfg = CONFIGS[name]
    total = int((T + 4.0) * SR)
    mix = [0.0] * total
    short = [pluck(f, 1.4, cfg["decay"], cfg["bright"]) for f in cfg["notes"]]
    long_ = [pluck(f, 4.0, 1.1, cfg["bright"]) for f in cfg["notes"]]

    def add(buf: list, at: float, gain: float) -> None:
        start = int(at * SR)
        for k, v in enumerate(buf):
            if start + k >= total:
                break
            mix[start + k] += v * gain

    for i, m in enumerate(cfg["hits"]):
        for k in range(m + 1):
            t = k * T / m
            if k == 0:
                add(long_[i], 0.0, 0.16)       # opening chord, sounds from frame 0
            elif k == m:
                add(long_[i], T, 0.2)          # finale chord, everything lines up
            else:
                add(short[i], t, 0.15)

    peak = max(abs(v) for v in mix)
    scale = 0.9 / peak if peak > 0 else 1.0
    data = array.array("h", [int(max(-1.0, min(1.0, math.tanh(v * scale * 1.1))) * 32000) for v in mix])
    os.makedirs(OUT_DIR, exist_ok=True)
    wav = os.path.join(OUT_DIR, f"{name}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-b:a", "192k", os.path.join(OUT_DIR, f"{name}.mp3")], check=True)
    os.remove(wav)


for n in sys.argv[1:] or list(CONFIGS):
    render(n)
