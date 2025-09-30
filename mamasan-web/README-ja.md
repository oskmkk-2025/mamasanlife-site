# mamasan-web (Next.js + Sanity)

このリポジトリは Sanity の `production` データセットを参照する本番フロントです。Vercel でホスティングし、301 リダイレクトは `vercel.json` で管理します。

## 使い方（最短）

1. 依存インストール
   ```bash
   cd mamasan-web
   npm install
   cp .env.example .env   # 必要に応じて編集
   ```
2. 開発起動
   ```bash
   npm run dev
   # http://localhost:3000
   ```
3. Vercel へデプロイ
   - Vercel で新規 Project → Git 連携 → 環境変数に `.env` の内容を転記
   - Domains に `mamasanmoney-bu.com` と `www.mamasanmoney-bu.com` を追加
   - Primary Domain を `mamasanmoney-bu.com` に、"Redirect www to apex" を有効化

## DNS 切替（ConoHa）

- 触るのは `@` と `www` のみ（メール等は現状維持）
- 事前: TTL を `3600 → 300` に短縮
- 切替: `@ A 76.76.21.21`、`www CNAME cname.vercel-dns.com.`

維持するレコード（例）
- `A mail → 118.27.122.146`
- `A ml-cp → 118.27.122.146`
- `MX @ → mail70.conoha.ne.jp (prio 10)`
- `TXT @ → google-site-verification=...`
- `TXT default._domainkey → DKIM 公開鍵`

## 301 リダイレクト

- `vercel.json` の `redirects` に代表的な WordPress 由来のパターンを定義済みです
- 追加の個別リダイレクトがある場合は、上から順に追加してください（先勝ち）

## ads.txt

- `public/ads.txt` の `pub-XXXXXXXXXXXXXX` を AdSense の発行元 ID に置き換えてください

## Sanity 接続

- 既定: `projectId=gqv363gs`、`dataset=production`、`useCdn=true`
- データセットが private の場合は `SANITY_READ_TOKEN` を設定してください

## ドメイン移管（メモ）

- ConoHa WING 満了 + 15 日（2025-11-16 以降）に Xserver ドメインへ移管
- 本リポジトリの設定は移管後もそのまま利用可能（DNS 値のみ要確認）

