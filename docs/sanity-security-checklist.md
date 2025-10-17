# Sanity セキュリティ/トークン整理チェックリスト（2025-10-14）

## 1) トークン棚卸し
- Manage → API → Tokens
  - 使用中/最終使用日時/権限（Viewer/Editor/Administrator）を確認
  - 目的が曖昧・長期未使用は Revoke（削除）
- 推奨役割
  - SSR閲覧用（Next用）: Viewer（Read）
  - 移行/バッチ: Editor（Write）。Adminは原則禁止

## 2) 環境分離
- production 用と staging 用でトークンを分離（混用しない）
- 変数管理
  - Vercel: Production/Preview で `SANITY_READ_TOKEN` を分離
  - ローカル: `.env.local`（Gitに含めない）

## 3) CORS Origins
- Manage → CORS Origins
  - 本番/プレビュー/localhost 以外を削除
  - `*`（ワイルドカード）は禁止

## 4) API バージョン
- `SANITY_API_VERSION` を固定（日付文字列）。コードと同一の値に統一
- 古い値/プロジェクト内の不一致をなくす

## 5) Webhooks
- 送信先URLの有効性と署名（Secret）を確認
- Secret を定期ローテーション（半年〜年1）

## 6) 最小権限の徹底
- dataset を Private（必要時のみ Public）
- Studio権限はロールで付与（個別トークン配布を避ける）
- Import/Export は Editor トークンのみで実行

## 7) ログ/監査
- 重要操作（大量書き込み/削除）の直後にバックアップを取得
- Token台帳を更新（下記テンプレ）

## 8) トークン台帳テンプレ（例）
```
| Name              | Dataset     | Role   | Holder     | Created    | Last used   | Purpose                 |
|-------------------|-------------|--------|------------|------------|-------------|-------------------------|
| SSR_READ_PROD     | production  | Viewer | Vercel     | 2025-10-01 | 2025-10-14  | Next.js SSR fetch       |
| BATCH_EDITOR_STG  | staging     | Editor | Tools CI   | 2025-10-01 | 2025-10-10  | WXR import / enrichment |
```

## 9) 期限と運用
- 半年ごとに棚卸し（Revoke/Rotate）
- 退職/外部委託終了時は直ちに Revoke

---

備考: 実トークン名・用途はこのドキュメントに追記し、秘密は共有ストレージ（パスワード管理ツール）で保管してください。

