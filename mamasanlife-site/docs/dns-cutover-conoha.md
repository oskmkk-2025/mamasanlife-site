# DNS 切替（ConoHa）チェックリスト

> メール（MX/DKIM/TXT）は触らない。変更するのは `@` と `www` だけ。

## 事前（前日〜当日朝）
- [ ] ConoHa DNS の TTL（@/www）を `3600 → 300` に短縮

## 切替（Vercel でドメイン Ready を確認後）
- [ ] `@` の A レコード → `76.76.21.21`
- [ ] `www` の CNAME → `cname.vercel-dns.com.`
- [ ] 残す: `A mail` `A ml-cp` `MX @` `TXT google-site-verification` `TXT default._domainkey`（そのまま）

## テスト
- [ ] `dig +short mamasanmoney-bu.com` が `76.76.21.21`
- [ ] `dig +short www.mamasanmoney-bu.com` が `cname.vercel-dns.com`
- [ ] 旧 → 新 URL が 301/308 で遷移（ブラウザ/`curl -I`）
- [ ] ads.txt が配信される
- [ ] メール送受信テスト（SPF/DKIM/DMARC 維持）

## 安定後
- [ ] TTL を `300 → 3600` に戻す

