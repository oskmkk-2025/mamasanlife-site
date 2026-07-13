# ポッドキャスト→ブログ→SNS 自動化パイプライン（2026-07-12構築）

音声1本から「ポッドキャスト配信 → ブログ記事（アフィリエイト付き）→ アイキャッチ/マンガ → Instagram/X」までを自動化する仕組み。**ランニングコスト0円**・外部サービスへのAIログインなし・モデルが変わっても（Opus 4.8でも）手順書＋決定的スクリプトで再現可能。

## 全体図

```
①ネタ聞き取り・台本   Claude対話（スキル /podcast-interview）→ ~/claude/podcast/scripts/epNN-*.md
②録音               👤本人: iPhoneボイスメモ → AirDropでMacのDownloadsへ（2分）
③文字起こし          whisper.cpp ローカル無料（transcribe.mjs）
④ポッドキャスト公開    音声→Sanity、RSS=サイトが自動生成（podcast-publish.mjs）
                     └ Spotify/Apple/AmazonはRSSを自動巡回＝アップロード作業なし
⑤ブログ記事化         台本+文字起こし→記事化＋アフィリエイトCTA
                     └ 👤本人: 公開前に全文チェック「OK」だけ
⑥アイキャッチ・マンガ   👤本人: Geminiにプロンプトをコピペ・保存（2分）→ AIが分割・設置
⑦SNS               IGカルーセル自動生成（👤本人: Business Suiteで月1予約）
                     X文面生成＋APIキーがあれば自動投稿（post-x.mjs）
```

👤マークだけが人の作業。それ以外はスキル `/podcast-release` が一気通貫で実行する。

## 構成要素（すべて無料）

| 要素 | 実装 | 費用 |
|---|---|---|
| 音声ホスティング | Sanityファイルアセット（既存プロジェクト） | 0円（帯域10GB/月まで） |
| RSSフィード | `app/podcast/feed.xml/route.ts`（iTunes拡張つき） | 0円（Vercel既存） |
| 番組ページ | `https://mamasanmoney-bu.com/podcast` | 0円 |
| 番組設定 | `lib/podcast.config.ts`（番組名・説明・カテゴリ） | - |
| アートワーク | `public/podcast/artwork.png`（3000×3000・PIL製プレースホルダー。Geminiのペーパークラフト調に差し替え推奨） | 0円 |
| 文字起こし | whisper.cpp（`brew install whisper-cpp`済み）＋モデル `~/.whisper/ggml-small.bin` | 0円・完全ローカル |
| 配信先 | Spotify for Creators / Apple Podcasts / Amazon Music（RSS登録） | 0円 |
| 画像生成 | Gemini Webに本人コピペ（確立済みフロー） | 0円 |
| X投稿 | 公式API無料枠（500件/月）＋`post-x.mjs`（依存パッケージなし） | 0円 |

## スクリプト（mamasanlife-site/scripts/blog/）

- `transcribe.mjs --audio <file>` — afconvert(macOS標準)で16kHz WAV化→whisper-cliで日本語文字起こし
- `podcast-publish.mjs --audio <file> --title .. --description ..` — 音声アップロード＋episodeドキュメント作成（episodeNumber自動採番・afinfoで再生時間取得）
- `post-x.mjs --text .. --images ..` — X投稿（OAuth1.0a自前実装・キーは `~/.config/x-api/config.json`）

Sanityの `podcastEpisode` はAPI管理のみ（Studioスキーマ未定義でも動作する）。フィールド: title / description / episodeNumber / publishedAt / duration / audio(file) / transcript / relatedSlug / relatedCategory。

## 本人の初回セットアップ（各5分・一度だけ）

1. **Spotify for Creators**（creators.spotify.com）→「番組を追加」→「RSSフィードで登録」→ `https://mamasanmoney-bu.com/podcast/feed.xml` を入力（第1回公開後に実施。所有者確認メールが `podcast.config.ts` の ownerEmail に届く）
2. （任意）**Apple Podcasts Connect**（podcastsconnect.apple.com）に同じRSSを登録
3. （任意・X自動投稿を使う場合）developer.x.com で無料アプリ作成 → API Key/Secret・Access Token/Secret の4つを `~/.config/x-api/config.json` に保存: `{"apiKey":"..","apiSecret":"..","accessToken":"..","accessSecret":".."}`

## 運用ルール（要点）

- 台本・記事とも: プライバシールール（施設固有名・学校名・順位NG）／保険案件NG／捏造NG／CTAは1記事2個まで。詳細は `docs/blog-operations.md`。
- ポッドキャスト配信そのものをブログ記事にはしない（2026-07-09本人指示）。
- 記事のpublishedAtは内容に整合する過去日付（同日一斉公開しない）。
- IGは2026-08-10までリンク誘導禁止＝「ママさんライフ 家計」検索誘導仕様。
- 音声が増えてSanity帯域（10GB/月）が心配になったら: エピソードをAAC 64kbps程度に圧縮（afconvert -f m4af -d aac -b 65536）してからpublishする。

## 追加機能（2026-07-13）

- **リーガルチェック**: `scripts/blog/legal-check.mjs`（景表法・薬機法・投資助言・ステマ規制・プライバシー恒久ルール・保険NG）。台本/記事/SNS文面の公開前に必ず実行。🛑=公開ブロック、⚠️=判断して修正。ルール追加はファイル冒頭のRULES配列に1行足すだけ。
- **公開前チェック**: ママさんスタジオの公開・X投稿はすべて「全体プレビュー（タイトル/説明/音声試聴/リーガル結果）→本人チェック→公開」のフロー。🛑がある間は公開ボタンが無効。
- **OP/ED対応**: アプリの「仕上げる」でオープニング曲(冒頭7秒→声とクロス)・本編BGM(声の下で小音量ループ)・エンディング曲(終わり際に重なって8秒フェードアウト)を選択可。選択は記憶される。
- **ショート動画**: `scripts/blog/gen-short.py --audio <m4a> --start <秒> --dur 45 --ep <話数> --hook "<一言>"` → ~/claude/shorts/epN/ に 1080×1920 の short.mp4＋IG/YouTube用キャプション。素材はインスタ用カルーセル画像を自動流用。ffmpeg（brew導入済み）＋PIL。アプリのSNSタブからも生成可。**アップは本人**（リール/YouTubeショート。IGは8/10までリンク誘導禁止＝検索誘導キャプション）。

## トラブルシューティング

- Sanity 401 → 本人に `npx sanity login` を依頼（トークンは ~/.config/sanity/config.json に入る）
- whisper-cli が無い → `brew install whisper-cpp`、モデル再取得は `curl -L -o ~/.whisper/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin`
- フィードが更新されない → 空コミットpush（ISR 1時間キャッシュ）
- 精度が足りない → モデルをmedium（1.5GB）に上げる: ggml-medium.bin をダウンロードし transcribe.mjs のパスを変更
