"""
Re-slice the 12-frame running animation from a NEW (user-cleaned) source.

Usage:
  python3 scripts/slice_runner_frames_v2.py <source.jpg> [<out_dir>]

Source layout (612x408, 6x2 grid):
  - cell width  = 612 / 6 = 102 px
  - cell height = 408 / 2 = 204 px
  - Each cell has (label band)(white gap)(CHARACTER w/ shadow)
  - Character is the *tallest* vertical band of non-white pixels.

Identical algorithm to v1 (older 1536x1024 source) but auto-adapts to the
smaller source. Output is the same uniform 256x256 RGBA.
"""
from PIL import Image
import numpy as np
from scipy.ndimage import label
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/new-image-2.jpeg'
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'images', 'loading-runner',
)

COLS, ROWS = 6, 2
CANVAS = 256
BASELINE_FROM_BOTTOM = 22
TARGET_HEIGHT_PX = 215

WHITE_THR = 238
ALPHA_RAMP = 18
BAND_MIN_NONWHITE = 5
BAND_MIN_GAP = 3

os.makedirs(OUT_DIR, exist_ok=True)

src = np.array(Image.open(SRC).convert('RGB'))
H_SRC, W_SRC = src.shape[:2]
CELL_W = W_SRC // COLS
CELL_H = H_SRC // ROWS
print(f'source: {W_SRC}x{H_SRC}  cell: {CELL_W}x{CELL_H}')


def whiteish(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r >= WHITE_THR) & (g >= WHITE_THR) & (b >= WHITE_THR)


def vertical_bands_from_mask(mask):
    counts = mask.sum(axis=1)
    bands, in_band, gap = [], False, 0
    for y in range(len(counts)):
        if counts[y] >= BAND_MIN_NONWHITE:
            if not in_band: in_band, start = True, y
            gap = 0
        else:
            if in_band:
                gap += 1
                if gap >= BAND_MIN_GAP:
                    bands.append((start, y - gap))
                    in_band, gap = False, 0
    if in_band: bands.append((start, len(counts) - 1))
    return bands


def background_alpha(rgb):
    h, w = rgb.shape[:2]
    white = whiteish(rgb)
    structure = np.array([[0,1,0],[1,1,1],[0,1,0]], dtype=bool)
    labels, _ = label(white, structure=structure)
    border_labels = set()
    border_labels.update(labels[0, :].tolist())
    border_labels.update(labels[-1, :].tolist())
    border_labels.update(labels[:, 0].tolist())
    border_labels.update(labels[:, -1].tolist())
    border_labels.discard(0)
    bg_mask = np.isin(labels, list(border_labels))
    rgb_i = rgb.astype(np.int16)
    whiteness = rgb_i.min(axis=2)
    edge_alpha = np.clip((WHITE_THR - whiteness) * (255.0 / ALPHA_RAMP), 0, 255).astype(np.uint8)
    alpha = np.where(bg_mask, 0, np.maximum(edge_alpha, 0))
    alpha = np.where(~bg_mask & ~white, 255, alpha)
    alpha = np.where(~bg_mask & white, 255, alpha)
    return alpha.astype(np.uint8)


metrics = []
for idx in range(12):
    row, col = idx // COLS, idx % COLS
    cell = src[row*CELL_H:(row+1)*CELL_H, col*CELL_W:(col+1)*CELL_W]
    mask = ~whiteish(cell)
    bands = vertical_bands_from_mask(mask)
    if not bands:
        raise RuntimeError(f'no bands in frame {idx+1}')
    cy0, cy1 = max(bands, key=lambda b: b[1] - b[0])
    cy0, cy1 = max(0, cy0 - 2), min(CELL_H - 1, cy1 + 2)
    char = cell[cy0:cy1+1, :]
    cmask = ~whiteish(char)
    ys, xs = np.where(cmask)
    x_min, x_max = int(xs.min()), int(xs.max())
    y_min, y_max = int(ys.min()), int(ys.max())
    col_counts = cmask.sum(axis=0)
    cx = float((np.arange(cmask.shape[1]) * col_counts).sum() / col_counts.sum())
    metrics.append(dict(idx=idx+1, char=char, cx=cx,
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
