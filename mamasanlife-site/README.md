// コミュニケーションは日本語。コード/識別子は英語。
# Mamasan Life

Next.js (App Router) + Sanity v3 で構築する生活情報ポータル。

- Domain: mamasanlife.com（Xサーバー側でDNS→Vercel推奨）
- CMS: Sanity（/studio に設置予定）
- Styling: Tailwind CSS
- Analytics: GA4
- Monetization: Google AdSense + Affiliate
- SEO: 構造化データ/OGP/サイトマップ/RSS/内部リンク

## 開発
- `npm install`
- `npm run dev`

## 主要ENV
- `NEXT_PUBLIC_SITE_URL=https://mamasanlife.com`
- `NEXT_PUBLIC_GA_ID=G-XXXXXXX`
- `NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXX`
- `NEXT_PUBLIC_NOINDEX=false`
- `SANITY_PROJECT_ID=...`
- `SANITY_DATASET=production`
- `SANITY_API_VERSION=2024-03-14`
- `SANITY_READ_TOKEN=...`（public取得のみなら不要）

build trigger
