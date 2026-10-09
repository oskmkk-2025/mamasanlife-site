#!/usr/bin/env python3
# ビデオポッドキャスト生成（ラジオスタジオ絵の口パク＋まばたき合成・16:9・YouTube用)
# 舞台絵: ~/claude/assets/radio-studio.png（2752×1536）から口3態×目2態=6フレームを自動生成し、
# 音声の音量解析で口パクを割り付けて mp4 を作る。完全ローカル・依存は PIL と ffmpeg のみ。
# 使い方:
#   python3 gen-video-podcast.py --audio <m4a> --out ~/claude/video-podcast/ep1 [--dur 30]
#   --dur を付けるとテスト用に冒頭N秒だけ生成
#   --mute-head/--mute-tail: OP/EDジングル区間は口を閉じる（既定 6.5秒/9.0秒＝アプリのOP7秒・ED8秒構成に合わせた値。
#   ジングルなし音源なら 0 を渡す。--start 指定時はどちらも既定0）
# 縦型ショート（同じキャラが口パクで話すハイライト切り出し・9:16）:
#   python3 gen-video-podcast.py --audio <m4a> --out ~/claude/shorts/podcast-ep1 \
#     --start 17.0 --dur 30.4 --vertical 1 --ep 1 --title "40代、仕事を1ヶ月で辞めました" --segments <file>
#   --segments: 1行 = "クリップ内秒数<TAB>字幕テキスト"（次の行の秒数まで表示）
# 出力: <out>/video.mp4（横=1920×1080 / 縦=1080×1920・30fps）
import sys, os, subprocess, tempfile, wave, math, random, array
from collections import deque

from PIL import Image, ImageDraw, ImageFilter

args = {}
argv = sys.argv[1:]
i = 0
while i < len(argv):
    args[argv[i]] = argv[i + 1] if i + 1 < len(argv) else ''
    i += 2

AUDIO = os.path.expanduser(args['--audio'])
OUT_DIR = os.path.expanduser(args['--out'])
DUR_LIMIT = float(args['--dur']) if '--dur' in args else None
START = float(args.get('--start', 0))
VERTICAL = args.get('--vertical', '') not in ('', '0')
SEG_FILE = os.path.expanduser(args['--segments']) if '--segments' in args else None
TITLE = args.get('--title', '')
EP = args.get('--ep', '').replace('ep', '')
MUTE_HEAD = float(args.get('--mute-head', 6.5 if START == 0 else 0))
MUTE_TAIL = float(args.get('--mute-tail', 9.0 if START == 0 else 0))
MASTER = os.path.expanduser(args.get('--master', '~/claude/assets/radio-studio.png'))
FRAMES_DIR = os.path.expanduser(args.get('--frames', '~/claude/assets/radio-studio-frames'))
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)

VW, VH = 1920, 1080
STEP = 1 / 15        # 口パク更新間隔（15コマ/秒=30fpsのちょうど2フレーム・機敏め）
FPS = 30
SS = 4               # パーツ描画のスーパーサンプリング倍率

