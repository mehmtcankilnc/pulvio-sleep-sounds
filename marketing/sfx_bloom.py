"""Soundtrack of the "bloom" video (public/sfx/bloom.mp3, synthesized, no samples).

Pen i crosses the vertical axis 2*a_i times in T seconds, at (k+0.5)*T/(2*a_i); each crossing plucks that pen's note.
Chord at t=0 and t=T, plus a swelling pad and a bell arpeggio crowning the finale. Keep A and T in sync with src/videos7.tsx (BLOOM_A). Requires ffmpeg on PATH.
"""
import array
import math
import os
import subprocess
import wave

SR = 44100
T = 15.0
A = [3, 3, 3, 5, 5, 5]
NOTES = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]  # A minor pentatonic, outer pen = lowest
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx")


def pluck(freq, length, decay):
    out = []
    for k in range(int(length * SR)):
        t = k / SR
        s = (math.sin(2 * math.pi * freq * t) * math.exp(-decay * t)
             + 0.2 * math.sin(2 * math.pi * 2 * freq * t) * math.exp(-2 * decay * t)
             + 0.08 * math.sin(2 * math.pi * 3.9 * freq * t) * math.exp(-4 * decay * t))
        out.append(s * min(1.0, t / 0.004))
    return out


total = int((T + 4.0) * SR)
mix = [0.0] * total


def add(buf, at, gain):
    start = int(at * SR)
    for k, v in enumerate(buf):
        if start + k >= total:
            break
        mix[start + k] += v * gain


short = [pluck(f, 1.6, 2.4) for f in NOTES]
long_ = [pluck(f, 4.0, 1.0) for f in NOTES]
for i, a in enumerate(A):
    add(long_[i], 0.0, 0.14)
    add(long_[i], T, 0.18)
    for k in range(2 * a):
        add(short[i], (k + 0.5) * T / (2 * a), 0.15)

# Crown: a pad swells over the last 3 s and blooms at T, then a bell arpeggio sparkles on top of the finale chord.
PAD = [110.00, 164.81, 220.00, 329.63]
for k in range(int((T - 3.0) * SR), total):
    t = k / SR
    if t < T:
        env = ((t - (T - 3.0)) / 3.0) ** 2.2
    else:
        env = math.exp(-0.85 * (t - T))
    mix[k] += 0.075 * env * sum(math.sin(2 * math.pi * f * t) for f in PAD) / len(PAD) * 2
for j, f in enumerate([880.00, 1046.50, 1318.51, 1567.98, 1760.00, 2093.00]):
    add(pluck(f, 3.5, 1.3), T + 0.04 + 0.11 * j, 0.07)

peak = max(abs(v) for v in mix)
scale = 0.9 / peak
data = array.array("h", [int(max(-1.0, min(1.0, math.tanh(v * scale * 1.1))) * 32000) for v in mix])
os.makedirs(OUT, exist_ok=True)
wav = os.path.join(OUT, "bloom.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-b:a", "192k", os.path.join(OUT, "bloom.mp3")], check=True)
os.remove(wav)
