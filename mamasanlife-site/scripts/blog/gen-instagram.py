#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# マンガepN-geminiからInstagramカルーセル（表紙+コマ4枚+誘導）を生成する
# 使い方: python3 scripts/blog/gen-instagram.py <ep番号> "<表紙フック文>" [出力先ルート]
#   例: python3 scripts/blog/gen-instagram.py 12 "電気とガス、セットだからお得なはず…確かめたことありますか？"
# 前提: public/manga/ep<N>-gemini/ に panel-1〜4.png と meta.json（captions配列）
# 出力: <出力先ルート>/ep<N>/ 01-cover.png 02〜05-panel.png 06-end.png
import json, sys, os, re
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1080            # 1:1 正方形（切り抜き事故が起きない）
# ブランドカラー統一（2026-07-13）: ブログの tailwind.config と同系統
BG = (234, 242, 242)         # ライトティールの下地（primary-light #8CB9BD の薄め）
TEAL = (61, 107, 110)        # primary #3D6B6E（文字・枠）
ACCENT = (217, 123, 75)      # accent #E8956D を文字用に濃くした色（CTA・話者チップ）
WHITE = (255, 255, 255)
FONT = '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'
FONT_LIGHT = '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'

def font(size, light=False):
    try:
        return ImageFont.truetype(FONT_LIGHT if light else FONT, size)
    except OSError:
        return ImageFont.truetype(FONT, size)

def wrap(text, fnt, max_w, draw):
    lines, line = [], ''
    for ch in text:
        if ch == '\n':
            lines.append(line); line = ''; continue
        if draw.textlength(line + ch, font=fnt) > max_w and line:
            lines.append(line); line = ch
        else:
            line += ch
    if line: lines.append(line)
    return lines

def draw_center(draw, y, text, fnt, fill, max_w=W-160, line_pad=14):
    for ln in wrap(text, fnt, max_w, draw):
        w = draw.textlength(ln, font=fnt)
        draw.text(((W-w)/2, y), ln, font=fnt, fill=fill)
        y += fnt.size + line_pad
    return y

def series_badge(draw, ep):
    label = f'ねこ耳一家の家計マンガ  第{ep}話'
    fnt = font(34)
    tw = draw.textlength(label, font=fnt)
    bw, bh = tw + 72, 66
    x, y = (W-bw)/2, 84
    draw.rounded_rectangle([x, y, x+bw, y+bh], radius=33, fill=TEAL)
    draw.text((x+36, y+(bh-fnt.size)/2-3), label, font=fnt, fill=WHITE)