# ---- 顔パーツ座標（radio-studio.png 原寸 2752×1536 基準・手動計測 2026-07）----
SKIN = (251, 225, 199)
LINE = (10, 8, 6)
MOUTH_DARK = (122, 42, 44)     # 開いた口の中（サムネに合わせた赤茶色）
TONGUE = (238, 136, 138)       # 舌（サムネのピンク）
MOUTH_BOX = (1283, 822, 1478, 934)   # 元のスマイルを消す範囲（口角の上がった両端まで含む）
MOUTH_C = (1372, 862)                # 開き口の上唇ライン（元スマイルの弧の高さに合わせる）
NOSE_BOX = (1350, 776, 1402, 806)    # 元の鼻（ㅅ型）を消す範囲
NOSE_C, NOSE_R = (1376, 792), 7      # サムネのような点の鼻（2026-10-06 本人）
OMEGA_PNG = os.path.expanduser('~/claude/assets/mouth-omega.png')   # 閉じた口（第1回サムネの絵から切り出し）
OMEGA_SCALE = 0.88                   # サムネの目の間隔258px→動画227px
OMEGA_Y = 866                        # 閉じた口の中心の高さ
EYE_L, EYE_R = (1263, 727), (1490, 725)
EYE_BOX_W, EYE_BOX_H = 64, 84        # 目を消す範囲（中心基準）
BODY_BOX = (930, 120, 1845, 1360)    # 体レイヤーの探索範囲（頭・ヘッドフォン全体を含む。机・ON AIR・天井線は外）
LINE_SUM = 45                        # RGB合計がこれ未満なら輪郭線とみなす（前景の線は真っ黒・背景のぼけた線は薄いので区別できる）
MIC_SEEDS = [(1670, 1030), (1795, 1175), (1775, 1115), (1820, 1230)]   # マイク各パーツ内部（原寸座標）
BG_SEEDS = [(1800, 1345), (1830, 900)]   # 体とマイクに囲まれた壁ポケット（原寸座標）
# 体の揺れ: ffmpegの式で毎フレーム評価＝完全に滑らか。平行移動＋ごく僅かな回転、周期は互いに素で自然なドリフト
SWAY_X = '2.2*sin(2*PI*t/9.3)+0.9*sin(2*PI*t/5.1+0.7)'
SWAY_Y = '3.2*sin(2*PI*t/6.4)+1.1*sin(2*PI*t/13.7+2.1)'
SWAY_R = '0.007*sin(2*PI*t/11.3)+0.004*sin(2*PI*t/6.9+1.3)'   # ラジアン（±0.4°程度）

def patch_draw(im, box, fn):
    """box領域をSS倍で描画してアンチエイリアス貼り戻し"""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    p = im.crop(box).resize((w * SS, h * SS), Image.LANCZOS)
    d = ImageDraw.Draw(p)
    fn(d, lambda x, y: ((x - x0) * SS, (y - y0) * SS), SS)
    im.paste(p.resize((w, h), Image.LANCZOS), (x0, y0))

def erase(im, box):
    ImageDraw.Draw(im).rectangle(box, fill=SKIN)

def _mouth_chord(im, half_w, depth):
    """スマイルがそのまま開いたような半月型の口（上辺フラット・下は丸い弧）。
    中は赤茶色＋下にピンクの舌（2026-10-06 本人「黒いベタ塗りでなく、サムネのように舌が見える口に」）"""
    erase(im, MOUTH_BOX)
    cx, cy = MOUTH_C
    x0, y0, x1, y1 = MOUTH_BOX
    w, h = x1 - x0, y1 - y0
    p = im.crop(MOUTH_BOX).resize((w * SS, h * SS), Image.LANCZOS)
    m = lambda x, y: ((x - x0) * SS, (y - y0) * SS)
    bb = [*m(cx - half_w, cy - depth), *m(cx + half_w, cy + depth)]
    # 口の形のマスクの中だけに、中の色と舌を描く
    shape = Image.new('L', p.size, 0)
    ImageDraw.Draw(shape).chord(bb, start=0, end=180, fill=255)
    inner = Image.new('RGB', p.size, MOUTH_DARK)
    tw, th = half_w * 0.78, depth * 0.95
    ImageDraw.Draw(inner).ellipse([*m(cx - tw, cy + depth - th * 0.62), *m(cx + tw, cy + depth + th * 0.9)], fill=TONGUE)
    p.paste(inner, (0, 0), shape)
    ImageDraw.Draw(p).chord(bb, start=0, end=180, outline=LINE, width=11 * SS)
    im.paste(p.resize((w, h), Image.LANCZOS), (x0, y0))

