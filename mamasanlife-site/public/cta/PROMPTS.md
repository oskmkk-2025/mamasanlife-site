# CTAボタン画像生成プロンプト集

---

## 🖼️ 必読：参考画像（このリポジトリに保存済み）

画像生成AIに送る前に、必ず以下のいずれかの画像をアップロードしてください。

### 5種ボタンの参考画像（amazon / rakuten / yahoo / kurashi / study）
- **本番URL（推奨）**: https://mamasanmoney-bu.com/cta/5buttons-reference.png
- **GitHub raw URL**: https://raw.githubusercontent.com/oskmkk-2025/mamasanlife-site/main/mamasanlife-site/public/cta/5buttons-reference.png
- **GitHub プレビュー**: ./5buttons-reference.png

### audiobookボタンの参考画像
- **本番URL（推奨）**: https://mamasanmoney-bu.com/cta/audiobook-reference.png
- **GitHub raw URL**: https://raw.githubusercontent.com/oskmkk-2025/mamasanlife-site/main/mamasanlife-site/public/cta/audiobook-reference.png
- **GitHub プレビュー**: ./audiobook-reference.png

### AIへの渡し方

**Nano Banana（Google AI Studio）の場合:**
1. https://aistudio.google.com/ を開き、モデルを「Gemini 2.5 Flash Image」に設定
2. プロンプト入力欄の下にある「画像を追加」アイコンをクリック
3. 上記URLをコピーして貼り付け、または画像を一度ダウンロードしてから添付
4. 続けて下記のプロンプト（amazon / rakuten / yahoo / kurashi / study / audiobook）を貼り付けて送信

**ChatGPT GPT-4o image の場合:**
1. ChatGPT を開き、画像生成モードに切り替え
2. メッセージ欄のクリップマークから上記URLの画像を添付
3. 「この参考画像と完全に同じスタイル・形状・サイズで、色とラベルだけ次のように変えて作って」と書く
4. 6種を1セッションで連続生成すると一貫性が保てる



このファイルは、Mamasan Life ブログのCTAボタンを **Nano Banana（Google AI Studio / Gemini）** または **ChatGPT GPT-4o image** で生成するための統一プロンプトです。

すべてのボタンが**完全に同一のスタイル・同一の画角・同一のサイズ・透明背景**になるよう設計されています。

---

## 重要：6種すべて同じ条件で生成すること

| 種別 | label テキスト | アイコン | ベースカラー |
|---|---|---|---|
| amazon | `Amazonで見る` | 小文字「a」（Amazonロゴ風） | オレンジ #EFA050 |
| rakuten | `楽天市場で見る` | 「R」（楽天ロゴ風） | ピンク赤 #D85A66 |
| yahoo | `Yahoo!ショッピングで見る` | ショッピングカート | 青 #5A88BE |
| kurashi | `くらしのマーケットで見る` | 笑顔の「c」キャラ風 | 濃オレンジ #F47A10 |
| study | `スタディサプリで見る` | 開いた本 | 濃青 #3A60C8 |
| audiobook | `audiobookで聴く` | ヘッドホン＋本 | 紫 #A87CE2 |

---

## 共通プロンプト（日本語版・Nano Banana/Gemini向け）

```
横長カプセル型のWebアプリ用CTAボタン、超光沢の3Dキャンディスタイル。
サイズ: 1080×126ピクセル、PNG透過背景、余白なし。
形状: 完全な角丸カプセル（左右が半円）、border-radius 63px。

ボタン本体: {{BASE_COLOR}}の単色グラデーション（上から明るく→下が濃く）。
上部45%に白い艶ハイライト（不透明度85%→透明、ガラスのような光沢）。
ボタン下端に2-3pxの濃い影（立体感）。

左端から12pxに白い円（直径72px、border-radius 50%、白背景）、円の中に{{ICON}}を{{BASE_COLOR}}と同色で描画、太字。
円の右側に縦の白い点線（dotted、太さ4px、不透明度85%、高さ55%）。
中央にラベルテキスト「{{LABEL}}」、白色、太字800、ピクセル90px、center揃え、文字に薄い影。
右端から18pxに白い円（直径72px、border-radius 50%、白背景）、円の中に{{BASE_COLOR}}色の右向き矢印「>」、太字。

背景は完全に透明（PNG alpha=0）。
スタイル: 添付した参考画像と完全に同じ、3Dキャンディ風、艶やか、立体感、光沢感、高品質ベクター調。
```

---

## 共通プロンプト（英語版・ChatGPT/DALL-E向け）

```
A horizontal capsule-shaped CTA button for a web app, ultra-glossy 3D candy style.
Size: 1080×126 pixels, transparent PNG background, no padding.
Shape: perfect rounded capsule (semicircle ends), border-radius 63px.

Button body: solid gradient of {{BASE_COLOR}} (lighter top → darker bottom).
Top 45% has a white glossy highlight (opacity 85% → transparent, glass-like sheen).
Bottom edge has a 2-3px dark shadow for depth.

Left side (12px from edge): white circle 72px diameter, 100% white fill, containing {{ICON}} drawn in {{BASE_COLOR}} color, bold weight.
Right of circle: vertical white dotted separator (4px stroke, 85% opacity, 55% button height).
Center: label text "{{LABEL}}" in white, font-weight 800, ~90px, center aligned, with subtle text shadow.
Right side (18px from edge): white circle 72px diameter, 100% white fill, containing a {{BASE_COLOR}}-colored right-pointing chevron ">", bold.

Background: fully transparent (PNG alpha=0). No outer padding or margin.
Style: identical to the attached reference image, 3D candy style, glossy, dimensional, high-quality vector look.
```

