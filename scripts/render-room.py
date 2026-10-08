"""
render-room.py — paint the home hero's empty concrete room as one image.

Procedural so it can be re-rendered at any size: a cast-concrete wall (mottling,
grain, pinholes, faint stains), a polished concrete floor that reflects the
wall, a soft contact shadow at the seam, and a warm shaft of sunlight falling
from the upper right across wall and floor. Everything that should stay crisp
or animate (linework, disc, type) is drawn by the page on top, not baked here.

Usage (from the project root):
  python scripts/render-room.py            # writes public/home/room.webp + disc.webp
  python scripts/render-room.py --preview  # also writes a small preview PNG

The composition matches the 1284 x 663 hero frame of docs/design/home-mockup.jpg:
the wall/floor horizon sits at 77.7% of the height.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "home" / "room.webp"

W, H = 2568, 1326  # 2x the mockup's hero frame
HORIZON = 0.777  # wall / floor seam, fraction of height
rng = np.random.default_rng(7)


def noise(scale: float, octaves: int = 4, aniso: float = 1.0) -> np.ndarray:
    """Fractal value noise in [-1, 1]. `scale` = size of the largest feature in px."""
    out = np.zeros((H, W), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = scale / (2**o)
        gw = max(2, int(W / (s * aniso)))
        gh = max(2, int(H / s))
        g = rng.standard_normal((gh, gw)).astype(np.float32)
        out += amp * cv2.resize(g, (W, H), interpolation=cv2.INTER_CUBIC)
        total += amp
        amp *= 0.5
    out /= total
    return out / (np.abs(out).max() + 1e-6)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = xx / W, yy / H  # 0..1 frame coordinates
hy = int(H * HORIZON)

# ─── Wall albedo: cast concrete ───────────────────────────────────────────────
wall_base = np.array([196, 182, 160], np.float32) / 255  # warm greige
mottle = noise(420, 4)
cloud = noise(140, 3)
grain = noise(6, 2)
# Dark grime patches: thresholded noise gives blotchy, irregular dirt.
grime = smoothstep(0.15, 0.75, noise(90, 4)) * (0.6 + 0.4 * smoothstep(-0.2, 0.6, noise(500, 2)))
albedo = 1 + 0.11 * mottle + 0.06 * cloud + 0.045 * grain - 0.16 * grime

# Pinholes: small dark pits with a faint lit lip, like real cast concrete.
pits = np.zeros((H, W), np.float32)
for _ in range(900):
    x, y = rng.integers(0, W), rng.integers(0, hy - 6)
    r = int(rng.choice([1, 1, 1, 2, 2, 3]))
    cv2.circle(pits, (int(x), int(y)), r, float(rng.uniform(0.25, 0.7)), -1, cv2.LINE_AA)
pits = cv2.GaussianBlur(pits, (0, 0), 0.8)
albedo *= 1 - 0.55 * pits

# Hairline cracks: short wandering dark strokes.
cracks = np.zeros((H, W), np.float32)
for _ in range(70):
    x, y = float(rng.uniform(0, W)), float(rng.uniform(0, hy - 40))
    ang = float(rng.uniform(0, np.pi))
    for _ in range(int(rng.integers(6, 22))):
        ang += float(rng.normal(0, 0.45))
        nx, ny = x + 7 * np.cos(ang), y + 7 * np.sin(ang)
        cv2.line(cracks, (int(x), int(y)), (int(nx), int(ny)), float(rng.uniform(0.3, 0.8)), 1, cv2.LINE_AA)
        x, y = nx, ny
albedo *= 1 - 0.35 * cv2.GaussianBlur(cracks, (0, 0), 0.6)

# Faint vertical water stains and a few darker blotches.
stain = smoothstep(0.55, 0.95, noise(260, 3, aniso=0.25)) * smoothstep(0.0, 0.5, v)
albedo *= 1 - 0.07 * stain
wall = albedo[..., None] * wall_base[None, None, :]

# ─── Lighting ────────────────────────────────────────────────────────────────
# Ambient: the room is lit from the right; the left side and top fall into shade.
ambient = 0.60 + 0.14 * smoothstep(0.0, 1.0, u) - 0.10 * smoothstep(0.5, 0.0, v)

# Sun shaft: a soft band running from the top-right corner down to the left,
# measured as distance from its centre line.
d = np.array([-0.72, 0.70], np.float32)
d /= np.linalg.norm(d)
n = np.array([d[1], -d[0]], np.float32)  # band normal
px, py = 0.90 * W, 0.0 * H  # a point on the centre line (top edge, right of centre)
dist = (xx - px) * n[0] + (yy - py) * n[1]
half = 0.115 * W
edge = 0.022 * W
shaft = smoothstep(half + edge, half - edge, np.abs(dist))
# The shaft is strongest high on the wall and fades as it travels down-left.
along = (xx - px) * d[0] + (yy - py) * d[1]
shaft *= smoothstep(2.1 * H, 0.2 * H, along) * (0.9 + 0.1 * noise(300, 2))
sun = np.array([1.0, 0.93, 0.80], np.float32)  # warm sunlight

light = ambient[..., None] + 0.78 * shaft[..., None] * sun[None, None, :]
wall_lit = wall * light

# Contact shadow where the wall meets the floor.
seam = smoothstep(hy - 36, hy, yy)
wall_lit *= (1 - 0.14 * seam)[..., None]

# ─── Floor: polished concrete ────────────────────────────────────────────────
floor_t = np.clip((yy - hy) / (H - hy), 0, 1)  # 0 at the seam, 1 at the bottom edge
floor_base = np.array([116, 101, 84], np.float32) / 255
# Polished concrete: broad trowel clouds, darker worn patches, fine aggregate.
floor_albedo = (
    1
    + 0.09 * noise(300, 3, aniso=3.0)
    + 0.06 * noise(60, 3, aniso=2.0)
    + 0.09 * noise(16, 2, aniso=7.0)  # fine polishing streaks, stretched sideways
    + 0.05 * noise(9, 1, aniso=1.4)
    + 0.05 * grain
    - 0.12 * smoothstep(0.3, 0.9, noise(140, 3, aniso=2.5))
)
floor = floor_albedo[..., None] * floor_base[None, None, :]
floor *= (0.85 - 0.45 * floor_t)[..., None]  # falls off toward the camera

# Reflection: the wall mirrored in the floor, blurred and faded with distance.
mirror_rows = np.clip(2 * hy - yy.astype(np.int32), 0, hy - 1)
reflection = wall_lit[mirror_rows, xx.astype(np.int32)]
reflection = cv2.GaussianBlur(reflection, (0, 0), sigmaX=2, sigmaY=7)
# Glossy where polished, duller where worn: the reflection strength varies.
gloss = 0.75 + 0.25 * noise(220, 3, aniso=3.0)
refl_amt = (0.42 * gloss * (1 - smoothstep(0.0, 1.1, floor_t)))[..., None]
floor = floor * (1 - refl_amt) + reflection * refl_amt

# Sunlight pooled on the floor: the shaft's footprint, stretched and softened.
# It runs on as a diagonal streak: nearer the camera it shifts right.
shift = 0.05 + 0.55 * floor_t
pool_x = smoothstep(0.06 + shift * 0.3, 0.32 + shift * 0.4, u)
pool_y = smoothstep(0.0, 0.08, floor_t) * smoothstep(0.85, 0.30, floor_t)
pool = pool_x * pool_y * (0.85 + 0.15 * noise(420, 2, aniso=6.0))
floor += (0.34 * pool * floor_albedo**2)[..., None] * sun[None, None, :]
floor *= (1 - 0.30 * (1 - smoothstep(0.0, 0.015, floor_t)))[..., None]  # fine dark seam line

img = np.where((yy < hy)[..., None], wall_lit, floor)

# ─── Camera: vignette, a touch of warmth, film grain ─────────────────────────
vig = 1 - 0.38 * smoothstep(0.35, 1.05, np.hypot((u - 0.55) * 1.15, (v - 0.45) * 1.0))
img *= vig[..., None]
img += 0.012 * noise(3, 1)[..., None]

img = np.clip(img, 0, 1)
out = (img[..., ::-1] * 255 + 0.5).astype(np.uint8)  # RGB → BGR for OpenCV


def render_disc(size: int = 900) -> np.ndarray:
    """The black stone disc's surface: near-black with faint mineral veining and specks."""
    global W, H
    W0, H0 = W, H
    W = H = size
    base = 0.055 + 0.02 * noise(260, 4) + 0.012 * noise(30, 2)
    veins = smoothstep(0.82, 0.98, 1 - np.abs(noise(180, 5)))  # thin ridges of the noise field
    base += 0.028 * veins * (0.5 + 0.5 * noise(400, 2))
    specks = np.zeros((size, size), np.float32)
    for _ in range(1800):
        x, y = rng.integers(0, size, 2)
        cv2.circle(specks, (int(x), int(y)), 1, float(rng.uniform(0.2, 0.6)), -1, cv2.LINE_AA)
    base += 0.14 * cv2.GaussianBlur(specks, (0, 0), 0.5)
    # A soft sheen where the sunlight grazes it from the upper right.
    yy0, xx0 = np.mgrid[0:size, 0:size].astype(np.float32) / size
    base += 0.03 * smoothstep(0.9, 0.2, np.hypot(xx0 - 0.85, yy0 - 0.15))
    W, H = W0, H0
    rgb = np.stack([base * 1.02, base, base * 0.96], -1)  # a hair warm
    return (np.clip(rgb[..., ::-1], 0, 1) * 255 + 0.5).astype(np.uint8)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT), out, [cv2.IMWRITE_WEBP_QUALITY, 80])
    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB, {W}x{H})")
    disc = OUT.with_name("disc.webp")
    cv2.imwrite(str(disc), render_disc(), [cv2.IMWRITE_WEBP_QUALITY, 82])
    print(f"Wrote {disc.relative_to(ROOT)} ({disc.stat().st_size // 1024} KB)")
    if args.preview:
        prev = OUT.with_name("room-preview.png")
        cv2.imwrite(str(prev), cv2.resize(out, (W // 2, H // 2), interpolation=cv2.INTER_AREA))
        print(f"Wrote {prev.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
