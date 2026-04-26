"""
Slice the 12-frame running animation design into individual aligned PNGs.

Usage:
  python3 scripts/slice_runner_frames.py <source.jpg> [<out_dir>]

Defaults:
  source = ./runner-source.jpg
  out    = public/images/loading-runner/  (relative to repo root)

Source layout (1536 x 1024):
  - 2 rows x 6 cols, each cell 256x512
  - Each cell stacks: (optional title)(label)(white gap)(CHARACTER w/ shadow)
  - The character is the *tallest* vertical band of non-white pixels.

Background removal:
  - Cell-internal whites (jacket sleeves, sneaker stripes, eye whites) MUST stay opaque.
  - Approach: connected-component flood-fill from cell borders through "white-ish"
    pixels. Only those background-connected whites become transparent.
  - Smooth alpha at the boundary using a small ramp on the *whiteness* of pixels
    that are NOT background-connected (so anti-aliased outline edges blend cleanly).

Alignment:
  - For each character, compute centroid X (column-weighted by mask) and bottom-most
    non-white pixel Y. Compose onto uniform CANVAS so:
      centroid X -> canvas center X
      feet Y      -> canvas bottom - BASELINE_FROM_BOTTOM
"""
from PIL import Image
import numpy as np
from scipy.ndimage import label
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'runner-source.jpg'
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'images', 'loading-runner',
)

COLS, ROWS = 6, 2
CELL_W, CELL_H = 256, 512

CANVAS = 256
BASELINE_FROM_BOTTOM = 22
TARGET_HEIGHT_PX = 215

WHITE_THR = 238           # pixel >= WHITE_THR on all RGB channels = "background-eligible"
ALPHA_RAMP = 18           # smoothing band for outline alpha

BAND_MIN_NONWHITE = 5
BAND_MIN_GAP = 3

os.makedirs(OUT_DIR, exist_ok=True)

src = np.array(Image.open(SRC).convert('RGB'))
H_SRC, W_SRC = src.shape[:2]
assert (H_SRC, W_SRC) == (ROWS * CELL_H, COLS * CELL_W), f'unexpected source size {W_SRC}x{H_SRC}'


def whiteish(rgb_block: np.ndarray) -> np.ndarray:
    r, g, b = rgb_block[..., 0], rgb_block[..., 1], rgb_block[..., 2]
    return (r >= WHITE_THR) & (g >= WHITE_THR) & (b >= WHITE_THR)


def vertical_bands_from_mask(mask: np.ndarray) -> list[tuple[int, int]]:
    """Bands of rows where mask has >= BAND_MIN_NONWHITE True per row."""
    counts = mask.sum(axis=1)
    bands = []
    in_band, cur_start, gap = False, 0, 0
    for y in range(len(counts)):
        if counts[y] >= BAND_MIN_NONWHITE:
            if not in_band:
                in_band, cur_start = True, y
            gap = 0
        else:
            if in_band:
                gap += 1
                if gap >= BAND_MIN_GAP:
                    bands.append((cur_start, y - gap))
                    in_band, gap = False, 0
    if in_band:
        bands.append((cur_start, len(counts) - 1))
    return bands


def background_alpha(rgb_block: np.ndarray) -> np.ndarray:
    """Return alpha (uint8) array: 0 for outside-connected whites, ~255 for character."""
    h, w = rgb_block.shape[:2]
    white = whiteish(rgb_block)

    # Connected components on white pixels.
    # 4-connectivity: stricter so anti-aliased near-white outlines dont accidentally bridge interior whites to outside.
    structure = np.array([[0, 1, 0],
                          [1, 1, 1],
                          [0, 1, 0]], dtype=bool)
    labels, _ = label(white, structure=structure)

    # Background labels = those touching the border
    border_labels = set()
    border_labels.update(labels[0, :].tolist())
    border_labels.update(labels[-1, :].tolist())
    border_labels.update(labels[:, 0].tolist())
    border_labels.update(labels[:, -1].tolist())
    border_labels.discard(0)  # 0 = non-white pixels in label output

    bg_mask = np.isin(labels, list(border_labels))

    # Smooth alpha at character outline:
    # alpha 0 for definite background, 255 for definitely-not-white pixels,
    # and a linear ramp at the boundary to keep AA edges clean.
    rgb = rgb_block.astype(np.int16)
    whiteness = rgb.min(axis=2)             # 0..255
    edge_alpha = np.clip((WHITE_THR - whiteness) * (255.0 / ALPHA_RAMP), 0, 255).astype(np.uint8)

    alpha = np.where(bg_mask, 0, np.maximum(edge_alpha, 255 if False else 0))

    # For pixels that are NOT background AND not whiteish -> fully opaque
    alpha = np.where(~bg_mask & ~white, 255, alpha)
    # For pixels that are NOT background but ARE whiteish (interior white like sleeves) -> opaque
    alpha = np.where(~bg_mask & white, 255, alpha)
    return alpha.astype(np.uint8)


