#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 縦長のマンガ1枚画像を、コマ間の白い帯（ガター）で自動分割する
# 使い方: python3 scripts/blog/split-manga.py <strip.png> [出力ディレクトリ]
import sys, os
from PIL import Image

src = sys.argv[1]
outdir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(src)
im = Image.open(src).convert('L')
w, h = im.size
px = im.load()
rows = [min(px[x, y] for x in range(0, w, 4)) > 230 for y in range(h)]
panels = []
in_p = False
for y, white in enumerate(rows):
    if not white and not in_p:
        start = y; in_p = True
    elif white and in_p:
        if y - start > 100:
            panels.append((start, y))
        in_p = False
if in_p:
    panels.append((start, h))
print(f'検出コマ数: {len(panels)}')
if len(panels) < 2:
    print('分割できませんでした（ガターが検出できない画像です）'); sys.exit(1)
color = Image.open(src)
for i, (y0, y1) in enumerate(panels, 1):
    color.crop((0, max(0, y0 - 6), w, min(h, y1 + 6))).save(os.path.join(outdir, f'panel-{i}.png'))
    print(f'panel-{i}.png')
