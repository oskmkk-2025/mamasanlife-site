# 運用ランブック（Sanity公開 / DNS / メール / レジストラ移管）

最終更新: 2025-10-10（JST）

このドキュメントは、Sanity 本番公開に伴う DNS 切替、メール維持、そしてレジストラ移管までの手順を「ダウンタイム最小」で進めるためのチェックリストです。

---

## 現状スナップショット（2025-10-10 時点）
- APEX(@): A 216.198.79.1（TTL=300）
- www: CNAME 57eb1e9e2e72d298.vercel-dns-017.com（TTL=300）
- MX(@): 10 mail70.conoha.ne.jp（TTL=3600）
- A(mail): 118.27.122.146（TTL=3600）
- A(ml-cp): 118.27.122.146（TTL=3600）
- TXT(@): google-site-verification=_bsz2UweVb9yWT9lX7p8WtXvsvg7UY7Qbg6ZPpRpNac（TTL=3600）
- DKIM: default._domainkey（公開鍵TXTあり, TTL=3600）
- なし: AAAA（@/www/mail/ml-cp）, SPF(@), DMARC

参考: 詳細な ConoHa 切替手順は docs/dns-cutover-conoha.md を参照。

---

## タイムライン別チェックリスト

### 1) 9/29–10/07 Sanity 本番の最終整備（完了確認）
- [ ] 301 リダイレクト対応表（WordPress → Sanity）を確定・保管（CSV/MD）
- [ ] ads.txt を Next プロジェクト public/ads.txt に配置、配信確認
- [ ] メール（MX/SPF/DKIM/DMARC）現行値のメモを保管（本書「現状スナップショット」）

### 2) 10/08 TTL 短縮（3600 → 300）
- [ ] ConoHa DNS の @ と www の TTL を 300 に変更
- [ ] 反映確認
  - dig @1.1.1.1 mamasanmoney-bu.com A +noall +answer
  - dig @1.1.1.1 www.mamasanmoney-bu.com CNAME +noall +answer

### 3) 10/09–10/10 DNS だけ切替えて Sanity 公開（移管はまだ）
- [ ] @ → A 216.198.79.1（Vercel 推奨 IP）
- [ ] www → CNAME 57eb1e9e2e72d298.vercel-dns-017.com
- [ ] 301 適用（www → apex など方針どおり）
- [ ] 動作確認（代表）
  - curl -sS -I http://mamasanmoney-bu.com（308/301 → https）
  - curl -sS -I https://mamasanmoney-bu.com（200）
  - curl -sS -I https://www.mamasanmoney-bu.com（308/301 → apex）
  - curl -sS -I https://mamasanmoney-bu.com/ads.txt（200）
  - curl -sS https://mamasanmoney-bu.com/ads.txt | sed -n '1,20p'
- [ ] バックアウト手順の用意（@/www を旧値へ戻す）

### 4) 10/10 本日中に必ず実施
- [ ] ドメイン更新（期限: 2025-10-11）。自動更新 ON 推奨
- [ ] 反映後の再確認（curl/dig）

### 5) 〜 11/01 WING 自動更新 OFF（次年度更新防止）
- [ ] WING パックの自動更新を OFF（満了: 2025-11-01 00:00）
- 備考: 満了後 15 日の復旧猶予はあるが、DNS/メール継続は保証されない前提で計画を進める

### 6) 10/20 目安 — メール運用の方針決定
- [ ] A 案: ConoHa メール継続（WING 延長が必要）
- [ ] B 案: 他社メールへ移行（MX/SPF/DKIM/DMARC を新サービス値に切替）
- 暫定の最小強化（現構成維持時）
  - [ ] SPF 追加（@ の TXT）: v=spf1 mx ~all
  - [ ] DMARC 追加（_dmarc の TXT）: v=DMARC1; p=none; rua=mailto:レポート受信先
  - [ ] 送受信テスト（Gmail のメッセージソースで SPF/DKIM/DMARC = pass）

### 7) 11/16 以降 — レジストラ移管（Xserver ドメイン）
- 事前
  - [ ] ConoHa: ドメインロック OFF、AuthCode 取得
  - [ ] WHOIS 連絡先メールの受信可否を確認
  - ※ 移管中はネームサーバを変更しない（ノーダウン原則）
- 申請
  - [ ] Xserver で移管申請（AuthCode 入力）
  - [ ] 承認メールで「承認」
- 完了後
  - [ ] レジストラロック ON / WHOIS 保護 ON
  - [ ] 必要に応じて DNS ホスティングの切替（例: Cloudflare）
  - [ ] TTL を 300 → 3600 に戻す（収束後）

### 8) 移行後の定常確認
- SEO/サイト
  - [ ] / 200、主要 301 → 最終 200、/sitemap.xml /robots.txt 200
  - [ ] 404/410 の挙動
- 広告
  - [ ] /ads.txt 200 & 期待内容
- メール
  - [ ] 送受信 OK、Gmail で SPF/DKIM/DMARC=pass

---

## コピペ用コマンド集

### DNS（権威 DNS = 即時の真実）

    dig @ns-a1.conoha.io mamasanmoney-bu.com A +noall +answer
    dig @ns-a1.conoha.io www.mamasanmoney-bu.com CNAME +noall +answer

### DNS（公開 DNS = 伝播確認）

    dig @1.1.1.1 mamasanmoney-bu.com A +noall +answer
    dig @1.1.1.1 www.mamasanmoney-bu.com CNAME +noall +answer
    dig @8.8.8.8 mamasanmoney-bu.com A +noall +answer
    dig @8.8.8.8 www.mamasanmoney-bu.com CNAME +noall +answer

### HTTP/HTTPS/ads.txt

    curl -sS -I http://mamasanmoney-bu.com
    curl -sS -I https://mamasanmoney-bu.com
    curl -sS -I https://www.mamasanmoney-bu.com
    curl -sS -I https://mamasanmoney-bu.com/ads.txt
    curl -sS https://mamasanmoney-bu.com/ads.txt | sed -n '1,20p'

---

## 変更履歴（実行者/日時/メモ）
- 2025-10-10: 初版作成

---

## 備考
- www は CNAME と同名の A/AAAA と共存できません（CNAME 単独にする）。
- AAAA は未設定のまま運用（誤宛先で IPv6 優先 → 失敗の典型を回避）。
- レジストラ移管時はネームサーバを変えないのが無停止のコツ（DNS ホスティング切替は別フェーズで）。