---

## 6種ぶんの個別プロンプト（{{}}に値を埋めたもの）

### 1. amazon.png

**日本語**
```
横長カプセル型のWebアプリ用CTAボタン、超光沢の3Dキャンディスタイル。
サイズ: 1080×126ピクセル、PNG透過背景。
ボタン本体: オレンジ色（上 #F5B770 → 下 #EFA050）の単色グラデーション。
上部に白い艶ハイライト（不透明度85%→透明）。下端に濃いオレンジ #C77A2A の影。
左の白円内にAmazonロゴ風の小文字「a」を #E08A30 で描画。
中央に縦白点線セパレーター。中央のラベル「Amazonで見る」白・太字800・90px。
右端の白円内に #E08A30 の右向き矢印「>」。
背景完全透明。3Dキャンディ風、艶やか、添付参考画像と同じ。
```

### 2. rakuten.png
ベースカラーを **ピンク赤 #D85A66**（上 #E78088 → 下 #D85A66、影 #A03540、矢印・アイコン #D04050）、ラベル「楽天市場で見る」、アイコン「R」（楽天ロゴ風、下線つき大文字R）に変更して同じプロンプト。

### 3. yahoo.png
ベースカラーを **青 #5A88BE**（上 #7FA8D8 → 下 #5A88BE、影 #2E5684、矢印・アイコン #3A6FA8）、ラベル「Yahoo!ショッピングで見る」、アイコン「ショッピングカート（線画）」に変更。

### 4. kurashi.png
ベースカラーを **濃オレンジ #F47A10**（上 #FF9A40 → 下 #F47A10、影 #A84E00、矢印・アイコン #E66800）、ラベル「くらしのマーケットで見る」、アイコン「笑顔の小文字c（くらしのマーケットのロゴ風キャラクター）」に変更。

### 5. study.png
ベースカラーを **濃青 #3A60C8**（上 #5B82E2 → 下 #3A60C8、影 #2540A0、矢印・アイコン #2A4FB0）、ラベル「スタディサプリで見る」、アイコン「開いた本（線画、シンプル）」に変更。

### 6. audiobook.png
ベースカラーを **紫 #A87CE2**（上 #C9A6F5 → 下 #A87CE2、影 #5E2FA0、矢印・アイコン #8055C5）、ラベル「audiobookで聴く」、アイコン「ヘッドホン＋本（電波マーク付き）」に変更。

---

## 生成手順

### Nano Banana（Google AI Studio / Gemini 2.5 Flash Image）
1. https://aistudio.google.com/ にアクセス
2. モデルを **Gemini 2.5 Flash Image** に切り替え
3. **添付画像をアップロード**（ユーザーが最初に送った5種ボタンの参考画像）
4. 上記プロンプトを1種ずつ貼り付けて生成
5. 生成画像をダウンロード（PNG透過確認）
6. ファイル名を `amazon.png` などに変更

### ChatGPT GPT-4o image generation
1. ChatGPT で「Image」モードを選択
2. **参考画像をアップロード**
3. 上記英語プロンプトを使用
4. 「同じスタイルで6種類を作って」とまとめて指示も可能
5. ダウンロードしてファイル名変更

---

## 統一性を保つコツ

- **必ず参考画像を最初にアップロード**してからプロンプトを送ること
- 1セッションで6種を続けて生成（モデルが直前の画像のスタイルを記憶）
- 生成後、6枚を並べて比較し、艶・サイズ・形状にズレがあれば再生成
- Nano Banana では「`同じスタイルで色だけ {{BASE_COLOR}} に変えて`」が有効

---

## アップロード手順

1. 6種すべて生成完了
2. `mamasanlife-site/public/cta/` にPNGを配置
3. ファイル名は厳密に: `amazon.png`, `rakuten.png`, `yahoo.png`, `kurashi.png`, `study.png`, `audiobook.png`
4. GitHub Web UI から **Add file → Upload files** でドラッグ＆ドロップ
5. コミット → Vercel 自動デプロイで本番反映
6. テスト記事で `<CTAButton type="amazon" url="..." useImage />` を使って確認

---

## トラブルシューティング

- **背景が白くなる**: プロンプトに「PNG transparent background, no white background」を追加
- **サイズがズレる**: 「1080×126px exact, no padding around the button」を強調
- **6種で形状が違う**: 1枚作った後に「同じ形状・同じサイズで色だけ変えて」と続ける
- **艶が出ない**: 「ultra-glossy, 3D candy style, glass-like sheen」を強調

---

何か質問があれば、Claude（責任者）に「ボタンのkurashiだけ作り直したい」など具体的に指示してください。