def cover(ep, hook, panel1, out):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    series_badge(d, ep)
    fnt_hook = font(54)
    n_lines = len(wrap(hook, fnt_hook, W-140, d))
    hook_h = n_lines * (fnt_hook.size + 22)
    p = Image.open(panel1).convert('RGB')
    pw = W - 140
    ph = int(p.height * pw / p.width)
    if ph > 470:
        ph = 470; pw = int(p.width * ph / p.height)
    total = hook_h + 48 + ph
    top, bottom = 185, H - 145
    y0 = top + max(0, (bottom - top - total) // 2)
    y = draw_center(d, y0, hook, fnt_hook, TEAL, max_w=W-140, line_pad=22)
    p = p.resize((pw, ph), Image.LANCZOS)
    px, py = (W-pw)//2, y + 48
    d.rounded_rectangle([px-6, py-6, px+pw+6, py+ph+6], radius=18, outline=TEAL, width=4)
    img.paste(p, (px, py))
    fnt = font(40)
    tail = 'スワイプして4コマへ →'
    tw = d.textlength(tail, font=fnt)
    d.text(((W-tw)/2, H-108), tail, font=fnt, fill=ACCENT)
    img.save(out, quality=92)

def panel_slide(ep, idx, panel_path, caption, out):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    # ページ表示
    fnt_no = font(34)
    label = f'{idx} / 4'
    d.text((W-140, 70), label, font=fnt_no, fill=TEAL)
    d.text((60, 70), f'第{ep}話', font=fnt_no, fill=TEAL)
    # コマ画像
    p = Image.open(panel_path).convert('RGB')
    pw = W - 90
    ph = int(p.height * pw / p.width)
    if ph > 560:
        ph = 560; pw = int(p.width * ph / p.height)
    fnt_pre = font(44)
    m_pre = re.match(r'^(.+?)「(.+)」$', caption)
    pre_line = m_pre.group(2) if m_pre else caption
    pre_box_h = 70 + len(wrap(pre_line, fnt_pre, W-260, d)) * (fnt_pre.size + 16)
    total = ph + 56 + pre_box_h
    top, bottom = 140, H - 60
    py = top + max(0, (bottom - top - total) // 2)
    px = (W-pw)//2
    d.rounded_rectangle([px-6, py-6, px+pw+6, py+ph+6], radius=14, outline=TEAL, width=4)
    img.paste(p.resize((pw, ph), Image.LANCZOS), (px, py))
    # セリフボックス
    m = re.match(r'^(.+?)「(.+)」$', caption)
    speaker, line = (m.group(1), m.group(2)) if m else (None, caption)
    fnt_line = font(44)
    box_top = py + ph + 56
    lines = wrap(line, fnt_line, W-260, d)
    box_h = 70 + len(lines) * (fnt_line.size + 16)
    d.rounded_rectangle([70, box_top, W-70, box_top+box_h], radius=26, fill=WHITE, outline=TEAL, width=4)
    ty = box_top + 36
    for ln in lines:
        tw = d.textlength(ln, font=fnt_line)
        d.text(((W-tw)/2, ty), ln, font=fnt_line, fill=TEAL)
        ty += fnt_line.size + 16
    if speaker:
        fnt_sp = font(32)
        sw = d.textlength(speaker, font=fnt_sp)
        sx = 110
        d.rounded_rectangle([sx-18, box_top-26, sx+sw+18, box_top+22], radius=22, fill=ACCENT)
        d.text((sx, box_top-20), speaker, font=fnt_sp, fill=WHITE)
    img.save(out, quality=92)

def end_slide(ep, title, out):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    series_badge(d, ep)
    y = draw_center(d, 300, 'つづきはブログで', font(64), TEAL)
    y = draw_center(d, y+30, '実際の金額・手順の全文はブログで', font(40, light=True), TEAL)
    y = draw_center(d, y+6, '『ママさんライフ 家計』で検索', font(40), ACCENT)
    # 記事タイトルカード
    fnt_t = font(42)
    lines = wrap(title, fnt_t, W-300, d)
    card_h = 90 + len(lines)*(fnt_t.size+16)
    d.rounded_rectangle([90, y+60, W-90, y+60+card_h], radius=26, fill=WHITE, outline=TEAL, width=4)
    ty = y + 60 + 45
    for ln in lines:
        tw = d.textlength(ln, font=fnt_t)
        d.text(((W-tw)/2, ty), ln, font=fnt_t, fill=TEAL)
        ty += fnt_t.size + 16
    draw_center(d, H-150, 'Mamasan Life（ママさんライフ）', font(36), TEAL)
    img.save(out, quality=92)

if __name__ == '__main__':
    ep = sys.argv[1]
    hook = sys.argv[2]
    root = sys.argv[3] if len(sys.argv) > 3 else os.path.expanduser('~/claude/instagram')
    src = f'public/manga/ep{ep}-gemini'
    meta = json.load(open(f'{src}/meta.json'))
    title = meta.get('title', '').split(' ', 1)[-1]
    outdir = os.path.join(root, f'ep{ep}')
    os.makedirs(outdir, exist_ok=True)
    cover(ep, hook, f'{src}/panel-1.png', f'{outdir}/01-cover.png')
    for i in range(1, 5):
        panel_slide(ep, i, f'{src}/panel-{i}.png', meta['captions'][i-1], f'{outdir}/{i+1:02d}-panel{i}.png')
    end_slide(ep, meta.get('title', ''), f'{outdir}/06-end.png')
    print('生成完了:', outdir)