def to_rgba(rgb_block: np.ndarray) -> np.ndarray:
    alpha = background_alpha(rgb_block)
    return np.dstack([rgb_block, alpha])


# Per-frame metrics
metrics = []
for idx in range(12):
    row, col = idx // COLS, idx % COLS
    cell = src[row*CELL_H:(row+1)*CELL_H, col*CELL_W:(col+1)*CELL_W]
    mask = ~whiteish(cell)
    bands = vertical_bands_from_mask(mask)
    cy0, cy1 = max(bands, key=lambda b: b[1] - b[0])
    cy0, cy1 = max(0, cy0 - 2), min(CELL_H - 1, cy1 + 2)
    char = cell[cy0:cy1+1, :]
    cmask = ~whiteish(char)
    if not cmask.any():
        raise RuntimeError(f'no character pixels in frame {idx+1}')
    ys, xs = np.where(cmask)
    x_min, x_max = int(xs.min()), int(xs.max())
    y_min, y_max = int(ys.min()), int(ys.max())
    col_counts = cmask.sum(axis=0)
    cx_centroid = float((np.arange(cmask.shape[1]) * col_counts).sum() / col_counts.sum())
    metrics.append({
        'idx': idx + 1,
        'cell_band': (cy0, cy1),
        'char': char,
        'cx': cx_centroid,
        'x_min': x_min, 'x_max': x_max,
        'y_min': y_min, 'y_max': y_max,
        'height_px': y_max - y_min + 1,
        'width_px':  x_max - x_min + 1,
    })

print('per-frame character bbox + centroid:')
for m in metrics:
    cb = m['cell_band']
    print(f"  f{m['idx']:02d}: cell-band y={cb[0]:3d}..{cb[1]:3d}  bbox w={m['width_px']:3d} h={m['height_px']:3d}  cx={m['cx']:6.2f}")

max_height = max(m['height_px'] for m in metrics)
scale = TARGET_HEIGHT_PX / max_height
print(f'  max h={max_height}px  scale={scale:.4f}')

for m in metrics:
    char = m['char']
    rgba_full = to_rgba(char)

    pad = 6
    x0 = max(0, m['x_min'] - pad)
    x1 = min(char.shape[1], m['x_max'] + pad + 1)
    y0 = max(0, m['y_min'] - pad)
    y1 = min(char.shape[0], m['y_max'] + pad + 1)
    crop = rgba_full[y0:y1, x0:x1]

    cx_rel = m['cx'] - x0
    by_rel = m['y_max'] - y0

    crop_img = Image.fromarray(crop, 'RGBA')
    new_w = max(1, int(round(crop.shape[1] * scale)))
    new_h = max(1, int(round(crop.shape[0] * scale)))
    crop_resized = crop_img.resize((new_w, new_h), Image.LANCZOS)
    cx_rel_s = cx_rel * scale
    by_rel_s = by_rel * scale

    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    paste_x = int(round(CANVAS / 2 - cx_rel_s))
    paste_y = int(round((CANVAS - BASELINE_FROM_BOTTOM) - by_rel_s))
    canvas.alpha_composite(crop_resized, dest=(paste_x, paste_y))

    out_path = os.path.join(OUT_DIR, f'frame-{m["idx"]:02d}.png')
    canvas.save(out_path, 'PNG', optimize=True)
    print(f"  wrote frame-{m['idx']:02d}.png  ({os.path.getsize(out_path)/1024:.1f} KB)")

print('done.')
