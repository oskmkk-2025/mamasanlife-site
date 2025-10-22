# 新サイト 切替 当日ワンシート（2025-10-30 木）

この1枚だけ見ればOK。旧サイトへ影響ゼロで準備し、当日スイッチを切り替えます。

## スイッチ（環境変数プロファイル）

- Preview（切替前・検証用）
  - `NEXT_PUBLIC_SITE_URL` = https://<your-preview>.vercel.app
  - `NEXT_PUBLIC_NOINDEX` = `true`（検索回避）
  - `NEXT_PUBLIC_GA_ID` = （空 or DEV用）
  - `NEXT_PUBLIC_ADSENSE_ID` = （空）
  - `LINE_BROADCAST_ENABLED` = `false`
  - `LINE_CHANNEL_ACCESS_TOKEN` = （空）
  - `SANITY_WEBHOOK_SECRET` = （空）
  - `CRON_SECRET` = 任意（手動テスト用）

- Production（切替後・本番用）
  - `NEXT_PUBLIC_SITE_URL` = https://mamasanlife.com（例）
  - `NEXT_PUBLIC_NOINDEX` = `false`
  - `NEXT_PUBLIC_GA_ID` = G-XXXXXXX
  - `NEXT_PUBLIC_ADSENSE_ID` = ca-pub-XXXXXXXXXXXX
  - `LINE_BROADCAST_ENABLED` = `true`
  - `LINE_CHANNEL_ACCESS_TOKEN` = 長期トークン
  - `SANITY_WEBHOOK_SECRET` = 合言葉（Sanity Webhookと一致）
  - `CRON_SECRET` = 合言葉（手動実行用）

> Vercel では「Environment Variables」で Preview/Production に分けて登録します。

---

## 当日タイムライン（10/30 木）

- 09:00 事前チェック（Preview）
  - 200応答・画像・OG/Twitter Card・構造化（トップ/カテゴリ/記事）
  - `robots.txt` が `Disallow: /`（NOINDEX）であること（Preview）
- 09:15 DNS切替（@ / www を新サイトへ）
- 09:25 伝播確認
  - `dig +short <本番> @1.1.1.1` で新IP/CNAMEに
- 09:35 HTTPS/ads.txt/robots確認
  - `curl -I https://<本番>/`（200）
  - `curl -s https://<本番>/ads.txt | head -n1`
  - `curl -s https://<本番>/robots.txt`
- 09:45 スモークテスト
  - 検索/カテゴリ/記事/画像/内部リンク/サイトマップ
  - 構造化: Rich Results Test（記事URL）
- 14:00 TTLを3600へ戻す

---

## 切替“直後”のスイッチON（Productionで）

1) 検索許可
- `NEXT_PUBLIC_NOINDEX=false`

2) ベースURL
- `NEXT_PUBLIC_SITE_URL=https://<本番ドメイン>`

3) 計測/広告/通知
- `NEXT_PUBLIC_GA_ID=G-XXXXXXX`
- `NEXT_PUBLIC_ADSENSE_ID=ca-pub-...`
- `LINE_BROADCAST_ENABLED=true`
- `LINE_CHANNEL_ACCESS_TOKEN=...`

4)（任意）即時配信用 Webhook
- Sanity Webhook URL: `/api/hooks/sanity/publish`
- Header: `x-hook-secret: <SANITY_WEBHOOK_SECRET>`

> 反映は再デプロイ後（Deploy > Redeploy / `vercel deploy --prod`）。

---

## 検証コマンド（控え）

```
# DNS（公開）
dig +short <本番> @1.1.1.1
dig +short www.<本番> @1.1.1.1

# HTTPS/ads/robots
curl -I https://<本番>/
curl -s https://<本番>/ads.txt | head -n1
curl -s https://<本番>/robots.txt

# サイトマップ
curl -I https://<本番>/sitemap.xml
```

---

## ロールバック（万一）

- `@` と `www` を旧サイトのレコードへ戻す（TTL=300）
- 旧サイトの 301/HTTPS/ads.txt の応答確認
- 新サイト側は `NEXT_PUBLIC_NOINDEX=true` に戻して待機

---

## メモ

- 旧サイトは切替“前”は一切触らない（DNSのみ当日）
- 新サイトの Preview は NOINDEX・広告OFF・配信OFF のまま
- 切替“後”にだけ、各スイッチをON

