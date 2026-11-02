"""Transcribes voice lines with a local Whisper model to catch mispronounced words before rendering.

Requires: pip install faster-whisper numpy, ffmpeg on PATH (downloads the base.en model on first run).
Usage: python check_voice.py public/voice/pick/*.mp3
Compare the transcript with the line in voice.py; if a word is missing or wrong, rephrase it (e.g. sentence-final "rain"
became "the rain", "POV" became "P O V"), re-run voice.py and check again.
"""
import glob, os, subprocess, sys, warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
warnings.filterwarnings("ignore")
import numpy as np
from faster_whisper import WhisperModel

m = WhisperModel("base.en", device="cpu", compute_type="int8")

def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

for f in sys.argv[1:]:
    segs, _ = m.transcribe(load(f), language="en", beam_size=5)
    print(os.path.basename(os.path.dirname(f)) + "/" + os.path.basename(f), "->", " ".join(s.text.strip() for s in segs))
