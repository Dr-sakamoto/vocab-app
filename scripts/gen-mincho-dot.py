#!/usr/bin/env python3
"""明朝ドット（ビットマップ明朝）フォント生成スクリプト。

到達可能な Zen Old Mincho（Google Fonts / OFL）を小さいグリッドでラスタライズし、
1bit（ドット）化した専用 woff2 を生成する。フレーバーテキスト（lib/tips.ts の
SYSTEM_TIPS / AREA_FLAVOR_TIPS）で使う文字＋ASCII だけを収録するサブセット。

tips を編集して新しい文字を足したら、このスクリプトを再実行して
public/fonts/mincho-dot.woff2 を更新すること。

使い方:
    pip install pillow fonttools brotli
    python3 scripts/gen-mincho-dot.py

出力: public/fonts/mincho-dot.woff2
"""
from __future__ import annotations

import os
import re
import sys
import urllib.request

from PIL import Image, ImageFont, ImageDraw
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIPS_TS = os.path.join(ROOT, "lib", "tips.ts")
OUT_WOFF2 = os.path.join(ROOT, "public", "fonts", "mincho-dot.woff2")
SRC_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/zenoldmincho/ZenOldMincho-Regular.ttf"
SRC_CACHE = os.path.join(os.path.dirname(__file__), ".cache-ZenOldMincho.ttf")

GRID = 16          # ラスタライズ時のem（ドットの縦解像度）
U = 64             # 1ドット = 何フォントユニットか
THRESHOLD = 100    # これより濃い画素をドットとして採用


def load_source_font_path() -> str:
    if os.path.exists(SRC_CACHE) and os.path.getsize(SRC_CACHE) > 100_000:
        return SRC_CACHE
    print(f"downloading source font: {SRC_URL}")
    with urllib.request.urlopen(SRC_URL, timeout=60) as r:
        data = r.read()
    with open(SRC_CACHE, "wb") as f:
        f.write(data)
    return SRC_CACHE


def collect_charset() -> set[str]:
    """lib/tips.ts の文字列リテラルから使用文字を集める + ASCII 印字可能。"""
    with open(TIPS_TS, encoding="utf-8") as f:
        text = f.read()
    chars: set[str] = set()
    for literal in re.findall(r'"((?:[^"\\]|\\.)*)"', text):
        for ch in literal:
            chars.add(ch)
    # 軽微な文言修正で崩れないよう ASCII 印字可能をまとめて収録
    for cp in range(0x20, 0x7F):
        chars.add(chr(cp))
    chars.discard("\n")
    return chars


def row_runs(mask, w: int, y: int):
    """1行ぶんの ON 画素を水平ランに畳んで (x0, x1) を列挙。"""
    x = 0
    while x < w:
        if mask[x, y]:
            start = x
            while x < w and mask[x, y]:
                x += 1
            yield start, x
        else:
            x += 1


def build_glyph(pen_cls, src_font, ascent: int, ch: str):
    """1文字をラスタライズ→ドット矩形の TrueType グリフに変換。advance(px) を返す。"""
    advance_px = max(1, round(src_font.getlength(ch)))
    cell_h = ascent + src_font.getmetrics()[1]
    cell_w = advance_px + 2
    img = Image.new("L", (cell_w, cell_h), 0)
    ImageDraw.Draw(img).text((0, 0), ch, font=src_font, fill=255)
    bw = img.point(lambda p: 1 if p > THRESHOLD else 0)
    mask = bw.load()

    pen = pen_cls()
    for y in range(cell_h):
        for x0, x1 in row_runs(mask, cell_w, y):
            fx0, fx1 = x0 * U, x1 * U
            fy_top = (ascent - y) * U
            fy_bot = (ascent - (y + 1)) * U
            pen.moveTo((fx0, fy_bot))
            pen.lineTo((fx1, fy_bot))
            pen.lineTo((fx1, fy_top))
            pen.lineTo((fx0, fy_top))
            pen.closePath()
    return pen.glyph(), advance_px * U


def main() -> int:
    src_path = load_source_font_path()
    src_font = ImageFont.truetype(src_path, GRID)
    ascent, descent = src_font.getmetrics()

    charset = sorted(collect_charset())
    upm = (ascent + descent) * U

    glyph_order = [".notdef"]
    glyphs = {}
    hmtx = {}
    cmap = {}

    # .notdef（空・半角送り）
    empty = TTGlyphPen()
    glyphs[".notdef"] = empty.glyph()
    hmtx[".notdef"] = (GRID // 2 * U, 0)

    for ch in charset:
        cp = ord(ch)
        name = f"uni{cp:04X}"
        if name in glyphs:
            continue
        glyph, adv = build_glyph(TTGlyphPen, src_font, ascent, ch)
        glyphs[name] = glyph
        hmtx[name] = (adv, 0)
        cmap[cp] = name
        glyph_order.append(name)

    fb = FontBuilder(upm, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(hmtx)
    asc_u, desc_u = ascent * U, descent * U
    fb.setupHorizontalHeader(ascent=asc_u, descent=-desc_u)
    fb.setupNameTable({"familyName": "MinchoDot", "styleName": "Regular"})
    fb.setupOS2(
        sTypoAscender=asc_u, sTypoDescender=-desc_u, sTypoLineGap=0,
        usWinAscent=asc_u, usWinDescent=desc_u,
    )
    fb.setupPost()

    os.makedirs(os.path.dirname(OUT_WOFF2), exist_ok=True)
    fb.font.flavor = "woff2"
    fb.font.save(OUT_WOFF2)
    print(f"glyphs: {len(cmap)}  upm: {upm}")
    print(f"saved: {OUT_WOFF2}  ({os.path.getsize(OUT_WOFF2)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
