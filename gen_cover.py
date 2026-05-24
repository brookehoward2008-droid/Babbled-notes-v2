"""
gen_cover.py  --  babbled notes x Hermes Agent cover image generator
Outputs: hermes-cover.png  (1500 x 500 px, DEV.to ready)

Run:  python gen_cover.py
"""

import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1500, 500
OUT  = "hermes-cover.png"

# ── palette ────────────────────────────────────────────────────────────────
BG        = (8,   8,  14)       # near-black
PURPLE    = (160, 80, 255)      # deep gem purple
CYAN      = (0,  220, 220)      # teal accent
GOLD      = (255, 210,  60)     # warm highlight
WHITE     = (240, 240, 255)
DIM_WHITE = (120, 110, 150)

# ── canvas ─────────────────────────────────────────────────────────────────
img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── helpers ────────────────────────────────────────────────────────────────

def hex_points(cx, cy, r, angle_offset=0):
    pts = []
    for i in range(6):
        a = math.radians(60 * i + angle_offset)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def glow_hex(cx, cy, r, color, layers=8, angle_offset=0):
    for i in range(layers, 0, -1):
        scale   = 1 + i * 0.06
        alpha   = int(18 + i * 4)
        pts     = hex_points(cx, cy, r * scale, angle_offset)
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od      = ImageDraw.Draw(overlay)
        od.polygon(pts, outline=(*color, alpha), fill=(*color, alpha // 5))
        img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))


def facet_lines(cx, cy, r, color, angle_offset=0):
    d = ImageDraw.Draw(img)
    for i in range(6):
        a  = math.radians(60 * i + angle_offset)
        ex = cx + r * math.cos(a)
        ey = cy + r * math.sin(a)
        d.line([(cx, cy), (ex, ey)], fill=(*color, 60), width=1)


def draw_waveform(cx, cy, width, height, color, segments=120, seed=42):
    random.seed(seed)
    d    = ImageDraw.Draw(img)
    step = width / segments
    prev = None
    for i in range(segments + 1):
        x   = cx - width // 2 + i * step
        amp = random.gauss(0, 1) * (height / 3)
        # taper towards edges
        t   = 1 - abs((i / segments) - 0.5) * 2
        amp *= t ** 1.4
        y   = cy + amp
        if prev:
            d.line([prev, (x, y)], fill=color, width=2)
        prev = (x, y)


def draw_grid(alpha=18):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od      = ImageDraw.Draw(overlay)
    spacing = 40
    for x in range(0, W, spacing):
        od.line([(x, 0), (x, H)], fill=(80, 60, 120, alpha))
    for y in range(0, H, spacing):
        od.line([(0, y), (W, y)], fill=(80, 60, 120, alpha))
    base = img.convert("RGBA")
    img.paste(Image.alpha_composite(base, overlay).convert("RGB"))


def particle_field(n=140, seed=7):
    rng = random.Random(seed)
    d   = ImageDraw.Draw(img)
    for _ in range(n):
        x    = rng.randint(0, W)
        y    = rng.randint(0, H)
        r    = rng.choice([1, 1, 1, 2])
        col  = rng.choice([PURPLE, CYAN, (200, 160, 255)])
        alph = rng.randint(30, 100)
        d.ellipse([x-r, y-r, x+r, y+r], fill=(*col, alph))


# ── background depth ───────────────────────────────────────────────────────
draw_grid()
particle_field()

# ── left gem (large, purple) ───────────────────────────────────────────────
GEM_CX, GEM_CY = 240, H // 2
GEM_R  = 160

glow_hex(GEM_CX, GEM_CY, GEM_R, PURPLE, layers=10, angle_offset=30)
facet_lines(GEM_CX, GEM_CY, GEM_R, PURPLE, angle_offset=30)

pts_main = hex_points(GEM_CX, GEM_CY, GEM_R, angle_offset=30)
draw.polygon(pts_main, outline=PURPLE, fill=None)

# inner gem ring
pts_inner = hex_points(GEM_CX, GEM_CY, GEM_R * 0.55, angle_offset=30)
draw.polygon(pts_inner, outline=(*PURPLE, 120), fill=None)

# center spark
draw.ellipse([GEM_CX-5, GEM_CY-5, GEM_CX+5, GEM_CY+5], fill=WHITE)

# ── right gem (smaller, cyan accent) ──────────────────────────────────────
GEM2_CX, GEM2_CY = 1300, H // 2
GEM2_R  = 90

glow_hex(GEM2_CX, GEM2_CY, GEM2_R, CYAN, layers=7, angle_offset=0)
facet_lines(GEM2_CX, GEM2_CY, GEM2_R, CYAN, angle_offset=0)
pts2 = hex_points(GEM2_CX, GEM2_CY, GEM2_R, angle_offset=0)
draw.polygon(pts2, outline=CYAN, fill=None)
draw.ellipse([GEM2_CX-3, GEM2_CY-3, GEM2_CX+3, GEM2_CY+3], fill=WHITE)

# ── waveform between gems (bottom third) ──────────────────────────────────
wave_y = int(H * 0.72)
draw_waveform(W // 2, wave_y,      700, 80,  (*PURPLE, 200), seed=1)
draw_waveform(W // 2, wave_y - 22, 700, 55,  (*CYAN,   150), seed=2)
draw_waveform(W // 2, wave_y + 18, 500, 38,  (*GOLD,    90), seed=3)

# ── soft global blur pass (gives the glow depth) ──────────────────────────
blurred = img.filter(ImageFilter.GaussianBlur(radius=1))
img     = Image.blend(img, blurred, alpha=0.25)
draw    = ImageDraw.Draw(img)          # re-bind draw to merged image

# ── text: title ────────────────────────────────────────────────────────────
try:
    # attempt a system font that's clean and monospaced
    font_big  = ImageFont.truetype("C:/Windows/Fonts/cour.ttf",  72)
    font_sub  = ImageFont.truetype("C:/Windows/Fonts/cour.ttf",  28)
    font_tag  = ImageFont.truetype("C:/Windows/Fonts/cour.ttf",  20)
except Exception:
    font_big  = ImageFont.load_default()
    font_sub  = font_big
    font_tag  = font_big

TX = W // 2
TY = int(H * 0.28)          # upper third

# title shadow
draw.text((TX+3, TY+3), "babbled notes", font=font_big,
          fill=(40, 0, 80), anchor="mm")
# title main
draw.text((TX, TY), "babbled notes", font=font_big,
          fill=WHITE, anchor="mm")

# separator line
line_y = TY + 50
draw.line([(TX - 280, line_y), (TX + 280, line_y)], fill=(*PURPLE, 140), width=1)

# subtitle
draw.text((TX, line_y + 30), "x  hermes agent  x  gemma 4",
          font=font_sub, fill=CYAN, anchor="mm")

# tag line
draw.text((TX, line_y + 64), "sound  -->  agent  -->  music",
          font=font_tag, fill=DIM_WHITE, anchor="mm")

# ── corner labels ──────────────────────────────────────────────────────────
draw.text((48, H - 30), "* NeuralGem", font=font_tag, fill=(*PURPLE, 200))
draw.text((W - 48, H - 30), "32 profiles  /  0 failed",
          font=font_tag, fill=(*CYAN, 200), anchor="ra")

# ── save ───────────────────────────────────────────────────────────────────
img.save(OUT, "PNG")
print(f"Saved  {OUT}  ({W}x{H})")
