# デプロイ・DNS切替チェックリスト（Vercel / ConoHa）

- [ ] Vercel に Project を作成し、リポジトリを連携
- [ ] 環境変数に `.env` の内容（SANITY_*）を登録
- [ ] Domains に `mamasanmoney-bu.com` と `www.mamasanmoney-bu.com` を追加
- [ ] Primary Domain を `mamasanmoney-bu.com` に設定
- [ ] Redirect www to apex を ON（または vercel.json の www→apex ルールを使用）
- [ ] `public/ads.txt` を AdSense の値で更新
- [ ] Preview で 301 リダイレクト動作を確認
- [ ] ConoHa DNS の TTL（@/www）を 3600→300 に短縮
- [ ] ConoHa DNS を切替：
      - @ A 76.76.21.21
      - www CNAME cname.vercel-dns.com.
- [ ] dig で反映確認（数分）
- [ ] メール送受信テスト（MX/DKIM/DMARC 維持）
- [ ] 検索：Search Console でサイトマップ送信
- [ ] 問題なければ TTL を 300→3600 に戻す

> ドメイン移管（ConoHa→Xserver）は WING 満了 + 15 日後（2025-11-16 以降）に実施します。
