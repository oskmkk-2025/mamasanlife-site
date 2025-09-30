# ひーちママ公式サイト兼ブログ

Next.js + Tailwind CSS + Sanity で構築する公式サイト兼ブログのコードベースです。

## 技術スタック
- Frontend: Next.js (App Router, React + TypeScript)
- Styling: Tailwind CSS
- CMS: Sanity (Content Lake)
- Hosting: Vercel 想定
- Analytics: Google Analytics 4 (GA4)

## 機能
- トップページ（ヒーロー/自己紹介/実績/最新記事）
- ブログ一覧（検索/ページネーション）
- 記事詳細（目次/シェアボタン/関連記事/OGP/JSON-LD）
- カテゴリー/タグ別一覧
- 共通 Header/Footer
- robots.txt / sitemap.xml 自動生成

## セットアップ
1. 依存インストール
   - `npm install`
2. 環境変数を設定
   - `.env` を作成し、`.env.example` を参考に値を設定
3. Sanity プロジェクト準備
   - Sanity のプロジェクトを作成し、スキーマを反映（`sanity/schema.ts` の型を Studio に登録）
   - 例: `sanity.config.ts` の `schema: { types: schemaTypes }` に本リポジトリの `schemaTypes` を読み込む
   - Content Lake の Read Token を発行し `.env` に設定（プレビュー不要なら省略可）
4. 開発サーバー起動
   - `npm run dev`

## 主要な環境変数
- `NEXT_PUBLIC_SITE_URL` 例: `https://hichimama.example.com`
- `NEXT_PUBLIC_GA_ID` GA4 の測定 ID（未設定なら GA は読み込まれません）
- `SANITY_PROJECT_ID` Sanity プロジェクト ID
- `SANITY_DATASET` データセット名（例: `production`）
- `SANITY_API_VERSION` API バージョン（例: `2024-01-01`）
- `SANITY_READ_TOKEN` 読み取りトークン（公開記事のみの取得なら未設定でも可）

## スキーマ
- `post` 記事ドキュメント（`title/slug/excerpt/mainImage/publishedAt/updatedAt/categories/tags/body`）
- `category` カテゴリー（`title/slug/description`）
- `tag` タグ（`title/slug`）
- `author` 著者（任意: `name/slug/image/bio`）
- `settings` サイト設定
- `blockContent` Portable Text（見出し/段落/箇条書き/画像）

## 備考
- 目次（Table of Contents）は簡易実装です。Portable Text のカスタムシリアライザから見出しを収集する実装に差し替えると精度が上がります。
- Typography プラグインなしで読みやすいベーススタイルを定義しています。必要に応じて `@tailwindcss/typography` の導入を検討してください。
- 画像最適化は `next/image` を使用。Sanity 画像は `cdn.sanity.io` を許可しています。
 - App Router の ISR（`revalidate = 60`）で静的化しつつ更新反映します。
