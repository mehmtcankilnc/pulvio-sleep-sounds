#!/usr/bin/env bash
# Synthesizes the small sound effects into public/sfx/ (no samples). Needs ffmpeg on PATH.
# pendulum.mp3 and orbit.mp3 come from sfx_pendulum.py instead.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public/sfx
cd public/sfx

# tick: 90 ms click, used by the night-hook tension ticks and the stare countdown
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.9*sin(2*PI*1800*t)*exp(-t*90)':s=44100:d=0.09" -b:a 128k tick.mp3

# riser: 5 s rising sweep, tension before the drop (night-hook)
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='(0.5*sin(2*PI*(100*t+120*t*t))+0.3*sin(2*PI*(200*t+240*t*t)))*(t/5)*(t/5)':s=44100:d=5" -b:a 160k riser.mp3

# drop: low thump with falling pitch, the hard cut to silence
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.95*sin(2*PI*(75-35*t)*t)*exp(-t*4)':s=44100:d=1.2" -b:a 160k drop.mp3

# drone: 12 s low pad under the stare-challenge spiral
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='(0.35*sin(2*PI*98*t)+0.22*sin(2*PI*147*t)+0.12*sin(2*PI*196*t))*(0.8+0.2*sin(2*PI*0.4*t))':s=44100:d=12" -af "afade=t=in:d=0.25,afade=t=out:st=10.5:d=1.5" -b:a 160k drone.mp3
