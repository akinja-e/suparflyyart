"""
cut-balloon.py — split the balloon scene into two layers so the balloon can float.

Input:  docs/design/balloon-scene.jpg (the artwork)
Output: public/scene/sky.webp      the scene with the balloon removed (sky repainted)
        public/scene/balloon.webp  the balloon + basket on transparency
and prints the balloon's box as percentages of the frame, for BalloonScene.tsx.

How:
 1. Find the balloon by colour (saturated red), fill its holes (the white S mark),
    and add the ropes/basket hanging beneath it.
 2. Repaint the sky under that area (OpenCV inpainting — the sky there is a
    smooth gradient, so this is invisible).
 3. Build a soft matte: inside the balloon's area, each pixel's opacity is how
    different it is from the repainted sky. Edges stay soft, sky between the
    ropes stays see-through.
 4. Upscale both layers 2x (the source is only 960 px wide) with Lanczos and a
    light unsharp mask, and save as WebP.

Usage: python scripts/cut-balloon.py
Replace docs/design/balloon-scene.jpg with a higher-resolution version of the
same artwork and re-run for a sharper result.
"""

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "design" / "balloon-scene.jpg"
OUT = ROOT / "public" / "scene"
SCALE = 2

img = cv2.imread(str(SRC))
if img is None:
    raise SystemExit(f"Could not read {SRC}")
H, W = img.shape[:2]

