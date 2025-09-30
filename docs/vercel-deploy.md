# Vercel デプロイ手順（mamasanlife-site）

- プロジェクト: `/Users/makiko/GPT-codexProjects/mamasanlife-site`
- 必要: Vercel アカウント、Git 連携（GitHub等）

## 手順
1. リポジトリを Git に登録して Vercel で New Project
2. 環境変数を登録（Vercel → Project → Settings → Environment Variables）
   - `NEXT_PUBLIC_SITE_URL` = https://mamasanmoney-bu.com
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = gqv363gs
   - `NEXT_PUBLIC_SANITY_DATASET` = production
   - `SANITY_PROJECT_ID` = gqv363gs
   - `SANITY_DATASET` = production
   - `SANITY_API_VERSION` = 2024-03-14（必要なら更新）
   - `SANITY_READ_TOKEN`（必要時のみ）
3. Domains に `mamasanmoney-bu.com` と `www.mamasanmoney-bu.com` を追加
   - Primary Domain を apex（mamasanmoney-bu.com）に設定
   - “Redirect www to apex” を ON（または Next/`vercel.json` 側で実装）
4. `vercel.json` の 301 ルールが Preview で期待どおりに動くか確認
5. `public/ads.txt` を AdSense の値で更新し、デプロイ