def nose_dot(im):
    erase(im, NOSE_BOX)
    cx, cy = NOSE_C
    def f(d, m, s):
        d.ellipse([*m(cx - NOSE_R, cy - NOSE_R), *m(cx + NOSE_R, cy + NOSE_R)], fill=LINE)
    patch_draw(im, NOSE_BOX, f)

def mouth_closed(im):
    """閉じた口：サムネ（第1回のGemini絵）から切り出した「ω」の猫口をそのまま貼る
    （2026-10-06 本人「サムネから切り出して」。手描きの弧2つでは真ん中がつながらなかった）"""
    erase(im, MOUTH_BOX)
    om = Image.open(OMEGA_PNG).convert('RGBA')
    w, h = round(om.width * OMEGA_SCALE), round(om.height * OMEGA_SCALE)
    om = om.resize((w, h), Image.LANCZOS)
    im.paste(om, (round(MOUTH_C[0] - w / 2), round(OMEGA_Y - h / 2)), om)

def mouth_half(im):
    _mouth_chord(im, half_w=54, depth=30)

def mouth_open(im):
    _mouth_chord(im, half_w=68, depth=56)

def eyes_closed(im):
    for (ex, ey) in (EYE_L, EYE_R):
        box = (ex - EYE_BOX_W // 2, ey - EYE_BOX_H // 2, ex + EYE_BOX_W // 2, ey + EYE_BOX_H // 2)
        erase(im, box)
        def f(d, m, s, ex=ex, ey=ey):
            bb = [*m(ex - 26, ey - 26), *m(ex + 26, ey + 14)]
            d.arc(bb, start=25, end=155, fill=LINE, width=11 * s)
        patch_draw(im, box, f)

def _flood(W, H, dark, blocked, seeds):
    """dark(輪郭線)とblockedを壁にした塗りつぶし探索。到達域のbytearrayを返す"""
    visited = bytearray(W * H)
    dq = deque()
    for i in seeds:
        if not dark[i] and not blocked[i] and not visited[i]:
            visited[i] = 1; dq.append(i)
    while dq:
        i = dq.popleft()
        x, y = i % W, i // W
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < W and 0 <= ny < H:
                j = ny * W + nx
                if not visited[j] and not dark[j] and not blocked[j]:
                    visited[j] = 1; dq.append(j)
    return visited

def silhouette(crop):
    """人物シルエットとマイク(静止前景)を抽出。
    背景flood: 輪郭線(暗色)を壁に、上辺・左辺全部＋右辺の彩度がある画素(壁は色つき・マイクは無彩色)＋壁ポケットの種。
    マイクflood: 各パーツ内部の種から。右端近くの無彩色の取り残しも静止グループへ。"""
    W, H = crop.size
    x0, y0 = BODY_BOX[0], BODY_BOX[1]
    data = list(crop.getdata())
    dark = bytearray((r + g + b) < LINE_SUM for (r, g, b) in data)
    none = bytearray(W * H)
    seeds = [x for x in range(W)] + [y * W for y in range(H)]
    for y in range(H):                      # 右辺: 彩度がある画素だけ（背景の壁・サイン）
        r, g, b = data[y * W + W - 1]
        if max(r, g, b) - min(r, g, b) > 25:
            seeds.append(y * W + W - 1)
    seeds += [(sy - y0) * W + (sx - x0) for sx, sy in BG_SEEDS]
    bg = _flood(W, H, dark, none, seeds)
    mic_seeds = [(sy - y0) * W + (sx - x0) for sx, sy in MIC_SEEDS]
    # 右端25px内の未到達・非輪郭・非背景の画素（マイクアームの切れ端など）も静止グループに
    for y in range(H):
        for x in range(W - 25, W):
            i = y * W + x
            if not bg[i] and not dark[i]:
                mic_seeds.append(i)
    mic = _flood(W, H, dark, bg, mic_seeds)
    char = Image.new('L', (W, H), 0)
    char.putdata([255 if (not v and not m) else 0 for v, m in zip(bg, mic)])
    mic_im = Image.new('L', (W, H), 0)
    mic_im.putdata([255 if m else 0 for m in mic])
    # マイクの輪郭線ごと静止レイヤーに移す（人物マスクからは同じ分を除く）
    mic_im = mic_im.filter(ImageFilter.MaxFilter(15))
    char = Image.composite(Image.new('L', (W, H), 0), char, mic_im)
    return char, mic_im

def edge_fade(mask):
    """枠の下端で体が切れる部分をなだらかに固定（せん断防止・胴の裾がアンカーになる）"""
    W, H = mask.size
    px = mask.load()
    for x in range(W):
        for k in range(64):
            y = H - 1 - k
            px[x, y] = min(px[x, y], int(255 * (k / 64)))
    for y in range(H):                     # 右端18px: マイクアーム切れ端の静止化（体はここまで届かない）
        for k in range(18):
            x = W - 1 - k
            px[x, y] = min(px[x, y], int(255 * (k / 18)))
    return mask

def build_plate(crop, mask):
    """人物を抜いた背景プレート: 穴を周囲の色の拡散で埋める（動いた時に見えるのは縁の数pxだけ）"""
    hole = mask.filter(ImageFilter.MaxFilter(15))
    # 下端のアンカー帯（edge_fadeと同じ64px）は人物を消さず元の絵を残す:
    # 動くレイヤーがフェードで薄くなる所には「静止した同じ服」が透ける＝色が一致して継ぎ目が見えない
    ImageDraw.Draw(hole).rectangle([0, hole.size[1] - 64, hole.size[0], hole.size[1]], fill=0)
    plate = crop.copy()
    for _ in range(20):
        blurred = plate.filter(ImageFilter.GaussianBlur(9))
        plate = Image.composite(blurred, plate, hole)
    return plate

def build_frames():
    """無人の背景プレート＋人物シルエット切り抜き（口3態×目2態）＋静止マイク前景を原寸で生成・キャッシュ"""
    names = [f'm{mi}e{ei}' for mi in range(3) for ei in range(2)]
    crops = {n: os.path.join(FRAMES_DIR, 'chr-' + n + '.png') for n in names}
    base_p = os.path.join(FRAMES_DIR, 'plate.png')
    mask_p = os.path.join(FRAMES_DIR, 'mask.png')
    mic_p = os.path.join(FRAMES_DIR, 'mic.png')
    if all(os.path.exists(p) for p in [base_p, mask_p, mic_p, *crops.values()]):
        return base_p, mask_p, mic_p, crops
    base = Image.open(MASTER).convert('RGB')
    crop = base.crop(BODY_BOX)
    raw, mic_mask = silhouette(crop)
    plate_img = build_plate(crop, raw)
    plate = base.copy()
    plate.paste(plate_img, (BODY_BOX[0], BODY_BOX[1]))
    plate.save(base_p)
    mask = raw.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.5))
    edge_fade(mask).save(mask_p)
    mic = crop.convert('RGBA')
    mic.putalpha(mic_mask.filter(ImageFilter.GaussianBlur(1.2)))
    mic.save(mic_p)
    for mi, mfn in enumerate([mouth_closed, mouth_half, mouth_open]):
        for ei, efn in enumerate([None, eyes_closed]):
            im = base.copy()
            nose_dot(im)
            if mfn: mfn(im)
            if efn: efn(im)
            im.crop(BODY_BOX).save(crops[f'm{mi}e{ei}'])
    return base_p, mask_p, mic_p, crops

