"""Generates and normalizes the voice-over lines per video (public/voice/<video>/<line>.mp3).

One voice per video; the three voices rotate across different videos (never the same voice on
two videos posted back to back). Requires: pip install edge-tts, ffmpeg on PATH. Uses Microsoft's
online neural voices (needs internet).
Usage: python voice.py            # every video
       python voice.py night pov  # only these
If you change a line's text in src/Root.tsx, change it here too, re-run, then re-check the timings
in the composition.
"""
import asyncio
import os
import subprocess
import sys

import edge_tts

VOICES = {
    "ava": "en-US-AvaMultilingualNeural",
    "brian": "en-US-BrianMultilingualNeural",
    "andrew": "en-US-AndrewMultilingualNeural",
}
RATE = "+8%"
PITCH = "-2Hz"

# video -> (voice, lines). Posting order in ACCOUNTS.md: night, cycle, fade, pov, pick (cover-focus and
# rain-loop stay voice-free on purpose).
VIDEOS = {
    "night": ("ava", {
        "t1": "Why didn't I say these in that fight?",
        "t2": "Why did I say that in twenty sixteen?",
        "t3": "Okay... one more scroll.",
        "t4": "Did I lock the door?",
        "t5": "Try this instead.",
    }),
    "cycle": ("brian", {
        "q": "Three sounds. Which one gets you?",
        "n1": "Number one, rain on a tent.",
        "n2": "Number two, lake shore.",
        "n3": "Number three, slow drips.",
        "c": "Comment your number.",
    }),
    "fade": ("andrew", {
        # "Press play." alone is rejected by the service (no audio), so it is read with the next sentence.
        "h": "Press play. Close your eyes.",
        "s": "It fades out on its own.",
        "e": "Sweet dreams.",
    }),
    "pov": ("brian", {
        "h": "P O V: it's three AM, and your brain won't shut up.",
        "s": "Put this on. Just breathe.",
    }),
    "stare": ("andrew", {
        "a": "Don't look away. Keep your eyes on the dot.",
        "b": "Now look at your hand.",
        "c": "Did you notice that?",
        "d": "Now close your eyes, and just listen.",
    }),
    "pick": ("ava", {
        "q": "Which one are you sleeping to tonight?",
        "o1": "Number one: the rain.",
        "o2": "Number two, lake shore.",
        "o3": "Number three, brown noise.",
        "c": "Comment your number.",
    }),
}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "voice")


async def one(video: str) -> None:
    voice, lines = VIDEOS[video]
    out = os.path.join(ROOT, video)
    os.makedirs(out, exist_ok=True)
    for key, text in lines.items():
        raw = os.path.join(out, f"raw_{key}.mp3")
        for attempt in range(6):
            try:
                await edge_tts.Communicate(text, VOICES[voice], rate=RATE, pitch=PITCH).save(raw)
                break
            except edge_tts.exceptions.NoAudioReceived:
                if attempt == 5:
                    raise
                await asyncio.sleep(4)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", raw,
             "-af", "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=1:stop_duration=1.2:stop_threshold=-45dB,loudnorm=I=-16:TP=-1.5:LRA=7",
             "-ar", "44100", "-b:a", "192k", os.path.join(out, f"{key}.mp3")],
            check=True,
        )
        os.remove(raw)


async def main() -> None:
    for v in sys.argv[1:] or list(VIDEOS):
        await one(v)


asyncio.run(main())
