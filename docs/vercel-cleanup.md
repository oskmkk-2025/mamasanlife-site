# Vercel 未使用プロジェクト/環境変数 整理手順（2025-10-14）

目的: 未使用の Vercel プロジェクトと不要な環境変数を整理し、混乱・事故・コストを防ぐ。

## 前提
- 対象: 旧/別プロジェクト（例: mamasan-web, hichimama-site）、不要な Preview/Production の環境変数
- 方針: 「控え → Pause → 確認 → Delete」の二段階。変数はバックアップを必ず取得。

## 1. 現状の控え（必須）
- Dashboard → Project → Settings → Environment Variables → 「Download as .env」
- CLI（任意）: `vercel env pull .env.vercel.backup`

## 2. 未使用プロジェクトの判定
- Dashboard → Overview で最近のデプロイがない/対象外のものを抽出
- まず「Pause」→ 1〜2日様子見 → 問題なければ「Delete」
- 削除前チェック：Domains に本番ドメインが残っていないか / Git連携・Hookが不要か

## 3. ドメイン整理
- 本番プロジェクト（mamasanlife-site想定）にのみ以下が紐づくこと
  - apex: mamasanmoney-bu.com（Primary）
  - www: www.mamasanmoney-bu.com（Redirect → apex）
- 未使用プロジェクトからはドメインを Remove（本番は外さない）

## 4. 環境変数の棚卸し
- 残す（例）
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_VERSION`
  - `SANITY_READ_TOKEN`（Server専用）
  - `NEXT_PUBLIC_SITE_URL`（Production/Previewで分離）
  - `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_ADSENSE_ID`（必要時のみ）
- 消す（例）
  - 使っていない `NEXT_PUBLIC_*`（旧名/旧ドメイン）やダブり
  - 用途不明のREAD/WRITEトークン（Revoke後に削除）
- ルール
  - 機密は `NEXT_PUBLIC_` を付けない
  - Preview の `NEXT_PUBLIC_SITE_URL` はプレビューURLに
  - Production と Preview の値を分離

## 5. Preview 動作確認
- 最新 Preview URL（Deployments 一覧の先頭）で /, /<category>, /search を確認
- ヘッダ: `server: Vercel`, `x-vercel-id` など
- 画像URL: `?auto=format&fit=crop&q=..` が付与されている

## 6. Production 動作確認
- https://mamasanmoney-bu.com/
  - /ads.txt = 200
  - www→apex リダイレクト（301/308）
  - JSON-LD/OG の自己参照が本番URL

## 7. 削除の実行（安全版）
- 未使用プロジェクト: Pause → 1〜2日後に Delete
- 変数: 一旦空値/コメント化 → 問題なければ削除

## 8. ロールバック
- `.env.vercel.backup` から貼り戻し
- プロジェクトは再作成（必要に応じて再リンク/ドメイン再アタッチ）

## 9. 落とし穴
- `NEXT_PUBLIC_SITE_URL` 未設定/古い → OG/JSON-LD が不整合
- Preview 側でwww→apexを強制 → 検証で混乱
- `NEXT_PUBLIC_` に秘密を入れる → 漏洩リスク

## 10. 定常メンテ（四半期）
- 古い Preview を Archive/自動Prune
- Env を棚卸し（ダブり/不要キー整理）

---

メモ: 実プロジェクト名/変数名は必要に応じてこのファイルに追記してください（機密はマスク）。