# ---- 音量解析 → 口パク割り付け ----
def analyze(audio, dur_limit):
    tmp = tempfile.mkdtemp()
    wav = os.path.join(tmp, 'a.wav')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(START), '-i', audio]
    if dur_limit: cmd += ['-t', str(dur_limit)]
    cmd += ['-ac', '1', '-ar', '8000', '-c:a', 'pcm_s16le', wav]
    subprocess.run(cmd, check=True)
    w = wave.open(wav)
    data = array.array('h', w.readframes(w.getnframes()))
    sr = w.getframerate()
    n = int(sr * STEP)
    rms = []
    for s in range(0, len(data) - n, n):
        seg = data[s:s + n]
        rms.append(math.sqrt(sum(x * x for x in seg) / n))
    lo = sorted(rms)[int(len(rms) * 0.10)]   # ノイズ床（BGMベッド込み）
    hi = sorted(rms)[int(len(rms) * 0.95)]
    span = max(1.0, hi - lo)
    # エンベロープ追従: 立ち上がりは即・閉じは軽く余韻（音節の切れ目でパタパタしすぎない）
    env, e = [], 0.0
    for r in rms:
        e = r if r > e else e * 0.42 + r * 0.58
        env.append(e)
    mouths = []
    for e in env:
        v = (e - lo) / span
        mouths.append(0 if v < 0.15 else (1 if v < 0.50 else 2))
    # 1コマだけの孤立変化を均す（チラつき防止）
    for k in range(1, len(mouths) - 1):
        if mouths[k - 1] == mouths[k + 1] != mouths[k]:
            mouths[k] = mouths[k - 1]
    # OP/EDジングル区間は声がないので口を閉じる
    head = int(MUTE_HEAD / STEP)
    mouths[:head] = [0] * min(head, len(mouths))
    if MUTE_TAIL > 0 and DUR_LIMIT is None:
        tail = int(MUTE_TAIL / STEP)
        mouths[-tail:] = [0] * min(tail, len(mouths))
    return mouths

