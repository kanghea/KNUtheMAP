"""
Slice the 4-frame "stop / 거부" gesture animation triggered on user tap.

Usage:
  python3 scripts/slice_tap_frames.py <source.jpg> [<out_dir>]

Source: 612x408 JPEG with 4 chibi characters arranged horizontally.
Each frame is auto-detected via vertical bands (variable widths).

Output: 256x256 RGBA PNGs aligned to the same baseline + centroid X
        as the running frames so swap-in is seamless.
"""
from PIL import Image
import numpy as np
from scipy.ndimage import label
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/new-image-1.jpeg'
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'images', 'loading-runner-tap',
)

CANVAS = 256
BASELINE_FROM_BOTTOM = 22
TARGET_HEIGHT_PX = 215

WHITE_THR = 238
ALPHA_RAMP = 18
BAND_MIN_NONWHITE = 5
BAND_MIN_GAP = 8     # bigger gap so adjacent frames don't merge

os.makedirs(OUT_DIR, exist_ok=True)
src = np.array(Image.open(SRC).convert('RGB'))
H, W = src.shape[:2]
print(f'source: {W}x{H}')


def whiteish(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r >= WHITE_THR) & (g >= WHITE_THR) & (b >= WHITE_THR)


def horizontal_bands(mask):
    counts = mask.sum(axis=0)
    bands, in_band, gap = [], False, 0
    for x in range(len(counts)):
        if counts[x] >= BAND_MIN_NONWHITE:
            if not in_band: in_band, start = True, x
            gap = 0
        else:
            if in_band:
                gap += 1
                if gap >= BAND_MIN_GAP:
                    bands.append((start, x - gap))
                    in_band, gap = False, 0
    if in_band: bands.append((start, len(counts) - 1))
    return bands


def background_alpha(rgb):
    h, w = rgb.shape[:2]
    white = whiteish(rgb)
    structure = np.array([[0,1,0],[1,1,1],[0,1,0]], dtype=bool)
    labels, _ = label(white, structure=structure)
    border = set()
    border.update(labels[0, :].tolist())
    border.update(labels[-1, :].tolist())
    border.update(labels[:, 0].tolist())
    border.update(labels[:, -1].tolist())
    border.discard(0)
    bg = np.isin(labels, list(border))
    rgb_i = rgb.astype(np.int16)
    whiteness = rgb_i.min(axis=2)
    edge_a = np.clip((WHITE_THR - whiteness) * (255.0 / ALPHA_RAMP), 0, 255).astype(np.uint8)
    alpha = np.where(bg, 0, np.maximum(edge_a, 0))
    alpha = np.where(~bg & ~white, 255, alpha)
    alpha = np.where(~bg & white, 255, alpha)
    return alpha.astype(np.uint8)


# Locate 4 horizontal frames
mask_full = ~whiteish(src)
bands = horizontal_bands(mask_full)
print(f'detected {len(bands)} frame bands:')
for b in bands:
    print(f'  x={b[0]}..{b[1]}  w={b[1]-b[0]+1}')
if len(bands) != 4:
    raise RuntimeError(f'expected 4 frames, got {len(bands)}')

# Per-frame metrics
metrics = []
for idx, (x_a, x_b) in enumerate(bands):
    pad_x = 4
    x0 = max(0, x_a - pad_x)
    x1 = min(W - 1, x_b + pad_x)
    cell = src[:, x0:x1+1]
    cmask = ~whiteish(cell)
    ys, xs = np.where(cmask)
    if len(ys) == 0:
        raise RuntimeError(f'empty frame {idx+1}')
    x_min, x_max = int(xs.min()), int(xs.max())
    y_min, y_max = int(ys.min()), int(ys.max())
    col_counts = cmask.sum(axis=0)
    cx = float((np.arange(cmask.shape[1]) * col_counts).sum() / col_counts.sum())
    metrics.append(dict(idx=idx+1, char=cell, cx=cx,
        x_min=x_min, x_max=x_max, y_min=y_min, y_max=y_max,
        h=y_max-y_min+1, w=x_max-x_min+1))

print('per-frame bbox + centroid:')
for m in metrics:
    print(f"  f{m['idx']:02d}: w={m['w']:3d} h={m['h']:3d} cx={m['cx']:6.2f}")

max_h = max(m['h'] for m in metrics)
scale = TARGET_HEIGHT_PX / max_h
print(f'  max h={max_h}px  scale={scale:.4f}')

for m in metrics:
    char = m['char']
    alpha = background_alpha(char)
    rgba = np.dstack([char, alpha])
    pad = 6
    x0 = max(0, m['x_min'] - pad); x1 = min(char.shape[1], m['x_max'] + pad + 1)
    y0 = max(0, m['y_min'] - pad); y1 = min(char.shape[0], m['y_max'] + pad + 1)
    crop = rgba[y0:y1, x0:x1]
    cx_rel = m['cx'] - x0
    by_rel = m['y_max'] - y0
    crop_img = Image.fromarray(crop, 'RGBA')
    nw = max(1, int(round(crop.shape[1] * scale)))
    nh = max(1, int(round(crop.shape[0] * scale)))
    crop_resized = crop_img.resize((nw, nh), Image.LANCZOS)
    cxs = cx_rel * scale
    bys = by_rel * scale
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    px = int(round(CANVAS / 2 - cxs))
    py = int(round((CANVAS - BASELINE_FROM_BOTTOM) - bys))
    canvas.alpha_composite(crop_resized, dest=(px, py))
    out = os.path.join(OUT_DIR, f"frame-{m['idx']:02d}.png")
    canvas.save(out, 'PNG', optimize=True)
    print(f"  wrote {os.path.basename(out)} ({os.path.getsize(out)/1024:.1f} KB)")

print('done.')
