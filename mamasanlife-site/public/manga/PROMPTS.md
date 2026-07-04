# 導入マンガ 画像生成プロンプト集

キャラ設定は CHARACTERS.md を正とする。生成手順はCTAボタン（/public/cta/PROMPTS.md）と同じ:
**Nano Banana（Google AI Studio / Gemini画像）** または **ChatGPT画像生成** を使用。

## 🖼️ 手順（毎回共通）

1. 参考画像としてLINEスタンプを添付する（画風の統一のため必ず）:
   - https://mamasanmoney-bu.com/images/stamps/line-stamp-daily-arigatou.png
   - https://mamasanmoney-bu.com/images/stamps/line-stamp-daily-ganbari.png
   - https://mamasanmoney-bu.com/images/stamps/line-stamp-daily-gomen.png
2. まず下の【キャラクター基準シート】を1枚生成し、以後のコマ生成では
   その基準シートも一緒に添付する（家族の顔・服のブレ防止）
3. 各コマのプロンプトを貼って**1セッション内で連続生成**（一貫性維持）
4. できたPNGを `mamasanlife-site/public/manga/ep1/panel-1.png` ～ `panel-4.png` として保存
5. あとはAIに「第1話を記事に挿入して」と頼めば `scripts/blog/add-manga.mjs` で挿入される

## 【キャラクター基準シート】（最初に1回だけ生成）

```
Character reference sheet, same art style as the attached LINE sticker images
(kawaii Japanese sticker style, thick clean outlines, soft pastel colors, flat
shading, plain white background). A Japanese family of four and two cats,
standing in a row, full body, front view, evenly spaced:
1) DAD: gentle salaryman in his 40s, short dark hair, relaxed weekend clothes
   (polo shirt), slightly sleepy but kind face
2) MOM "Hiichi-mama": cheerful woman in her 40s, shoulder-length dark bob hair,
   outdoor-casual clothes (light hiking vest), bright smile, energetic
3) DAUGHTER "Hiichi": high-school girl, long dark hair with a small ribbon,
   school cardigan, sweet and stylish
4) SON "Maruo": junior-high boy, short spiky hair, sporty T-shirt, holding a
   table tennis paddle, playful grin
5) CAT 1: brown tabby (kijitora) female cat, grumpy unimpressed face
6) CAT 2: orange tabby (chatora) male cat, clever confident face
No text, no letters, no watermark. Square 1:1, 1080x1080.
```

---

## 第1話「7月の電気代、どうする？」（掲載先: /money/electricity-gas-subsidy-2026 の導入）

セリフは画像に入れない。挿入時に下記キャプションが各コマの下に表示される。

### コマ1
```
Same art style and same characters as the attached reference sheet.
Panel 1 of a family comic: summer living room, DAD frozen in shock holding an
electricity bill paper, sweating, fan blowing nearby. The two cats are
sprawled lazily on the floor from the heat. Kawaii LINE sticker style, thick
outlines, pastel colors, simple room background. Speech bubbles EMPTY or none.
No text anywhere. Square 1:1, 1080x1080.
```
キャプション: パパ「でっ、電気代が…！エアコン、我慢する…？」

### コマ2
```
Same art style and same characters as the attached reference sheet.
Panel 2: MOM smiling confidently, holding a smartphone, one finger raised as
if explaining a smart tip. Bright and reassuring mood, sparkle effects.
No text anywhere. Square 1:1, 1080x1080.
```
キャプション: ひーちママ「大丈夫。7月の使用分から、国の値引きが“自動で”始まってるよ」

### コマ3
```
Same art style and same characters as the attached reference sheet.
Panel 3: DAUGHTER (high-school girl) and SON (junior-high boy with table
tennis paddle) leaning forward with curious sparkling eyes, excited.
No text anywhere. Square 1:1, 1080x1080.
```
キャプション: ひーち「うちはいくら安くなるの？」／まるお「卓球のあとの扇風機は死守で！」

### コマ4
```
Same art style and same characters as the attached reference sheet.
Panel 4: MOM proudly showing a simple chart/table on paper, family gathering
around to look. The orange tabby cat nods wisely like it understands, the
brown tabby cat looks away unimpressed. Warm happy mood.
No text anywhere (the chart can be abstract lines, no letters). Square 1:1.
```
キャプション: ひーちママ「使用量別の早見表にまとめたよ。答えはこのすぐ下♪」

---

## 次話のつくり方（AI向けメモ）

1. CHARACTERS.md を読む → 対象記事のテーマを家族の日常会話に変換（あるある→気づき→引き）
2. 4コマの台本（構図＋キャプション）をこのファイルに追記
3. 各コマの生成プロンプトは上の形式を踏襲（基準シート添付・No text・1:1）
4. 画像が public/manga/epN/ に置かれたら add-manga.mjs で挿入