def blink_track(steps):
    rnd = random.Random(42)
    eyes = [0] * steps
    t = rnd.uniform(1.5, 4.0)
    while t < steps * STEP:
        k = int(t / STEP)
        for j in (k, k + 1):
            if j < steps: eyes[j] = 1
        t += rnd.uniform(2.5, 5.5)
    return eyes

# （2026-10-09 本人「アピールが弱い・画面にドンと・いったん話を止めて」）見出しのところで声を止めて間をつくり、
#   その間に画面いっぱいの見出しカード＋効果音（効果音ラボ「和太鼓でドドン」・本人がダウンロード（最初はきらきら輝く3→本人が和太鼓に変更））を入れる
#   --chapters: 1行 = "元の音声の秒数<TAB>見出し"（その見出しの話が始まる時刻）。動画はカード1枚ごとに GAP 秒のびる
CHAPTER_FILE = os.path.expanduser(args['--chapters']) if '--chapters' in args else None
CHAPTER_SE = os.path.expanduser(args.get('--se', '~/claude/assets/chapter-se-taiko-dodon.mp3'))
GAP = float(args.get('--gap', 2.0))   # 2026-10-09 本人「2秒に短くする」
chaps = []   # (動画内の秒数, 見出し)
if CHAPTER_FILE and not VERTICAL and START == 0:
    raw = []
    with open(CHAPTER_FILE) as cf:
        for ln in cf:
            ln = ln.rstrip('\n')
            if ln.strip() and not ln.startswith('#'):
                ts, text = ln.split('\t', 1)
                raw.append((float(ts), text))
    raw.sort()
    gap_audio = os.path.join(tempfile.mkdtemp(), 'with-gaps.m4a')
    AF = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo'
    fcA, parts, bounds = '', [], [0.0] + [t for t, _ in raw]
    for k in range(len(bounds)):
        end = f':end={bounds[k + 1]:.3f}' if k + 1 < len(bounds) else ''
        fcA += f'[0:a]atrim=start={bounds[k]:.3f}{end},asetpts=PTS-STARTPTS,{AF}[s{k}];'
        if k + 1 < len(bounds):
            fcA += f'[1:a]{AF},atrim=0:{GAP:.2f},apad=whole_dur={GAP:.2f},asetpts=PTS-STARTPTS[g{k}];'
            parts += [f'[s{k}]', f'[g{k}]']
        else:
            parts.append(f'[s{k}]')
    fcA += f"{''.join(parts)}concat=n={len(parts)}:v=0:a=1[a]"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', AUDIO, '-i', CHAPTER_SE,
                    '-filter_complex', fcA, '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', gap_audio], check=True)
    AUDIO = gap_audio
    chaps = [(t + k * GAP, text) for k, (t, text) in enumerate(raw)]

