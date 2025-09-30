# 本番リリース手順（mama-3.com / Vercel DNS）

このチェックリストは「試作がOKになった時」の本番化手順です。

- 事前確認
  - [ ] 画面・動線・文言チェックが完了している
  - [ ] 画像/OGPが崩れていない
  - [ ] スマホ/PCで主要ページを確認（/、/blog、記事詳細、/profile、/contact）

- Vercel プレビューのインデックス制御（任意）
  - [ ] プレビューは `NEXT_PUBLIC_NOINDEX=true` で noindex になっている（不要なら false）

- ドメイン購入（Xserverドメイン + A8.net セルフバック）
  - [ ] A8.net のセルフバックで「Xserverドメイン」案件を開く
  - [ ] 成果条件（本人申込可/対象TLD/税抜基準/併用不可 等）を確認
  - [ ] セルフバックリンクをクリック→同じタブで `mama-3.com` を購入
  - [ ] 注文番号・購入日時のスクショを保存（承認対策）

- ネームサーバーを Vercel に変更（Xserverドメイン管理画面）
  - [ ] `ns1.vercel-dns.com`
  - [ ] `ns2.vercel-dns.com`

- Vercel 側設定（Project → Settings → Domains）
  - [ ] `mama-3.com` を追加（Verified 表示を待つ）
  - [ ] `www.mama-3.com` も追加
  - [ ] Primary を `mama-3.com` に設定（`www`→apex にリダイレクト）

- メール運用（必要な場合のみ）
  - [ ] MX/SPF/DKIM/DMARC を Vercel の DNS に再登録（メール提供元の値を転記）

- 環境変数 & 再デプロイ
  - [ ] Vercel の Production 環境変数に `NEXT_PUBLIC_SITE_URL=https://mama-3.com`
  - [ ] （任意）`NEXT_PUBLIC_GA_ID` を設定（GA4 測定ID）
  - [ ] 必要時のみ `SANITY_READ_TOKEN` を設定（下書き/プレビュー）
  - [ ] 再デプロイが完了

- 動作確認
  - [ ] `https://mama-3.com` で表示OK
  - [ ] `https://www.mama-3.com` → `https://mama-3.com` にリダイレクト
  - [ ] sitemap.xml / robots.txt が正しいURLで生成
  - [ ] OGP（X/Twitter・Facebook・はてブ）でカードが出る

- 検索関連（任意）
  - [ ] Google Search Console にドメイン登録（DNS認証）
  - [ ] GA4 のリアルタイムでPV確認

- 仕上げ
  - [ ] `NEXT_PUBLIC_NOINDEX=false` にして公開状態へ
  - [ ] README に本番URLをメモ

---
補足:
- プレビュー時は noindex のままにし、本番切替で false にします。
- メールを使う予定があれば、DNS移行前に現行レコード値を控えておくと安全です。
