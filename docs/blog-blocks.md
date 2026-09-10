# 装飾ブロック辞典（Sanity Portable Text）

記事の見た目を作るブロックの一覧と、そのJSONの形。
**毎回Sanityを掘って構造を調べていた**ので1か所にまとめた（2026-09-10）。

`_key` は全ブロック・全子要素に必須（12桁の16進でよい）。`new-post.mjs` は `ensureKeys` で補うが、**patchで直接入れるときは自分で付ける**。

---

## 0. 文章と装飾（block）

```json
{ "_type":"block", "_key":"...", "style":"normal", "markDefs":[],
  "children":[ {"_type":"span","_key":"...","text":"ふつうの文","marks":[]},
               {"_type":"span","_key":"...","text":"太字","marks":["strong"]},
               {"_type":"span","_key":"...","text":"マーカー","marks":["highlight"]} ] }
```

- `style`: `normal` / `h2` / `h3` / `blockquote`
- marks: **`strong`（太字）/ `em` / `highlight`（マーカー）/ `link`**
- リンクは `markDefs` に `{"_type":"link","_key":"k1","href":"..."}` を置き、spanの `marks` に `"k1"` を入れる

### 箇条書き（`.pt-list` のアクセント背景がつく）

```json
{ "_type":"block","_key":"...","style":"normal","listItem":"bullet","level":1,
  "markDefs":[], "children":[ ... ] }
```

- `listItem`: `bullet`（テラコッタのひし形）/ `number`（ティールの丸に白抜き数字）
- **順番があるものは必ず `number`**（手順・ステップ）
- 連続するブロックが自動で1つのカードにまとまる

---

## 1. tableBlock（表）

```json
{ "_type":"tableBlock","_key":"...","hasHeader":true,
  "rows":[ {"_type":"tableRow","_key":"...","cells":["見出し1","見出し2"]},
           {"_type":"tableRow","_key":"...","cells":["値1","値2"]} ] }
```

- ⚠️**セルはただの文字列。`**太字**` は効かない**。強調したい行は表の外に文章で書く
- 列幅は中身に合わせて自動（2026-09-09改修）。長い列だけ折り返す（PC 20em / スマホ 14em）
- ⚠️**2つ以上の軸で見るものだけ表にする。**項目と値の対応だけなら**箇条書き**にする

## 2. summaryBlock（まとめ枠）

```json
{ "_type":"summaryBlock","_key":"...","title":"この記事でわかること",
  "items":["1行目","2行目"] }
```

- **冒頭に「この記事でわかること」、末尾に「まとめ」**の2つが基本形

## 3. speechBlock（吹き出し）

```json
{ "_type":"speechBlock","_key":"...","name":"ひーちママ",
  "iconUrl":"/images/speech-icons/hiichimama.png","align":"left",
  "paras":["セリフ1","セリフ2"] }
```

- アイコン: `hiichimama.png` / `maruo.png` / `hiichi.png` / `papa.png`
- `align`: `left`（ママ・パパ）/ `right`（子ども側）が読みやすい
- ⚠️**セリフだけを入れる。**「〜と言いました」の地の文を混ぜると吹き出しの意味が薄れる
- キャラ: ひーちママ＝進行役／まるお＝「なんで？」の質問役（中学生・弟）／ひーち＝マイペースなJK姉／パパ＝丁寧解説役。**にゃん語尾は使わない**

## 4. faqBlock（よくある質問）

```json
{ "_type":"faqBlock","_key":"...",
  "items":[ {"_type":"faqItem","_key":"...","question":"...","answer":"..."} ] }
```

- 3〜5問。**記事を読んだ人が最後に思う疑問**を置く

## 5. blogCard（内部リンクカード）

```json
{ "_type":"blogCard","_key":"...","url":"https://mamasanmoney-bu.com/money/xxx" }
```

- ⚠️**公開待ちの記事（publishedAtが未来）に貼ると404**。公開日に貼る
- 任意で `title` / `excerpt` / `imageUrl` を上書きできる

## 6. moshimoEasyLink（もしもかんたんリンク）

```json
{ "_type":"moshimoEasyLink","_key":"...",
  "data":{ "brand":"...","title":"...","price":"","image":"https://m.media-amazon.com/images/I/xxx._SL500_.jpg",
    "buttons":[ {"_type":"moshimoButton","_key":"...","label":"Amazonで見る","color":"#f79256","url":"https://af.moshimo.com/af/c/click?a_id=..&p_id=..&pc_id=..&pl_id=..&url=<encodeURIComponent>"} ] } }
```

- **店舗別ID**: Amazon `a_id=4046523&p_id=170&pc_id=185&pl_id=27060` ／ 楽天 `4046502&54&54&27059` ／ Yahoo `4046520&1225&1925&27061`
- ボタン色: Amazon `#f79256` / 楽天 `#f76956` / Yahoo `#66a7ff`
- ⚠️`url=` の中身は `encodeURIComponent`。`!'()*` も%エンコードしないと404になる
- ⚠️**msmaflink（script版）は使わない**。広告ブロッカーで消える
- ボタンのアイコンは**行き先のショップで自動判定**される（2026-09-09改修）

## 7. mangaBlock（4コマ）

```json
{ "_type":"mangaBlock","_key":"...",
  "images":[ {"_type":"image","_key":"...","alt":"...","caption":"ひーちママ「セリフ」",
              "asset":{"_type":"reference","_ref":"image-xxxx-1696x579-png"}} ] }
```

- コマは **1696×579前後**。縦長1枚で生成して4分割する
- **セリフは画像に描かず `caption` に入れる**（AIが文字を崩すため）

## 8. audioBlock（音声＋文字起こし）

```json
{ "_type":"audioBlock","_key":"...","title":"...","transcription":"...",
  "audioFile":{ "_type":"file","asset":{"_type":"reference","_ref":"file-xxx"} } }
```

- GA4で再生・25/50/75/100%・文字起こし展開を計測している

## 9. image / htmlEmbed / linkImageRow

- `image`: `{"_type":"image","_key":"...","alt":"必須","asset":{"_type":"reference","_ref":"image-xxxx"}}`
  - アイキャッチは **2752×1536（16:9）**、挿絵も同じ比率
- `htmlEmbed`: `{"_type":"htmlEmbed","_key":"...","html":"..."}` — TGアフィのバナー等
- `linkImageRow`: バナーを横に並べる（旧WP由来。新規では使わない）

---

## 1記事の基本形

```
リード（3〜4段落）
summaryBlock「この記事でわかること」
h2 → 本文 → 表 or 箇条書き → speechBlock
h2 → 本文 → moshimoEasyLink（商品を出すところ）
h2 → 本文
faqBlock
h2「まとめ」→ summaryBlock
blogCard ×1〜3
```

数値目標は `blog-operations.md` の 5.1 を参照（1段落50〜60字・太字20か所・表2〜3）。