base_p, mask_p, mic_p, crops = build_frames()
mouths = analyze(AUDIO, DUR_LIMIT)
for t, _ in chaps:   # カードのあいだは効果音だけなので口を閉じる
    a, b = int(t / STEP), int((t + GAP) / STEP) + 1
    mouths[a:b] = [0] * len(mouths[a:b])
eyes = blink_track(len(mouths))

tmp = tempfile.mkdtemp()
concat = os.path.join(tmp, 'seq.txt')
with open(concat, 'w') as f:
    prev, dur = None, 0.0
    def flush():
        if prev is not None:
            f.write(f"file '{crops[prev]}'\nduration {dur:.3f}\n")
    for mi, ei in zip(mouths, eyes):
        cur = f'm{mi}e{ei}'
        if cur == prev:
            dur += STEP
        else:
            flush()
            prev, dur = cur, STEP
    flush()
    f.write(f"file '{crops[prev]}'\n")

# ---- 縦型ショート用の字幕オーバーレイPNG ----
FONT = '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'
def _font(size):
    from PIL import ImageFont
    return ImageFont.truetype(FONT, size)

def _wrap(d, text, f, maxw):
    lines, line = [], ''
    for ch in text:
        if d.textlength(line + ch, font=f) > maxw or ch == '\n':
            lines.append(line); line = '' if ch == '\n' else ch
        else:
            line += ch
    if line: lines.append(line)
    return lines

