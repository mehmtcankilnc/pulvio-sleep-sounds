"""
Derive every app-icon / store asset from two source renders — deterministic
image processing only, no generation.

Sources:
  PADDED     moon + clouds on transparent (matte clay), ~1254 sq
  FULL_BLEED same art on the plum starfield night background, ~1254 sq

Outputs (../assets):
  icon.png                 1024  iOS + Expo `icon`      (from FULL_BLEED, no alpha)
  play-store-icon.png       512  Play Store listing      (from FULL_BLEED)
  adaptive-icon.png        1024  Android adaptive fg     (from PADDED, transparent)
  adaptive-monochrome.png  1024  Android 13 themed icon  (flat white, transparent)
  notification-icon.png      96  Android status bar      (flat white, transparent)
  splash-icon.png          1024  expo-splash-screen      (from PADDED, transparent)
  feature-graphic.png  1024x500  Play Store feature grx  (composited)

Run:  python scripts/build_icons.py [PADDED.png] [FULL_BLEED.png]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

DL = Path(r"C:\Users\mehmt\Downloads")
PADDED = Path(sys.argv[1]) if len(sys.argv) > 1 else DL / "ChatGPT Image 26 Ağu 2026 11_26_07.png"
FULL_BLEED = Path(sys.argv[2]) if len(sys.argv) > 2 else DL / "ChatGPT Image 26 Ağu 2026 11_20_09.png"
OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(exist_ok=True)

ALPHA_FLOOR = 12          # drop sub-threshold halo/noise pixels
FOREGROUND_FRAC = 0.58    # longest content side vs canvas (adaptive safe zone)
NOTIF_FRAC = 0.78
SPLASH_FRAC = 0.46
VNUDGE = -0.03            # lift the group so the low clouds sit nearer centre

BG_DEEP = (18, 10, 16)     # #120a10  token bgDeep
BG_TOP = (42, 26, 33)      # #2a1a21  token bgTop
STARLIGHT = (244, 212, 188)  # #f4d4bc token star
EMBER = (230, 140, 90)     # glow


def load_padded() -> Image.Image:
    im = Image.open(PADDED).convert("RGBA")
    r, g, b, a = im.split()
    a = a.point(lambda p: p if p >= ALPHA_FLOOR else 0)
    im = Image.merge("RGBA", (r, g, b, a))
    return im.crop(a.getbbox())


def place(content: Image.Image, canvas: int, frac: float, vnudge: float = VNUDGE) -> Image.Image:
    cw, ch = content.size
    scale = (canvas * frac) / max(cw, ch)
    new = (max(1, round(cw * scale)), max(1, round(ch * scale)))
    c = content.resize(new, Image.LANCZOS)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(c, ((canvas - new[0]) // 2,
                  (canvas - new[1]) // 2 + round(canvas * vnudge)), c)
    return out


def whiten(im: Image.Image) -> Image.Image:
    a = im.split()[3].point(lambda p: 255 if p >= 128 else min(255, int(p * 1.6)))
    w = Image.new("RGBA", im.size, (255, 255, 255, 0))
    w.putalpha(a)
    return w


def square_from_fullbleed(size: int) -> Image.Image:
    im = Image.open(FULL_BLEED).convert("RGB")
    return im.resize((size, size), Image.LANCZOS)


def vgradient(w: int, h: int, top, bottom) -> Image.Image:
    base = Image.new("RGB", (w, h))
    px = base.load()
    for y in range(h):
        t = y / (h - 1)
        px[0, y] = (round(top[0] + (bottom[0] - top[0]) * t),
                    round(top[1] + (bottom[1] - top[1]) * t),
                    round(top[2] + (bottom[2] - top[2]) * t))
    for y in range(h):
        row = px[0, y]
        for x in range(w):
            px[x, y] = row
    return base


def radial_glow(size: int, color, max_alpha: int) -> Image.Image:
    g = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    steps = 40
    for i in range(steps, 0, -1):
        r = size * i / steps / 2
        a = round(max_alpha * (1 - i / steps) ** 2)
        d.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
                  fill=color + (a,))
    return g


def feature_graphic() -> Image.Image:
    W, H = 1024, 500
    canvas = vgradient(W, H, BG_TOP, BG_DEEP).convert("RGBA")

    # faint starfield (deterministic)
    import random
    rnd = random.Random(7)
    d = ImageDraw.Draw(canvas)
    for _ in range(26):
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        if 250 < x < 774:                 # keep clear of the centred art zone
            continue
        rad = rnd.choice([1, 1, 1, 2])
        a = rnd.randint(40, 120)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=STARLIGHT + (a,))

    art = load_padded()
    target_h = round(H * 0.78)
    scale = target_h / art.size[1]
    art = art.resize((round(art.size[0] * scale), target_h), Image.LANCZOS)
    ax = (W - art.size[0]) // 2          # centred: safe from Play edge cropping
    ay = (H - art.size[1]) // 2 + 6

    glow = radial_glow(int(art.size[0] * 1.5), EMBER, 60)
    canvas.alpha_composite(
        glow, (ax + art.size[0] // 2 - glow.size[0] // 2,
               ay + art.size[1] // 2 - glow.size[0] // 2))
    canvas.alpha_composite(art, (ax, ay))
    return canvas.convert("RGB")


def main() -> None:
    padded = load_padded()
    print(f"padded content {padded.size}")

    square_from_fullbleed(1024).save(OUT / "icon.png")
    square_from_fullbleed(512).save(OUT / "play-store-icon.png")

    fg = place(padded, 1024, FOREGROUND_FRAC)
    fg.save(OUT / "adaptive-icon.png")
    place(padded, 1024, SPLASH_FRAC).save(OUT / "splash-icon.png")
    whiten(fg).save(OUT / "adaptive-monochrome.png")
    whiten(place(padded, 96, NOTIF_FRAC)).save(OUT / "notification-icon.png")

    feature_graphic().save(OUT / "feature-graphic.png")

    for p in ("icon.png", "play-store-icon.png", "adaptive-icon.png",
              "adaptive-monochrome.png", "notification-icon.png",
              "splash-icon.png", "feature-graphic.png"):
        im = Image.open(OUT / p)
        print(f"  {p:24} {im.size[0]}x{im.size[1]} {im.mode}")


if __name__ == "__main__":
    main()
