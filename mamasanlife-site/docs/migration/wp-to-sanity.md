# WP → Sanity 移行手順（概要）

1) WordPress から WXR(XML) をエクスポート
- 旧ドメイン: mamasanmoney-bu.com

2) 変換スクリプトで Sanity JSON を生成
- 主要マッピング:
  - `post_title` → `title`
  - `post_name` → `slug`
  - `post_date` → `publishedAt`
  - `post_modified` → `updatedAt`
  - `post_content` → `body`（PortableText化は段階移行でも可）
  - `category` → `category`（指定の6カテゴリへ正規化）
  - 旧URL → `oldUrl`
  - 新URL → `redirectTo`（`https://mamasanlife.com/{category}/{slug}`）

3) Sanity にインポート
- `sanity dataset import <json> production`

4) Next.js 側の 301 リダイレクト
- `next.config.mjs` の `redirects()` が `oldUrl→redirectTo` をSanityから自動生成

5) 検証
- ランダム20記事で本文/画像/内部リンクを確認
- Search Console でインデックス&カバレッジ

補足
- PortableText化は `@portabletext/to-html` を併用し段階移行可能
- 画像は `cdn.sanity.io` へ移行推奨（先行は旧ホストのままでも可）