def make_static_overlay(path):
    """ヘッダー（番組チップ＋タイトル）とフッターCTA帯"""
    W, H = 1080, 1920
    TEAL, BGC = (61, 107, 110, 255), (234, 242, 242, 235)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = 70
    if EP:
        label = f'ママさんライフラジオ 第{EP}回'
        f = _font(42); tw = d.textlength(label, font=f)
        d.rounded_rectangle([(W - tw) // 2 - 44, y, (W + tw) // 2 + 44, y + 96], radius=48, fill=TEAL)
        d.text(((W - tw) // 2, y + 24), label, font=f, fill=(255, 255, 255, 255))
        y += 128
    if TITLE:
        f = _font(56)
        lines = _wrap(d, TITLE, f, W - 200)[:2]
        ph = len(lines) * 76 + 40
        d.rounded_rectangle([60, y, W - 60, y + ph], radius=28, fill=BGC)
        ty = y + 22
        for ln in lines:
            tw = d.textlength(ln, font=f)
            d.text(((W - tw) // 2, ty), ln, font=f, fill=(61, 107, 110, 255))
            ty += 76
    foot = 'フル版はYouTube本編・Spotifyで配信中'
    f = _font(42)
    d.rounded_rectangle([50, H - 160, W - 50, H - 40], radius=30, fill=TEAL)
    tw = d.textlength(foot, font=f)
    d.text(((W - tw) // 2, H - 128), foot, font=f, fill=(255, 255, 255, 255))
    im.save(path)

def make_seg_overlay(path, text):
    """話に合わせて切り替わる字幕（動画の下・ブランド色帯の空白に表示。帯が明るいのでパネル無しの濃ティール文字）"""
    W, H = 1080, 1920
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = _font(54)
    lines = _wrap(d, text, f, W - 160)[:3]
    zone_mid = 1615                       # 動画下端(≈1475)とフッター帯(1760)の間の中心
    ty = zone_mid - (len(lines) * 74) // 2
    for ln in lines:
        tw = d.textlength(ln, font=f)
        d.text(((W - tw) // 2, ty), ln, font=f, fill=(61, 107, 110, 255))
        ty += 74
    im.save(path)

def make_chapter_card(dim_path, card_path, text):
    """見出しカード：画面全体を少し暗くする幕＋真ん中に大きく出すティールのカード（白い太字）"""
    if not os.path.exists(dim_path):
        Image.new('RGBA', (VW, VH), (20, 30, 32, 120)).save(dim_path)
    f = _font(96)
    tmpd = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    maxw = VW - 240
    if '｜' in text:                      # 見出しファイルで「｜」を入れた所で改行
        lines = text.split('｜')[:2]
    elif tmpd.textlength(text, font=f) > maxw and '、' in text:   # 長いときは真ん中に近い「、」で改行
        cuts = [i + 1 for i, c in enumerate(text) if c == '、']
        c = min(cuts, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:c], text[c:]]
    else:
        lines = _wrap(tmpd, text, f, maxw)[:2]
    lh = 128
    tw = max(tmpd.textlength(ln, font=f) for ln in lines)
    cw, ch = int(tw + 200), len(lines) * lh + 150
    im = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=48, fill=(61, 107, 110, 250), outline=(255, 255, 255, 255), width=8)
    fs = _font(46)
    lab = 'つぎのお話'
    lw = d.textlength(lab, font=fs)
    d.rounded_rectangle([(cw - lw) // 2 - 30, 24, (cw + lw) // 2 + 30, 90], radius=33, fill=(246, 200, 76, 255))
    d.text(((cw - lw) // 2, 32), lab, font=fs, fill=(61, 60, 40, 255))
    ty = 116
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((cw - w) // 2, ty), ln, font=f, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(255, 255, 255, 255))
        ty += lh
    im.save(card_path)

# 無人プレートの上に、人物レイヤー（口パク×シルエットマスク）をサイン波の位置・回転式で重ね、
# さらに静止マイクを最前面に重ねる（人物はマイクの後ろで揺れる）
out = os.path.join(OUT_DIR, 'video.mp4')
fc = (f'[1:v]fps={FPS}[bg];'
      f"[0:v][3:v]alphamerge,rotate=a='{SWAY_R}':fillcolor=black@0[chr];"
      f"[bg][chr]overlay=x='{BODY_BOX[0]}+{SWAY_X}':y='{BODY_BOX[1]}+{SWAY_Y}'[tmp];"
      f'[tmp][4:v]overlay={BODY_BOX[0]}:{BODY_BOX[1]}[scene];')
cmd = ['ffmpeg', '-y', '-loglevel', 'error',
       '-f', 'concat', '-safe', '0', '-i', concat,
       '-loop', '1', '-i', base_p,
       '-ss', str(START), '-i', AUDIO,
       '-loop', '1', '-i', mask_p,
       '-loop', '1', '-i', mic_p]

if VERTICAL:
    # スタジオ全景の構図: ON AIRサインとマイクまで入れて切り出し→幅1080に合わせ、上下はブランド色の帯
    fc += ('[scene]crop=1610:1536:660:0,scale=1080:-2[vc];'
           '[vc]pad=1080:1920:0:(oh-ih)/2:color=0xEAF2F2[v0];')
    static_p = os.path.join(tmp, 'ov-static.png')
    make_static_overlay(static_p)
    cmd += ['-loop', '1', '-i', static_p]
    idx, vlabel = 5, 'v0'
    fc += f'[{vlabel}][{idx}:v]overlay=0:0[v1];'
    idx, vlabel, n = idx + 1, 'v1', 2
    segs = []
    if SEG_FILE:
        with open(SEG_FILE) as sf:
            for ln in sf:
                ln = ln.rstrip('\n')
                if ln.strip():
                    ts, text = ln.split('\t', 1)
                    segs.append((float(ts), text))
    total = DUR_LIMIT or (len(mouths) * STEP)
    for k, (ts, text) in enumerate(segs):
        end = segs[k + 1][0] if k + 1 < len(segs) else total
        p = os.path.join(tmp, f'ov-seg{k}.png')
        make_seg_overlay(p, text)
        cmd += ['-loop', '1', '-i', p]
        fc += f"[{vlabel}][{idx}:v]overlay=0:0:enable='between(t,{ts:.2f},{end:.2f})'[v{n}];"
        vlabel, idx, n = f'v{n}', idx + 1, n + 1
    final_label = vlabel
else:
    fc += f'[scene]scale={VW}:{VH}[vout];'
    final_label = 'vout'
    # （2026-10-06 本人決定）オープニング曲のあいだ（はじめの MUTE_HEAD 秒）はサムネの絵を出し、最後の0.6秒で溶けるように本編へ
    THUMB = os.path.expanduser(args.get('--thumb', ''))
    if THUMB and os.path.exists(THUMB) and MUTE_HEAD > 1:
        cmd += ['-loop', '1', '-t', f'{MUTE_HEAD:.2f}', '-i', THUMB]
        fc += (f'[5:v]scale={VW}:{VH},format=rgba,fade=t=out:st={MUTE_HEAD - 0.6:.2f}:d=0.6:alpha=1[th];'
               f"[vout][th]overlay=0:0:eof_action=pass[vthumb];")
        final_label = 'vthumb'

if chaps:
    idx = len([x for x in cmd if x == '-i'])
    for k, (ts, text) in enumerate(chaps):
        dim_p = os.path.join(tmp, 'ch-dim.png')
        card_p = os.path.join(tmp, f'ch{k}.png')
        make_chapter_card(dim_p, card_p, text)
        cmd += ['-loop', '1', '-t', f'{GAP:.2f}', '-i', dim_p, '-loop', '1', '-t', f'{GAP:.2f}', '-i', card_p]
        out_st = GAP - 0.35
        # 暗幕はふわっと、カードは「ドン」と大きめから一瞬で縮んで止まる
        fc += (f'[{idx}:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1,fade=t=out:st={out_st:.2f}:d=0.35:alpha=1,'
               f'setpts=PTS+{ts:.3f}/TB[dm{k}];'
               f"[{idx + 1}:v]format=rgba,scale=w='iw*(1+0.25*max(0,1-t/0.18))':h=-1:eval=frame,"
               f'fade=t=out:st={out_st:.2f}:d=0.35:alpha=1,setpts=PTS+{ts:.3f}/TB[cd{k}];'
               f"[{final_label}][dm{k}]overlay=0:0:eof_action=pass[vd{k}];"
               f"[vd{k}][cd{k}]overlay=x='(W-w)/2':y='(H-h)/2':eof_action=pass[vc{k}];")
        final_label = f'vc{k}'
        idx += 2
    with open(os.path.join(OUT_DIR, 'chapters.txt'), 'w') as cf:   # YouTube概要欄用（0:00は別に足す）
        for ts, text in chaps:
            cf.write(f'{int(ts // 60)}:{int(ts % 60):02d} {text.replace("｜", "")}\n')

fc = fc.rstrip(';')
cmd += ['-filter_complex', fc, '-map', f'[{final_label}]', '-map', '2:a']
if DUR_LIMIT: cmd += ['-t', str(DUR_LIMIT)]
if START > 0 and DUR_LIMIT:   # 切り出しクリップは音をフェードイン/アウト
    cmd += ['-af', f'afade=t=in:d=0.4,afade=t=out:st={DUR_LIMIT-1.2}:d=1.2']
cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-r', str(FPS), '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-shortest', out]
subprocess.run(cmd, check=True)
print(f'完成: {out}（口パク{len(mouths)}コマ・{len(mouths)*STEP:.0f}秒・{"縦1080x1920" if VERTICAL else "横1920x1080"}）')
