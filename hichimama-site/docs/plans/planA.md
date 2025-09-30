# Plan A スナップショット（2025-09-15）

目的: 現時点の仕様・デザイン・実装状態を固定し、今後の検証やPlan B設計のリファレンスにする。

## デザイン指針（Home基調）
- テイスト: Nature + Patisserie（Vanilla/Honey/Caramel/Chocolate）
- 配色: `brand` スケール（Tailwind拡張）を統一的に使用
- コンポーネント: ヒーロー、ランキングリボン、ストロベリーボタン等の“お菓子モチーフ”を踏襲

## 実装済みページ
- Home: 完了（ヒーロー/NEW/ランキング/カテゴリ）
- Blog一覧: 検索・カテゴリ/タグの固定フィルタ、メタ、JSON-LD
- カテゴリ/タグ一覧: ヘッダ/パンくず/メタ/JSON-LD
- 記事詳細: 目次自動生成（Portable Text→h2/h3/h4）、パンくず、Reading Progress、BlogPosting+BreadcrumbListのJSON-LD
- Profile: 英語UI（Profile）、本文は WordPress.2025-08-19.xml から抽出、PersonのJSON-LD
- Contact: 英語UI維持、環境変数メール、ContactPageのJSON-LD

## SEO/アクセシビリティ
- App Routerの `revalidate = 60`
- `metadata` とJSON-LD（CollectionPage/BlogPosting/BreadcrumbList/Person/ContactPage）
- `sitemap.xml` に記事+カテゴリ+タグを出力
- robotsは `.env` の `NEXT_PUBLIC_NOINDEX` に追従
- ページネーションに `aria-label`/`rel` を付与

## 運用/開発
- スクリプト:
  - `dev`（ローカル）/ `dev:lan`（LAN公開）
  - `start:prod:local`（本番ビルドで最終確認）
  - `preview:open`（静的プレビューHTML+Tailwind）
- 環境変数（抜粋）: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_NOINDEX`, `NEXT_PUBLIC_CONTACT_EMAIL`, `SANITY_*`

## 互換スタイル（WP由来）
- `.wp-content` スコープでCocoon風吹き出し・装飾（マーカー/番号リスト）を軽量CSSで再現

## 既知の課題 / TODO
- 記事本文の装飾（表、引用、注意ボックス）の最適化
- 画像の外部ホスト参照 → `public/` への移行検討
- OG画像の既定/動的生成（記事・リスト）
- アクセシビリティ監査（キーボードフォーカス、コントラスト）

## 主要変更ファイル（抜粋）
- ページ: `app/blog/**/*.tsx`, `app/profile/page.tsx`, `app/contact/page.tsx`
- 共通: `components/{PageHeader,Breadcrumbs,ReadingProgress}.tsx`
- SEO: `app/sitemap.ts`, `app/layout.tsx`
- ツール: `lib/utils.ts`, `package.json`（スクリプト）
- WP抽出: `docs/wordpress-extract/profile.html`

