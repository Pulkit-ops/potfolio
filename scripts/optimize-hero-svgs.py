#!/usr/bin/env python3
"""Shrink the hero SVG plates and derive static (no-WebGL) variants.

Each hero SVG embeds the full Anton TTF as base64 (~175 KB) just to render
"SOCIAL MANAGER". This subsets the embedded font to the glyphs actually used,
then writes `*-static.svg` twins whose text fill reproduces the WebGL ripple
shader's resting "liquid ruby" gradient, so the no-WebGL hero is visually
identical to the WebGL hero at rest.

Idempotent: re-running on already-subset files is a no-op size-wise.
Requires fontTools (pip install fonttools).
"""
import base64, io, re, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"
PLATES = ["hero-text", "hero-text-tablet", "hero-text-mobile",
          "hero-text-borders", "hero-text-borders-tablet", "hero-text-borders-mobile"]
FONT_RE = re.compile(r"(url\(data:font/truetype;charset=utf-8;base64,)([A-Za-z0-9+/=]+)(\))")

# Resting colour of the composite shader (tex mixed 60% with the liquid gradient),
# sampled at liquidY = 1 / 0.5 / 0, which maps to SVG y = 69.5 / 371 / 673.
GRADIENT = """
    <linearGradient id="liquid-rest" gradientUnits="userSpaceOnUse" x1="0" y1="69.5" x2="0" y2="673">
      <stop offset="0" stop-color="#f53036"/>
      <stop offset="0.5" stop-color="#d81d24"/>
      <stop offset="1" stop-color="#c4131a"/>
    </linearGradient>"""


def subset_font(b64: str, text: str) -> str:
    font = TTFont(io.BytesIO(base64.b64decode(b64)))
    opts = subset.Options()
    opts.layout_features = ["kern", "liga"]
    opts.name_IDs = []
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    out = io.BytesIO()
    font.save(out)
    return base64.b64encode(out.getvalue()).decode()


for name in PLATES:
    path = ROOT / f"{name}.svg"
    svg = path.read_text()
    before = len(svg)
    text = "".join(re.findall(r"<text[^>]*>([^<]*)</text>", svg)) + " "
    svg = FONT_RE.sub(lambda m: m.group(1) + subset_font(m.group(2), text) + m.group(3), svg)
    path.write_text(svg)
    print(f"{name}.svg: {before // 1024} KB -> {len(svg) // 1024} KB")

    if "borders" not in name:
        static = svg.replace("<defs>", "<defs>" + GRADIENT, 1)
        static = static.replace("fill: #e51d24;", "fill: url(#liquid-rest);")
        static = static.replace('fill="#e51d24"', 'fill="url(#liquid-rest)"')
        (ROOT / f"{name}-static.svg").write_text(static)
