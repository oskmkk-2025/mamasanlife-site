# WXR → Sanity NDJSON 変換（最小）

WordPress の WXR (XML) を Sanity の `dataset import` で読み込める NDJSON に変換する最小 CLI です。

- 対応フィールド: title, slug, categories, tags, excerpt, publishedAt, updatedAt, body(プレーンテキストの Portable Text), heroImageUrl
- 画像: 初回は heroImage を URL として `heroImageUrl` に保持します（アセット取り込みは次段階で対応）。

## 前提

- Node.js 18+（推奨）
- Sanity CLI がローカルにインストール済みで `sanity` コマンドが利用可能
- テスト用 dataset: `staging`（すでに作成済みとのこと）

## セットアップ

```
cd tools/wxr-to-sanity
npm install
```

## 変換の実行

```
node bin/wxr-to-sanity.js \
  --input "/Users/makiko/GeminiProjects/sanity-blog/WordPress.2025-08-19.xml" \
  --output out/sanity.ndjson
```

- 公開済みのみを出力したい場合は `--only-published` を追加してください。
- スキーマの型名を変更したい場合:
  - `--post-type post`（既定: `post`）
  - `--category-type category`（既定: `category`）
  - `--tag-type tag`（既定: `tag`）
  - `--hero-field heroImage` のように hero 用フィールド名を変更可能（既定: `heroImageUrl`）。

## NDJSON の内容（概要）

- `category`／`tag` ドキュメントをユニークに生成後、`post` ドキュメントを出力します。
- `post` の `_id` は `post-<slug>`（slug が無い場合は `wp-<post_id>` にフォールバック）。
- `slug` は WXR の `wp:post_name` かタイトルから生成します。
- `categories`／`tags` は `reference` 配列で、それぞれ `category-<slug>`／`tag-<slug>` を参照します。
- `body` は HTML をプレーンテキストへ落として 1 ブロックの Portable Text にします。
- `heroImageUrl` は `_thumbnail_id` → 対応する attachment の `wp:attachment_url` から解決します。

## staging へのインポート

Sanity CLI のバージョンによりコマンドが異なる場合があります。まずは以下をお試しください。

```
# いずれか（環境の CLI バージョンに合わせて）
sanity dataset import ./tools/wxr-to-sanity/out/sanity.ndjson staging
# または
sanity import ./tools/wxr-to-sanity/out/sanity.ndjson staging
```

- インポート後、Studio 側で `post/category/tag` の見え方・フィールドマッピングを確認してください。
- 必要があれば `--replace` や `--missing` 等のフラグを付与してください（運用ポリシーに合わせて）。

## 次段階（差分アップサート／画像取り込み）

- 差分アップサート: タイトル or スラッグ一致で既存ドキュメントを取得し、`body`/`tags`/`hero` のみ更新。
- 画像: `heroImageUrl` をもとに `sanity.imageAsset` 化して `image` フィールドへ移行（スクリプト追加予定）。

## よくある調整ポイント

- スキーマのドキュメント型名が異なる場合は、上記オプションで合わせてください。
- カテゴリ／タグを使用していない場合は Studio 側のフィールド名に合わせて CLI を再実行してください。
- HTML をそのまま Portable Text に変換したい場合は、後続で HTML→PT 変換ライブラリ導入を検討します。