# 1 ─ Balloon mask by colour: the largest saturated-red region in the sky.
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv)
red = (((h < 9) | (h > 168)) & (s > 110) & (v > 80)).astype(np.uint8) * 255
n, labels, stats, _ = cv2.connectedComponentsWithStats(red)
# Only regions entirely in the sky (upper 60%) count — the wet floor and the
# flower beds reflect red too.
in_sky = [i for i in range(1, n) if stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] < 0.6 * H]
balloon_id = max(in_sky, key=lambda i: stats[i, cv2.CC_STAT_AREA])
bx, by, bw, bh = stats[balloon_id, :4]
# The sunlit flank is orange, not red. Grow the red core's convex hull into warm,
# saturated pixels — but only within a narrow band around it, because the sunset
# sky is warm too. A balloon envelope is convex, so the final hull also swallows
# the white S printed on it.
core = (labels == balloon_id).astype(np.uint8) * 255
hull = np.zeros_like(red)
cv2.fillConvexPoly(hull, cv2.convexHull(cv2.findNonZero(core)), 255)
band = cv2.dilate(hull, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(0.16 * bw) | 1,) * 2))
warm = (((h < 22) | (h > 165)) & (s > 150) & (v > 120)).astype(np.uint8) * 255
grown = hull | (warm & band)
grown = cv2.morphologyEx(grown, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(grown)
keep = (lab2 == lab2[by + bh // 2, bx + bw // 2]).astype(np.uint8)
pts = cv2.findNonZero(keep)
envelope = np.zeros_like(red)
cv2.fillConvexPoly(envelope, cv2.convexHull(pts), 255)
bx, by, bw, bh = cv2.boundingRect(pts)

# Ropes and basket hang below the envelope's mouth: a narrow region under it.
region = envelope.copy()
cx = bx + bw // 2
basket_top, basket_bottom = by + bh - 6, by + bh + int(0.18 * bh)
basket_half = max(10, int(0.12 * bw))
box = np.zeros_like(region)
cv2.rectangle(box, (cx - basket_half, basket_top), (cx + basket_half, basket_bottom), 255, cv2.FILLED)
# Within that box keep only the rigging itself: pixels clearly darker than the
# local sky (estimated by a wide median), so the hole hugs the ropes and basket.
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16)
local_sky = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 21).astype(np.int16)
rig = ((local_sky - gray) > 22).astype(np.uint8) * 255 & box
rig = cv2.dilate(rig, np.ones((3, 3), np.uint8))
region |= rig

# 2 ─ Repaint the sky under the balloon (with a margin for the soft edge).
# A sunset sky changes mostly top-to-bottom, so each column of the hole is filled
# by blending the sky just above it into the sky just below it, plus a touch of
# grain so the patch doesn't look airbrushed.
hole = cv2.dilate(envelope, np.ones((5, 5), np.uint8))  # a hair wider than the envelope
sky = img.astype(np.float32).copy()
ring = 4  # average a few pixels outside the hole for stable end colours
for x in range(W):
    col = np.nonzero(hole[:, x])[0]
    if col.size == 0:
        continue
    top, bot = col.min(), col.max()
    a = img[max(0, top - ring) : top, x].astype(np.float32).mean(0) if top > 0 else img[bot + 1, x]
    b = img[bot + 1 : min(H, bot + 1 + ring), x].astype(np.float32).mean(0) if bot + 1 < H else a
    t = np.linspace(0, 1, bot - top + 1)[:, None]
    sky[top : bot + 1, x] = a * (1 - t) + b * t
# Smooth sideways so neighbouring columns agree, only inside the hole.
smooth = cv2.GaussianBlur(sky, (0, 0), sigmaX=6, sigmaY=1.5)
inside = (hole > 0)[..., None]
grain = np.random.default_rng(3).normal(0, 1.6, sky.shape).astype(np.float32)
sky = np.where(inside, smooth + grain, sky)
sky = np.clip(sky, 0, 255).astype(np.uint8)
# Under the ropes and basket the sky has small cloud detail; inpainting suits
# that small area better than the column blend.
small = (cv2.dilate(region, np.ones((5, 5), np.uint8)) > 0) & (hole == 0)
if small.any():
    sky = cv2.inpaint(sky, small.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)

# 3 ─ Soft matte: opacity = how unlike the sky each pixel is, inside the region.
# Only the balloon travels: the envelope (solid, with a 1px soft edge) and the
# ropes/basket — which are darker than the sky behind them. Bright sky and cloud
# pixels are left out, so nothing pale moves with the balloon.
env_soft = cv2.GaussianBlur((envelope > 0).astype(np.float32), (0, 0), 0.9)
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
sky_lum = cv2.cvtColor(sky, cv2.COLOR_BGR2GRAY).astype(np.float32)
darker = np.clip((sky_lum - lum - 18) / 30, 0, 1)
rigging = darker * ((region > 0) & (envelope == 0))
alpha = np.maximum(env_soft, cv2.GaussianBlur(rigging, (0, 0), 0.5))

# Crop the balloon layer to its box (plus padding).
ys, xs = np.nonzero(alpha > 0.02)
pad = 6
x0, x1 = max(0, xs.min() - pad), min(W, xs.max() + pad + 1)
y0, y1 = max(0, ys.min() - pad), min(H, ys.max() + pad + 1)
rgba = np.dstack([img, (alpha * 255).astype(np.uint8)])[y0:y1, x0:x1]


def upscale(a: np.ndarray) -> np.ndarray:
    big = cv2.resize(a, (a.shape[1] * SCALE, a.shape[0] * SCALE), interpolation=cv2.INTER_LANCZOS4)
    if big.shape[2] == 3:
        blur = cv2.GaussianBlur(big, (0, 0), 1.2)
        big = cv2.addWeighted(big, 1.35, blur, -0.35, 0)
    return big


OUT.mkdir(parents=True, exist_ok=True)
cv2.imwrite(str(OUT / "sky.webp"), upscale(sky), [cv2.IMWRITE_WEBP_QUALITY, 86])
cv2.imwrite(str(OUT / "balloon.webp"), upscale(rgba), [cv2.IMWRITE_WEBP_QUALITY, 92])

print(f"frame {W * SCALE}x{H * SCALE}")
print(
    "balloon box (% of frame): "
    f"left {100 * x0 / W:.3f}  top {100 * y0 / H:.3f}  width {100 * (x1 - x0) / W:.3f}  height {100 * (y1 - y0) / H:.3f}"
)
for f in ("sky.webp", "balloon.webp"):
    print(f, (OUT / f).stat().st_size // 1024, "KB")
