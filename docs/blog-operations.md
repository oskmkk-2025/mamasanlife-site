# ブログ運用プレイブック（mamasanmoney-bu.com）

最終更新: 2026-07-03（Claude Fable 5による集中改善の完了時点）
目的: **月10万円の収益ブログ化**。このドキュメントだけ読めば、どのAIモデル・どの担当者でも安全に運用を引き継げる。

---

## 1. 全体像（3分で把握）

- **サイト**: https://mamasanmoney-bu.com （Next.js 15 + Sanity CMS + Vercel）
- **リポジトリ**: oskmkk-2025/mamasanlife-site。**Vercelは `mamasanlife-site/` サブフォルダをビルドする**（ルート直下ではない）
- **デプロイ**: mainにpushすると自動デプロイ。記事本文はSanity側なのでデプロイ不要（ISRで最大1時間後に反映）
- **記事データ**: Sanity project `gqv363gs` / dataset `production`。読み取りは公開、書き込みはトークン必要
- **運営者**: ひーちママ（FP2級・2児の母・東海エリア）。作業時間ゼロ前提でAIが自律運用。**確認なしで進めて結果だけ報告**が本人の指示

## 2. 収益戦略（2026年7月時点）

方針: 少ないPVでも稼げる**成果報酬型**に全振り。アドセンスは期待しない。

| 収益ライン | 記事 | 案件 | 状態 |
|---|---|---|---|
| 電気（主力） | 中部電力燃料費調整・光熱費比較・電気代補助金2026 | エネチェンジ（A8） | CTA設置済み |
| 通信 | MNP記事・格安SIM比較2本 | もしも/アクセストレード | 設置済み |
| 掃除 | エアコン/洗濯機/浴室/換気扇（体験談シリーズ） | くらしのマーケット（afb） | 設置済み |
| 資格 | 簿記3級・2級（職業訓練体験談） | スタディング（A8） | **承認待ち→承認後 `scripts/blog/add-studying-cta.mjs` を実行** |
| 楽天 | メルカリ・NISA・経済圏 | もしも | 設置済み |

**エネチェンジのA8コード**（再利用可、`lib.mjs` の `enechangeCta()` に組み込み済み）:
`https://px.a8.net/svt/ejp?a8mat=3ZJZJ2+1RPEIA+4CJ0+60H7M`

## 3. 🚫 絶対ルール（違反厳禁）

1. **silver-tutor / silver-tutors-experience1 は復元禁止**。本人が「おすすめできない」と判断して完全削除した記事。middlewareのGONE_SLUGSが410を返す。バックアップとの差分を見つけても復元しない。**復元系の作業は必ず本人に確認してから**
2. **体験談の捏造禁止**。本人が実際に体験していないことを「やってみた」と書かない。事実ベースの加筆のみ
3. **読者への発信（LINE配信等）は事前確認**。現在Sanityのwebhookは0件なので記事作成で自動配信は起きないが、webhookを追加する場合は必ず本人確認
4. **ASP等へのログイン・パスワード入力はしない**。広告コードの発行は本人に依頼する
5. 編集前に `backup-post.mjs` でバックアップを取る

## 4. 日常の運用コマンド（mamasanlife-site/ で実行）

```bash
# 記事の概要を見る
node scripts/blog/query.mjs --slug money-forward-me

# GROQで自由に検索（例: 全記事のslugとタイトル）
node scripts/blog/query.mjs "*[_type=='post']{'slug':slug.current,title}"

# 編集前のバックアップ（backups/posts/ に保存される）
node scripts/blog/backup-post.mjs money-forward-me

# タイトル・SEO情報の更新
node scripts/blog/set-seo.mjs money-forward-me --title "新タイトル" --seo-description "説明文"

# 本文への挿入（blocks.jsonに内容を書く。文字列だけなら段落になる）
node scripts/blog/insert-blocks.mjs money-forward-me --json blocks.json --before-heading "まとめ"

# 新規記事の作成
node scripts/blog/new-post.mjs --json article.json

# スタディング承認後のCTA設置（1回だけ）
node scripts/blog/add-studying-cta.mjs --html studying-ad.html
```

blocks.json / article.json では `lib.mjs` のブロック型が使える:
文字列（→段落）、`{"_type":"blogCard","url":"..."}`、`{"_type":"htmlEmbed","html":"..."}`、
speechBlock（まるお部員吹き出し）、tableBlock。詳しくは lib.mjs のコメント参照。

**トークンが切れたら**: `npx sanity login`（ブラウザが開くので本人にログインしてもらう）。
スクリプトは `~/.config/sanity/config.json` のCLIトークンを自動で使う。

## 5. 文体ガイド（ひーちママの書き癖）

- です・ます調。冒頭は読者への問いかけ（「〜ではないでしょうか？」）
- 自分の家庭は「うち」「わが家」。名乗りは「ひーち部長」
- 猫キャラ「**まるお部員**」の吹き出しで補足（語尾: 〜にゃ、〜にゃん、〜だにゃん！）→ `speechMaruo()`
- 具体的な数字・表で検証するスタイル。まとめの最後は「〜してみてくださいね♪」など柔らかく
- タイトルは検索される言葉で。誇張の「最新」「プロが解決！」型は使わない。体験記事は正直に「体験談」「正直レビュー」

## 6. SEOの決まりごと（2026-07-03に修正済みの罠）

- **layout.tsxに全ページ共通のcanonicalを書かない**（過去にこれで316ページがインデックス除外された）。canonicalは各ページで設定
- 検索ページ(/search)はnoindex。robots.tsで/admin等はdisallow
- sitemap.xmlはビルド時生成。**Sanityだけ更新した場合、sitemapのlastmod反映には空コミットpushが必要**
- 記事更新時は必ず `updatedAt` を更新（スクリプトは自動でやる）
- 旧WordPressのURLはmiddleware＋vercel.jsonでリダイレクト済み。旧カテゴリslug→新カテゴリの対応表はmiddleware.tsのPAGE_MAP

## 7. 効果測定（月1回）

1. [サーチコンソール](https://search.google.com/search-console?resource_id=https%3A%2F%2Fmamasanmoney-bu.com%2F)で3ヶ月のクリック/表示/掲載順位を確認
2. ベースライン（2026-07-03時点）: **クリック254/3ヶ月・表示1.06万・平均12.9位・インデックス55ページ**。これを上回っているかが成否の基準
3. 見るポイント: ①リライトした記事のCTR変化（特に楽天メルカリ: 0.3%→改善したか） ②インデックス数の回復（55→70目標） ③新記事（電気代補助金）の順位
4. ASP管理画面の成果確認は本人に依頼（ログイン必要）

## 8. 既知の状態・注意点

- `.env.local` のSANITY_READ_TOKEN/WRITE_TOKENは**期限切れ**。ローカルビルドは `SANITY_READ_TOKEN="" npm run build` で回避（公開データなのでトークン不要）
- 管理画面(/admin/*)は誰でも開けるが、書き込みAPIはADMIN_SECRETで保護済み・本番に秘密は漏れていない
- GSCの「修正を検証」は4項目すべて2026-07-03に開始済み。結果は数週間後
- 記事の`_key`欠損はStudio編集を壊す。スクリプトの`ensureKeys()`が自動補修する
