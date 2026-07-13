#!/usr/bin/env python3
# ショート動画生成（インスタリール / YouTubeショート用・9:16・60秒以内）
# 素材: 録音のハイライト区間 + インスタ用カルーセル画像（~/claude/instagram/epN/）
# 使い方:
#   python3 gen-short.py --audio <m4a> --start 12 --dur 45 --ep 25 --hook "フック文" [--title "第25話 …"]
# 出力: ~/claude/shorts/epN/short.mp4, caption-instagram.txt, caption-youtube.txt
import sys, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

args = {}
argv = sys.argv[1:]
i = 0
while i < len(argv):
    args[argv[i]] = argv[i + 1] if i + 1 < len(argv) else ''
    i += 2

AUDIO = os.path.expanduser(args['--audio'])
START = float(args.get('--start', 0))
DUR = min(59.0, float(args.get('--dur', 45)))
EP = args['--ep'].replace('ep', '')
HOOK = args.get('--hook', '')
TITLE = args.get('--title', f'マンガ第{EP}話')
IG_DIR = os.path.expanduser(f'~/claude/instagram/ep{EP}')
OUT_DIR = os.path.expanduser(args.get('--out', f'~/claude/shorts/ep{EP}'))
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1080, 1920
CREAM, NAVY, CORAL = (251, 247, 238), (27, 42, 74), (214, 122, 90)
FONT = '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'
FONT_L = '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'

def font(size, light=False):
    return ImageFont.truetype(FONT_L if light else FONT, size)

def wrap(d, text, f, maxw):
    lines, line = [], ''
    for ch in text:
        if d.textlength(line + ch, font=f) > maxw or ch == '\n':
            lines.append(line); line = '' if ch == '\n' else ch
        else:
            line += ch
    if line: lines.append(line)
    return lines

def slide(img_path, header, footer, big_footer=False):
    im = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(im)
    if img_path and os.path.exists(img_path):
        p = Image.open(img_path).convert('RGB').resize((1020, 1020))
        im.paste(p, (30, 420))
    # ヘッダー
    y = 130
    for ln in wrap(d, header, font(64), W - 120)[:3]:
        w = d.textlength(ln, font=font(64))
        d.text(((W - w) // 2, y), ln, font=font(64), fill=NAVY)
        y += 84
    # フッター帯
    fh = 260 if big_footer else 200
    d.rounded_rectangle([40, H - fh - 60, W - 40, H - 60], radius=30, fill=NAVY)
    fsize = 54 if big_footer else 44
    lines = wrap(d, footer, font(fsize), W - 160)[:3]
    fy = H - fh - 60 + (fh - len(lines) * (fsize + 18)) // 2
    for ln in lines:
        w = d.textlength(ln, font=font(fsize))
        d.text(((W - w) // 2, fy), ln, font=font(fsize), fill=(255, 255, 255))
        fy += fsize + 18
    return im

tmp = tempfile.mkdtemp()
FOOT = 'つづきはブログで ▶「ママさんライフ 家計」で検索'
slides = []
covers = sorted(f for f in os.listdir(IG_DIR) if f.endswith('.png'))
cover = next((f for f in covers if 'cover' in f), None)
panels = [f for f in covers if 'panel' in f][:4]
end = next((f for f in covers if 'end' in f), None)

slides.append((slide(os.path.join(IG_DIR, cover) if cover else None, HOOK or TITLE, '音声つきマンガ 🎧'), 3.0))
panel_dur = max(2.0, (DUR - 3.0 - 4.0) / max(1, len(panels)))
for p in panels:
    slides.append((slide(os.path.join(IG_DIR, p), HOOK or TITLE, FOOT), panel_dur))
slides.append((slide(os.path.join(IG_DIR, end) if end else None, 'ここから先はブログで♪', FOOT, big_footer=True), 4.0))

concat = os.path.join(tmp, 'slides.txt')
with open(concat, 'w') as f:
    for idx, (im, dur) in enumerate(slides):
        p = os.path.join(tmp, f's{idx}.png')
        im.save(p)
        f.write(f"file '{p}'\nduration {dur:.2f}\n")
    f.write(f"file '{p}'\n")  # concat仕様: 最後のフレームを再掲

clip = os.path.join(tmp, 'clip.m4a')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(START), '-t', str(DUR), '-i', AUDIO,
                '-af', f'afade=t=in:d=0.5,afade=t=out:st={DUR-1.2}:d=1.2', '-c:a', 'aac', '-b:a', '128k', clip], check=True)

out_mp4 = os.path.join(OUT_DIR, 'short.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concat, '-i', clip,
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-r', '30', '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', '-shortest', out_mp4], check=True)

with open(os.path.join(OUT_DIR, 'caption-instagram.txt'), 'w') as f:
    f.write(f"""{HOOK or TITLE}🎧

マンガの続きと、実際の金額・手順はブログにまとめています。
🔍「ママさんライフ 家計」で検索してね♪

#ママさんライフ #家計管理 #節約 #固定費削減 #ワーママ #4コマ漫画 #ポッドキャスト""")
with open(os.path.join(OUT_DIR, 'caption-youtube.txt'), 'w') as f:
    f.write(f"""{HOOK or TITLE}【音声つきマンガ】

続きはブログ「ママさんライフ」で👇
https://mamasanmoney-bu.com/feature/manga-episode-list
🎧 ポッドキャスト: https://mamasanmoney-bu.com/podcast

#Shorts #家計管理 #節約 #ワーママ""")

print(f'完成: {out_mp4}')
print(f'キャプション: {OUT_DIR}/caption-instagram.txt, caption-youtube.txt')
